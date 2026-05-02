import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import crudRoutes from "./routes/crudRoutes.js";
import axios from "axios";
import * as cheerio from "cheerio";
import nodemailer from "nodemailer";

import authRoutes from "./routes/authRoutes.js";
import passport from "passport";

import session from "express-session";

dotenv.config();

// Pre-connect Database (Critical for Vercel/Production)
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error("CRITICAL ERROR: MONGO_URI is missing from environment variables!");
} else {
    console.log("DATABASE_STATUS: Initializing connection...");
    mongoose.set('bufferCommands', false); // Disable buffering to prevent hangs
    
    // Top-Level Await ensures server won't handle requests until DB is ready
    try {
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("DATABASE_STATUS: Connected Successfully");
    } catch (err) {
        console.error("DATABASE_STATUS: Connection Failed ->", err.message);
    }
}

const app = express();
app.enable('trust proxy'); // Trust Vercel's reverse proxy for HTTPS
const PORT = process.env.PORT || 5000;

import CryptoJS from "crypto-js";

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  // Custom domain (primary)
  "https://sujan1919.com.np",
  "https://www.sujan1919.com.np",
  // Vercel deployment URLs (covers all preview & production deployments)
  /\.vercel\.app$/,
  // Local dev
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  // Dynamic CLIENT_URL from env
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, Postman, curl)
    if (!origin) return callback(null, true);
    const allowed = ALLOWED_ORIGINS.some(o =>
      typeof o === "string" ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    console.warn("CORS blocked origin:", origin);
    callback(new Error(`CORS policy: origin ${origin} is not allowed`));
  },
  credentials: true,             // Allow cookies / auth headers
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Requested-With"],
  optionsSuccessStatus: 204,      // Some browsers choke on 200 for OPTIONS
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const SECRET_KEY = process.env.ENCRYPTION_KEY || "exact-echo-super-secret-key-24!";

