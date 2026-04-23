import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { User } from "../models/index.js";
import dotenv from "dotenv";
import { rateLimit } from "express-rate-limit";

dotenv.config();

const router = express.Router();

// --- SECURITY LIMITERS ---

// Strict limiter for login attempts (Brute force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: { error: "Too many login attempts. Your IP has been temporarily blocked for 15 minutes." },
  standardHeaders: true, 
  legacyHeaders: false,
  validate: { trustProxy: false },
  handler: (req, res, next, options) => {
    console.warn(`[SECURITY] Potential brute force attempt from IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

// General limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, 
  validate: { trustProxy: false },
  message: { error: "Excessive authentication requests. Please try again later." }
});

// Passport Serialization (Needed for the OAuth redirect handshake)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Passport Config
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
    proxy: true
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const isAdmin = email === process.env.ADMIN_EMAIL;
      const role = isAdmin ? "admin" : "member";

      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: email,
          avatar: profile.photos[0]?.value,
          role: role
        });
      } else {
        user.googleId = profile.id;
        user.avatar = profile.photos[0]?.value;
        user.role = role; // Keep roles updated if admin status changes
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Email Transporter for Alerts
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendLoginAlert = async (user, method) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: "⚠️ Admin Login Alert - Exact Echo",
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #111; background: #050505; color: #fff; border-radius: 12px;">
        <h2 style="color: #CB2729; margin-bottom: 20px;">Security Notification</h2>
        <p>An admin login was detected on your portfolio dashboard.</p>
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>User:</strong> ${user.name}</p>
          <p><strong>Method:</strong> ${method}</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p style="color: #666; font-size: 12px;">If this wasn't you, please change your credentials immediately.</p>
      </div>
    `
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Failed to send login alert:", err);
  }
};

// --- AUTH ROUTES ---
router.use(authLimiter);

// 1. Password Login (Custom Encrypted)
router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select("+password");
    
    if (!user || user.role !== "admin") {
      return res.status(401).json({ error: "Invalid credentials or unauthorized" });
    }

    // If password is not set yet (first time or seed), we can set it if provided or deny
    // For this implementation, we assume the password exists
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" });
    
    // Send Alert
    await sendLoginAlert(user, "Password Entry");

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Google OAuth
router.get("/google", authLimiter, passport.authenticate("google", { scope: ["profile", "email"], session: false }));

router.get("/google/callback", authLimiter, passport.authenticate("google", { session: false, failureRedirect: "/admin/login?error=unauthorized" }), 
  async (req, res) => {
    try {
      const token = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: "24h" });
      
      // Send Alert
      await sendLoginAlert(req.user, "Google OAuth");

      // Redirect back to frontend with token
      res.redirect(`${process.env.CLIENT_URL}/admin/auth-success?token=${token}`);
    } catch (err) {
      res.redirect(`${process.env.CLIENT_URL}/admin/login?error=server_error`);
    }
  }
);

// 3. Verify Token & Get Current User
router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Helper for first-time password setup (Seed Admin)
router.post("/setup-admin", async (req, res) => {
    const { email, password, secret } = req.body;
    // Simple secret check to prevent abuse
    if (secret !== "exact-echo-setup-2026") return res.status(403).json({ error: "Forbidden" });

    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        let user = await User.findOne({ email });
        if (user) {
            user.password = hashedPassword;
            user.role = "admin";
            await user.save();
        } else {
            user = await User.create({
                name: "Admin",
                email,
                password: hashedPassword,
                role: "admin"
            });
        }
        res.json({ message: "Admin account secured successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