// Global API Encryption Interceptor
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    // Only encrypt object payloads that are NOT standard errors
    if (body && typeof body === "object" && !body.error && !body.encryptedData && !req.path.includes("health")) {
      try {
        // Convert to plain object if it's a Mongoose document
        const plainBody = (body.toObject && typeof body.toObject === 'function') ? body.toObject() : body;
        const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(plainBody), SECRET_KEY).toString();
        return originalJson.call(this, { encryptedData: ciphertext });
      } catch (err) {
        console.error("Encryption Failed:", err);
        // Fallback to unencrypted if specifically broken, but log it
        return originalJson.call(this, body);
      }
    }
    return originalJson.call(this, body);
  };
  next();
});
app.use(session({
  secret: process.env.SESSION_SECRET || "exactecho_default_secret",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session()); // Session support for passport handshake

// Routes
app.use("/api", crudRoutes);
app.use("/api/auth", authRoutes);

// ── Dynamic Sitemap (Google SEO) ─────────────────────────────────────────────
import * as Models from "./models/index.js";

app.get("/api/sitemap.xml", async (req, res) => {
  const SITE = "https://sujan1919.com.np";
  const today = new Date().toISOString().split("T")[0];

  // Static pages
  const staticPages = [
    { url: `${SITE}/`,          priority: "1.0", freq: "daily" },
    { url: `${SITE}/about/`,    priority: "0.8", freq: "monthly" },
    { url: `${SITE}/feed/`,     priority: "0.9", freq: "daily" },
    { url: `${SITE}/portfolio/`,priority: "0.9", freq: "weekly" },
    { url: `${SITE}/contact/`,  priority: "0.7", freq: "yearly" },
  ];

  let feedUrls = [], storyUrls = [];
  try {
    const posts = await Models.Feed.find({ published: true }, "_id createdAt caption images image").lean();
    feedUrls = posts.map(p => {
      const title = p.caption ? `${p.caption.slice(0, 70)} | Sujan Gautam` : "Professional Post | Sujan1919 Software Developer";
      return {
        url: `${SITE}/feed/post/${p._id}`,
        lastmod: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : today,
        priority: "0.9",
        freq: "daily",
        image: p.images?.[0] || p.image || null,
        title: title
      };
    });
  } catch (e) { console.error("Sitemap feed error:", e.message); }

  try {
    const stories = await Models.Story.find({}, "_id createdAt title mediaUrl").lean();
    storyUrls = stories.map(s => {
      const title = s.title ? `${s.title} | Sujan Gautam Story` : "Exclusive Story | Sujan1919 Software Developer";
      return {
        url: `${SITE}/story/${s._id}`,
        lastmod: s.createdAt ? new Date(s.createdAt).toISOString().split("T")[0] : today,
        priority: "0.8",
        freq: "weekly",
        image: s.mediaUrl || null,
        title: title
      };
    });
  } catch (e) { console.error("Sitemap story error:", e.message); }

  const renderUrl = (entry) => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod || today}</lastmod>
    <changefreq>${entry.freq}</changefreq>
    <priority>${entry.priority}</priority>${entry.image ? `
    <image:image>
      <image:loc>${entry.image}</image:loc>${entry.title ? `
      <image:title>${entry.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")}</image:title>` : ""}
    </image:image>` : ""}
  </url>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticPages.map(p => renderUrl({ ...p, lastmod: today })).join("")}
${feedUrls.map(renderUrl).join("")}
${storyUrls.map(renderUrl).join("")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, max-age=3600"); // Cache 1 hour
  res.send(xml);
});


// ── Analytics Insights API ────────────────────────────────────────────────────
app.get("/api/analytics/insights", async (req, res) => {
  try {
    const { period = "30d" } = req.query;
    const now = new Date();
    const periodMap = { "7d": 7, "30d": 30, "90d": 90, "365d": 365, "all": 36500 };
    const days = periodMap[period] || 30;
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const match = { timestamp: { $gte: since } };

    const [
      totalVisits,
      uniqueSessions,
      bounceData,
      avgTimeSpent,
      topPages,
      topCountries,
      topCities,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      trafficSources,
      utmCampaigns,
      hourlyDistribution,
      dailyTrend,
      weeklyTrend,
      languageBreakdown,
      screenResolutions,
      returnVsNew,
      connectionTypes,
      scrollDepthAvg,
      pageViewsPerSession,
      topISPs,
      exitPages,
      entryPages,
    ] = await Promise.all([
      // 1. Total visits
      Models.VisitorRecord.countDocuments(match),

      // 2. Unique sessions
      Models.VisitorRecord.distinct("sessionID", match).then(s => s.filter(Boolean).length),

      // 3. Bounce rate
      Models.VisitorRecord.aggregate([
        { $match: match },
        { $group: { _id: null,
            total: { $sum: 1 },
            bounced: { $sum: { $cond: [{ $eq: ["$bounced", true] }, 1, 0] } }
        }},
        { $project: { bounceRate: { $multiply: [{ $divide: ["$bounced", "$total"] }, 100] }, _id: 0 } }
      ]),

      // 4. Avg time spent (seconds)
      Models.VisitorRecord.aggregate([
        { $match: { ...match, timeSpent: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: "$timeSpent" } } }
      ]),

      // 5. Top pages
      Models.VisitorRecord.aggregate([
        { $match: match },
        { $group: { _id: "$page", visits: { $sum: 1 }, avgTime: { $avg: "$timeSpent" }, bounces: { $sum: { $cond: ["$bounced", 1, 0] } } } },
        { $sort: { visits: -1 } }, { $limit: 15 },
        { $project: { _id: 0, page: "$_id", visits: 1, avgTime: 1, bounces: 1 } }
      ]),

      // 6. Top countries
      Models.VisitorRecord.aggregate([
        { $match: match },
        { $group: { _id: "$location.country", visits: { $sum: 1 }, code: { $first: "$location.countryCode" } } },
        { $sort: { visits: -1 } }, { $limit: 15 },
        { $project: { _id: 0, country: "$_id", visits: 1, code: 1 } }
      ]),

      // 7. Top cities
      Models.VisitorRecord.aggregate([
        { $match: match },
        { $group: { _id: { city: "$location.city", country: "$location.country" }, visits: { $sum: 1 } } },
        { $sort: { visits: -1 } }, { $limit: 15 },
        { $project: { _id: 0, city: "$_id.city", country: "$_id.country", visits: 1 } }
      ]),

      // 8. Device breakdown
      Models.VisitorRecord.aggregate([
        { $match: match },
        { $group: { _id: "$device", visits: { $sum: 1 }, avgTime: { $avg: "$timeSpent" } } },
        { $sort: { visits: -1 } }
      ]),

      // 9. Browser breakdown
      Models.VisitorRecord.aggregate([
        { $match: match },
        { $group: { _id: "$browser", visits: { $sum: 1 } } },
        { $sort: { visits: -1 } }, { $limit: 10 }
      ]),

      // 10. OS breakdown
      Models.VisitorRecord.aggregate([
        { $match: match },
        { $group: { _id: "$os", visits: { $sum: 1 } } },
        { $sort: { visits: -1 } }, { $limit: 10 }
      ]),

      // 11. Traffic sources (referrer/utm)
      Models.VisitorRecord.aggregate([
        { $match: match },
        { $addFields: { source: { $cond: [
          { $and: [{ $ne: ["$utm.source", ""] }, { $ne: ["$utm.source", null] }] },
          { $concat: ["utm:", "$utm.source"] },
          { $cond: [
            { $or: [{ $eq: ["$referrer", "direct"] }, { $eq: ["$referrer", null] }, { $eq: ["$referrer", ""] }] },
            "direct",
            "$referrer"
          ]}
        ]}}},
        { $group: { _id: "$source", visits: { $sum: 1 } } },
        { $sort: { visits: -1 } }, { $limit: 12 }
      ]),

      // 12. UTM campaigns
      Models.VisitorRecord.aggregate([
        { $match: { ...match, "utm.campaign": { $nin: [null, ""] } } },
        { $group: { _id: { campaign: "$utm.campaign", source: "$utm.source", medium: "$utm.medium" }, visits: { $sum: 1 } } },
        { $sort: { visits: -1 } }, { $limit: 10 }
      ]),

      // 13. Visits by hour of day (heatmap)
      Models.VisitorRecord.aggregate([
        { $match: match },
        { $group: { _id: { $hour: "$timestamp" }, visits: { $sum: 1 } } },
        { $sort: { "_id": 1 } }
      ]),

      // 14. Daily trend
      Models.VisitorRecord.aggregate([
        { $match: match },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, visits: { $sum: 1 }, avgTime: { $avg: "$timeSpent" } } },
        { $sort: { "_id": 1 } }
      ]),

      // 15. Weekly trend (day of week)
      Models.VisitorRecord.aggregate([
        { $match: match },
        { $group: { _id: { $dayOfWeek: "$timestamp" }, visits: { $sum: 1 } } },
        { $sort: { "_id": 1 } }
      ]),

      // 16. Language breakdown
      Models.VisitorRecord.aggregate([
        { $match: match },
        { $group: { _id: "$language", visits: { $sum: 1 } } },
        { $sort: { visits: -1 } }, { $limit: 10 }
      ]),

      // 17. Screen resolutions
      Models.VisitorRecord.aggregate([
        { $match: match },
        { $group: { _id: "$screenResolution", visits: { $sum: 1 } } },
        { $sort: { visits: -1 } }, { $limit: 10 }
      ]),

      // 18. Returning vs new visitors
      Models.VisitorRecord.aggregate([
        { $match: match },
        { $group: { _id: "$isReturning", count: { $sum: 1 } } }
      ]),

      // 19. Connection types
      Models.VisitorRecord.aggregate([
        { $match: match },
        { $group: { _id: "$connectionType", visits: { $sum: 1 } } },
        { $sort: { visits: -1 } }
      ]),

      // 20. Avg scroll depth
      Models.VisitorRecord.aggregate([
        { $match: { ...match, scrollDepth: { $gt: 0 } } },
        { $group: { _id: "$page", avgScroll: { $avg: "$scrollDepth" }, visits: { $sum: 1 } } },
        { $sort: { visits: -1 } }, { $limit: 10 }
      ]),

      // 21. Page views per session
      Models.VisitorRecord.aggregate([
        { $match: match },
        { $group: { _id: "$sessionID", pageViews: { $max: "$pageViews" } } },
        { $group: { _id: null, avg: { $avg: "$pageViews" }, max: { $max: "$pageViews" } } }
      ]),

      // 22. Top ISPs
      Models.VisitorRecord.aggregate([
        { $match: match },
        { $group: { _id: "$location.isp", visits: { $sum: 1 } } },
        { $sort: { visits: -1 } }, { $limit: 10 }
      ]),

      // 23. Exit pages
      Models.VisitorRecord.aggregate([
        { $match: { ...match, exitPage: { $nin: [null, ""] } } },
        { $group: { _id: "$exitPage", count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 }
      ]),

      // 24. Entry pages
      Models.VisitorRecord.aggregate([
        { $match: { ...match, entryPage: { $nin: [null, ""] } } },
        { $group: { _id: "$entryPage", count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 }
      ]),
    ]);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    res.json({
      period,
      summary: {
        totalVisits,
        uniqueSessions,
        bounceRate: bounceData[0]?.bounceRate?.toFixed(1) || 0,
        avgTimeSpent: Math.round(avgTimeSpent[0]?.avg || 0),
        pageViewsPerSession: pageViewsPerSession[0]?.avg?.toFixed(1) || 1,
      },
      topPages: topPages.map(p => ({ ...p, avgTime: Math.round(p.avgTime || 0) })),
      topCountries,
      topCities: topCities.filter(c => c.city),
      deviceBreakdown: deviceBreakdown.map(d => ({ name: d._id || "unknown", visits: d.visits, avgTime: Math.round(d.avgTime || 0) })),
      browserBreakdown: browserBreakdown.map(b => ({ name: b._id || "other", visits: b.visits })),
      osBreakdown: osBreakdown.map(o => ({ name: o._id || "other", visits: o.visits })),
      trafficSources: trafficSources.map(s => ({ name: s._id || "direct", visits: s.visits })),
      utmCampaigns: utmCampaigns.map(u => ({ campaign: u._id.campaign, source: u._id.source, medium: u._id.medium, visits: u.visits })),
      hourlyDistribution: Array.from({ length: 24 }, (_, h) => ({
        hour: `${h.toString().padStart(2,"0")}:00`,
        visits: hourlyDistribution.find(d => d._id === h)?.visits || 0
      })),
      dailyTrend: dailyTrend.map(d => ({ date: d._id, visits: d.visits, avgTime: Math.round(d.avgTime || 0) })),
      weeklyTrend: weeklyTrend.map(d => ({ day: dayNames[(d._id - 1) % 7], visits: d.visits })),
      languageBreakdown: languageBreakdown.map(l => ({ name: l._id || "unknown", visits: l.visits })),
      screenResolutions: screenResolutions.map(s => ({ name: s._id || "unknown", visits: s.visits })),
      returnVsNew: {
        returning: returnVsNew.find(r => r._id === true)?.count || 0,
        new: returnVsNew.find(r => r._id === false)?.count || 0,
      },
      connectionTypes: connectionTypes.filter(c => c._id).map(c => ({ name: c._id, visits: c.visits })),
      scrollDepthAvg: scrollDepthAvg.map(s => ({ page: s._id, avgScroll: Math.round(s.avgScroll || 0), visits: s.visits })),
      topISPs: topISPs.filter(i => i._id).map(i => ({ name: i._id, visits: i.visits })),
      exitPages: exitPages.map(e => ({ page: e._id, count: e.count })),
      entryPages: entryPages.map(e => ({ page: e._id, count: e.count })),
    });
  } catch (err) {
    console.error("Analytics insights error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Update session analytics (time spent, scroll, clicks) ────────────────────
app.post("/api/analytics/update-session", async (req, res) => {
  try {
    const { sessionID, page, timeSpent, scrollDepth, clickCount, exitPage, pageViews, bounced } = req.body;
    if (!sessionID) return res.status(400).json({ error: "sessionID required" });

    await Models.VisitorRecord.updateMany(
      { sessionID, page },
      { $set: {
        timeSpent: timeSpent || 0,
        scrollDepth: scrollDepth || 0,
        clickCount: clickCount || 0,
        exitPage: exitPage || page,
        pageViews: pageViews || 1,
        bounced: bounced !== false,
      }}
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




// Link Preview Utils Endpoint
app.get("/api/utils/link-preview", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const { data } = await axios.get(url, {
      timeout: 8000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const $ = cheerio.load(data);
    const metadata = {
      url,
      title: $('meta[property="og:title"]').attr('content') || $('title').text() || '',
      description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || '',
      domain: ""
    };

    try {
      metadata.domain = new URL(url).hostname.replace('www.', '').toUpperCase();
    } catch (e) {
      metadata.domain = "EXTERNAL LINK";
    }

    res.json(metadata);
  } catch (err) {
    console.error("Link Preview fetch error for URL:", url, err.message);
    
    // Graceful fallback: Still return the domain parsed from URL even if the site blocks us
    try {
      const hostname = new URL(url).hostname.replace('www.', '').toUpperCase();
      return res.json({
        url,
        title: hostname,
        description: "Visit site to see more details.",
        image: "",
        domain: hostname
      });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch link metadata" });
    }
  }
});

// Content Refiner (AI Formatting)
app.post("/api/utils/refine-content", async (req, res) => {
  const { text, context } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) return res.status(500).json({ error: "Gemini API Key not configured" });

  const MODEL = "gemini-3-flash-preview"; 
  
  const prompt = `
  You are an elite professional copywriter and editor. Your goal is to refine the provided text to be high-impact, professional, and sophisticated—yet natural, as if written by a top-tier human professional.

  RULES:
  1. CONTEXT: ${context || "General professional content"}
  2. If the field is a short identifier (like "Degree", "Institution", "Name", "Title", "Skill", "Category", "Year"), keep the refinement extremely concise (usually 1-5 words). Do NOT turn it into a sentence or description.
  3. Avoid generic "AI-speak" or corporate cliches (e.g., don't use "Architecture of", "Spearheading", "Committed to excellence" unless it's genuinely the best fit).
  4. Write with a human touch—clean, clear, and authoritative.
  5. Output ONLY the refined text. No preamble, no quotes, no explanations.

  Original Text: "${text}"
  `;

  const KEYS = [
    GEMINI_KEY, 
    ...(process.env.GEMINI_FALLBACK_KEYS || "").split(",").map(k => k.trim())
  ].filter(Boolean);

  let refinedText = text;
  let success = false;

  for (const key of KEYS) {
    try {
      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
        contents: [{ parts: [{ text: prompt }] }]
      });
      refinedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || text;
      success = true;
      break;
    } catch (err) {
      console.error(`Gemini Refine Error with key ${key.substring(0, 10)}... :`, err.response?.status || err.message);
    }
  }

  if (!success) {
    res.status(500).json({ error: "Failed to refine content with AI. All API keys exhausted."});
  }

  res.json({ refined: refinedText.trim() });
});

// Chat AI Endpoint (from Portfolio/About)
app.post("/api/ai/ask", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  const KEYS = [
    process.env.GEMINI_API_KEY, 
    ...(process.env.GEMINI_FALLBACK_KEYS || "").split(",").map(k => k.trim())
  ].filter(Boolean);

  let answer = null;
  let success = false;
  const MODEL = "gemini-3-flash-preview";

  for (const key of KEYS) {
    try {
      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
        contents: [{ parts: [{ text: prompt }] }]
      });
      answer = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      success = true;
      break;
    } catch (err) {
      console.error(`Gemini Chat Error with key ${key.substring(0, 10)}... :`, err.response?.status || err.message);
    }
  }

  if (!success) {
    return res.status(500).json({ error: "All Gemini API keys failed to generate content." });
  }

  res.json({ answer: answer || "I couldn't generate a response." });
});

// Nodemailer Config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post("/api/contact/email", async (req, res) => {
  const { name, email, phone, message } = req.body;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Send to self
    subject: `New Collab/Hire Inquiry from ${name || "Visitor"}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #CB2729;">New Project Inquiry</h2>
        <p><strong>Name:</strong> ${name || "N/A"}</p>
        <p><strong>Contact Info:</strong> ${email || phone || "N/A"}</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #CB2729;">
          ${message || "No message provided."}
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 10px; color: #999;">Sent from your Portfolio AI Assistant</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    if (error.message.includes("Invalid login")) {
       return res.status(200).json({ success: false, error: "SMTP Authentication Failed. Your Google App Password in .env is invalid or expired." });
    }
    console.error("Email send error:", error);
    res.status(200).json({ success: false, error: "Backend failed to send email. Check Nodemailer config." });
  }
});

// Database seed test wrapper route (for dev initialization)
app.post("/api/seed", async (req, res) => {
    // You can call this from the frontend initialization if needed
    // The singletons create themselves if missing
    res.json({ message: "Seed endpoint hit." });
});

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    api: "live", 
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// We still run listen manually if running locally vs Vercel
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
      console.log(`Backend is running on http://localhost:${PORT}`);
    });
}

export default app;
