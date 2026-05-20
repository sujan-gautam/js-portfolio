import express from "express";
import * as Models from "../models/index.js";
import { parser } from "../config/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";

const router = express.Router();

// ── Debug Logger ──
router.use((req, res, next) => {
  console.log(`FEED_ROUTER_LOG: ${req.method} ${req.url}`);
  next();
});

const BANNED_IPS = new Map();
const GLOBAL_RATE_LIMITER = new Map(); // ip -> { count, lastReset }

function checkBan(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  
  // 1. Check if explicitly banned
  if (BANNED_IPS.has(ip) && BANNED_IPS.get(ip) > Date.now()) {
    const minsLeft = Math.ceil((BANNED_IPS.get(ip) - Date.now()) / 60000);
    return res.status(403).json({ error: `Oops! 🙈 You are interacting a bit too fast. Try again in ${minsLeft} minutes! ✨` });
  }
  
  // 2. Clear expired bans
  if (BANNED_IPS.has(ip) && BANNED_IPS.get(ip) <= Date.now()) BANNED_IPS.delete(ip);

  // 3. Global Request Limiting
  const now = Date.now();
  const limiter = GLOBAL_RATE_LIMITER.get(ip) || { count: 0, lastReset: now };
  
  if (now - limiter.lastReset > 10000) { // Reset every 10s
    limiter.count = 1;
    limiter.lastReset = now;
  } else {
    limiter.count += 1;
  }
  
  GLOBAL_RATE_LIMITER.set(ip, limiter);

  if (limiter.count > 15) { // Slightly more lenient
    BANNED_IPS.set(ip, now + 15 * 60 * 1000); // 15 min ban
    return res.status(403).json({ error: "Woah! 🐾 You're moving way too fast! Take a deep breath and come back in 15 minutes. ✨" });
  }

  next();
}

// ═══════════════════════════════════════════════════
// FEED — Dedicated interaction routes
// ═══════════════════════════════════════════════════

// GET published posts
router.get("/feed/posts", async (req, res) => {
  try {
    const posts = await Models.Feed.find({ published: true })
      .sort({ pinned: -1, createdAt: -1 });
    res.json(posts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST vote on a poll option
router.post("/feed/posts/:id/poll/vote", async (req, res) => {
  try {
    console.log(`POLL_VOTE_PROCESS: ID=${req.params.id}`);
    const post = await Models.Feed.findById(req.params.id);
    if (!post || post.type !== "poll") {
      return res.status(404).json({ error: "Poll post not found" });
    }
    
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const { optionId, voterId } = req.body;

    const alreadyVotedByIP = post.pollOptions.some(o => o.voters.includes(ip));
    const alreadyVotedBySession = post.pollOptions.some(o => o.voters.includes(voterId));
    
    if (alreadyVotedByIP || alreadyVotedBySession) {
      return res.status(403).json({ error: "Voice already counted! 🗳️✨" });
    }

    const option = post.pollOptions.id(optionId);
    if (!option) return res.status(404).json({ error: "Option not found" });
    
    option.votes += 1;
    option.voters.push(voterId);
    if (ip !== "unknown") option.voters.push(ip);
    
    await post.save();
    res.json(post);
  } catch (err) { 
    console.error(`POLL_VOTE_CRASH:`, err);
    res.status(500).json({ error: err.message }); 
  }
});

// POST react to a post
router.post("/feed/posts/:id/react", checkBan, async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const { id } = req.params;
    const { type } = req.body;

    // Allowed reactions (union of Feed and BlogPost allowed types)
    const allowed = ["heart", "fire", "like", "wow", "sad", "insightful"];
    if (!allowed.includes(type)) return res.status(400).json({ error: "Invalid reaction" });

    // Try finding in Feed first
    let postObj = await Models.Feed.findById(id);
    let Model = Models.Feed;

    if (!postObj) {
      // Try finding in BlogPost
      postObj = await Models.BlogPost.findById(id);
      Model = Models.BlogPost;
    }

    if (!postObj) return res.status(404).json({ error: "Post not found" });
    if (postObj.reactedIPs?.includes(ip)) return res.status(403).json({ error: "Already reacted! ✨" });

    const inc = {};
    inc[`reactions.${type}`] = 1;
    
    const updated = await Model.findByIdAndUpdate(id, { 
      $inc: inc,
      $push: { reactedIPs: ip } 
    }, { new: true });
    
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Other feed routes (comment, view, share) follow...
router.post("/feed/posts/:id/comment", checkBan, async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const { id } = req.params;
    const { text, author, avatar, votersId } = req.body;
    if (!text) return res.status(400).json({ error: "Comment text required" });

    // Try Feed collection
    let postObj = await Models.Feed.findById(id);
    let Model = Models.Feed;

    if (!postObj) {
      // Try BlogPost collection
      postObj = await Models.BlogPost.findById(id);
      Model = Models.BlogPost;
    }

    if (!postObj) return res.status(404).json({ error: "Post not found" });
    
    const updated = await Model.findByIdAndUpdate(
      id,
      { $push: { comments: { text, author: author || "Visitor", avatar, ip, votersId: votersId || "unknown", createdAt: new Date() } } },
      { new: true }
    );
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/feed/posts/:id/view", async (req, res) => {
  try {
    const { id } = req.params;
    // Try Feed collection
    let post = await Models.Feed.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
    if (!post) {
      // Try BlogPost collection
      post = await Models.BlogPost.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
    }
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ views: post.views });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/feed/posts/:id/share", async (req, res) => {
  try {
    const { id } = req.params;
    // Try Feed collection
    let post = await Models.Feed.findByIdAndUpdate(id, { $inc: { shares: 1 } }, { new: true });
    if (!post) {
      // Try BlogPost collection
      post = await Models.BlogPost.findByIdAndUpdate(id, { $inc: { shares: 1 } }, { new: true });
    }
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ shares: post.shares });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/collection/stories/secure-media", async (req, res) => {
  const { url, token } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url" });
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) return res.status(401).json({ error: "Invalid token" });

    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const folderIndex = pathParts.findIndex(p => p === 'exact-echo');
    if (folderIndex === -1) {
       return res.redirect(url);
    }
    
    // Parse Cloudinary URL accurately
    // Format: https://res.cloudinary.com/<cloud>/<resource_type>/<delivery_type>/v<version>/<public_id>
    const resourceType = pathParts[2] || "image"; 
    const deliveryType = pathParts[3] || "upload"; 
    const publicIdWithExt = pathParts.slice(folderIndex).join('/');
    
    const signedUrl = cloudinary.utils.url(publicIdWithExt, {
       resource_type: resourceType,
       type: deliveryType,
       sign_url: true,
       secure: true
    });
    
    res.redirect(signedUrl);
  } catch (err) {
    res.status(401).json({ error: "Authentication failed" });
  }
});

router.post("/upload", (req, res) => {
  parser.single("file")(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(500).json({ error: err.message || err.toString() });
    }
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ url: req.file.path });
  });
});

// Cloudinary Signature for Direct Frontend Uploads (Chunked)
router.get("/upload/sign", (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
      timestamp: timestamp,
      folder: "exact-echo",
    };
    
    if (process.env.CLOUDINARY_UPLOAD_PRESET) {
      params.upload_preset = process.env.CLOUDINARY_UPLOAD_PRESET;
    }

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      signature,
      timestamp,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      folder: "exact-echo",
      upload_preset: params.upload_preset || ""
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/cv/upload", (req, res) => {
  // Use a custom parser call for CV to allow PDFs as raw files if needed
  parser.single("file")(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(500).json({ error: err.message || err.toString() });
    }
    if (!req.file) return res.status(400).json({ error: "No CV uploaded" });
    
    try {
      const url = req.file.path;
      // Ensure we are storing the full secure Cloudinary URL
      const secureUrl = url.replace("http://", "https://");
      // Update or create About singleton with cvUrl
      let about = await Models.About.findOne({});
      if (about) {
        about = await Models.About.findOneAndUpdate({}, { cvUrl: secureUrl }, { new: true });
      } else {
        about = await Models.About.create({ cvUrl: secureUrl, name: "Sujan Shrestha" });
      }
      res.json({ url: about.cvUrl, about });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});


const collectionMap = {
  users: Models.User,
  portfolio: Models.Portfolio,
  education: Models.Education,
  feed: Models.Feed,
  sliders: Models.Slider,
  services: Models.Service,
  videos: Models.Video,
  funwork: Models.FunWork,
  stories: Models.Story,
  popups: Models.Popup,
  ads: Models.Ad,
  contacts: Models.ContactMessage,
  visitors: Models.VisitorRecord,
  apps: Models.AppModel,
  customers: Models.Customer,
  whatsnew: Models.WhatsNew,
  music: Models.Music,
  updates: Models.Update,
  skills: Models.Skill,
  courtesy: Models.Courtesy,
  blog_posts: Models.BlogPost,
  blog_categories: Models.BlogCategory,
  blog_tags: Models.BlogTag,
  blog_ideas: Models.BlogIdea
};

// Generic CRUD endpoints
router.get("/collection/:name", async (req, res) => {
  const Model = collectionMap[req.params.name];
  if (!Model) return res.status(404).json({ error: "Collection not found" });
  try {
    const data = await Model.find({});
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/collection/:name/:id", async (req, res) => {
  const Model = collectionMap[req.params.name];
  if (!Model) return res.status(404).json({ error: "Collection not found" });
  try {
    const data = await Model.findById(req.params.id);
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/collection/:name", async (req, res) => {
  const Model = collectionMap[req.params.name];
  if (!Model) return res.status(404).json({ error: "Collection not found" });
  try {
    // Frontend passes { id: generateId(), ... } but Mongoose uses _id.
    // We will just store it without the frontend ID and let mongoose generate _id, 
    // and map it to id. So delete frontend's id if exists to avoid conflicts.
    const body = { ...req.body };
    delete body.id;

    const data = await Model.create(body);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/collection/:name/:id", async (req, res) => {
  const Model = collectionMap[req.params.name];
  if (!Model) return res.status(404).json({ error: "Collection not found" });
  try {
    const body = { ...req.body };
    delete body.id; // avoid overwriting _id

    const data = await Model.findByIdAndUpdate(req.params.id, body, { new: true });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/collection/:name/:id", async (req, res) => {
  const Model = collectionMap[req.params.name];
  if (!Model) return res.status(404).json({ error: "Collection not found" });
  try {
    await Model.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/collection/:name", async (req, res) => {
  const Model = collectionMap[req.params.name];
  if (!Model) return res.status(404).json({ error: "Collection not found" });
  try {
    await Model.deleteMany({});
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dynamic Image Redirect for Social Media SEO
router.get("/seo/og-image", async (req, res) => {
  try {
    const settings = await Models.Settings.findOne({});
    const image = settings?.ogImage || settings?.siteLogo || settings?.favicon || 'https://sujan1919.com.np/assets/logo.png';
    res.redirect(302, image);
  } catch (error) {
    res.redirect(302, 'https://sujan1919.com.np/assets/logo.png');
  }
});

// Singletons: About and Settings
router.get("/singleton/:name", async (req, res) => {
  const isAbout = req.params.name === "about";
  const Model = isAbout ? Models.About : Models.Settings;
  try {
    let data = await Model.findOne({});
    if (!data) {
      if (isAbout) {
        data = await Model.create({ name: "Sujan Gautam", title: "Graphic Designer", bio: "Default bio..." });
      } else {
        data = await Model.create({ siteName: "Sujan 1919" });
      }
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Custom Visitor Tracking Route
router.get("/visitors/count", async (req, res) => {
  try {
    const count = await Models.VisitorRecord.countDocuments({});
    res.json({ count: 56170 + count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/visitors/track", async (req, res) => {
  try {
    // Use the real IP resolved by the client's browser (via ipwho.is on the frontend)
    // Fall back to server-side headers only if frontend didn't send it
    let ip = req.body.resolvedIp || req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip || "unknown";
    if (ip && ip.includes(',')) ip = ip.split(',')[0].trim();
    if (ip.includes("::ffff:")) ip = ip.split(":").pop();

    // Location is already resolved by the frontend browser (real visitor IP)
    // If not provided, attempt backend fallback
    let location = req.body.location && req.body.location.city ? req.body.location : {};

    if (!location.city) {
      // Backend fallback for bots/crawlers — uses ip-api.com (free, no key, richest fields)
      try {
        const geo = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,isp,org,as,query`, { timeout: 6000 });
        if (geo.data?.status === "success") {
          location = {
            ip:          geo.data.query,
            city:        geo.data.city,
            district:    geo.data.district,
            region:      geo.data.regionName,
            regionCode:  geo.data.region,
            country:     geo.data.country,
            countryCode: geo.data.countryCode,
            postcode:    geo.data.zip,
            lat:         geo.data.lat,
            lon:         geo.data.lon,
            timezone:    geo.data.timezone,
            isp:         geo.data.isp,
            org:         geo.data.org,
            as:          geo.data.as,
            source:      "ip-api-server"
          };
        }
      } catch (e) { console.error("Geo fallback failed:", e.message); }
    }

    await Models.VisitorRecord.create({
      ip,
      location,
      page: req.body.page || "/",
      device: req.body.device || "desktop",
      browser: req.body.browser || "unknown",
      os: req.body.os || "unknown",
      userAgent: req.headers['user-agent'] || "unknown",
      referrer: req.body.referrer || req.headers['referer'] || "direct",
      utm: req.body.utm || {},
      screenResolution: req.body.screenResolution || "unknown",
      language: req.body.language || "unknown",
      sessionID: req.body.sessionID || "unknown",
      timestamp: new Date()
    });

    const count = await Models.VisitorRecord.countDocuments({});
    res.json({ count: 56170 + count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.put("/collection/stories/:id/view", async (req, res) => {
  try {
    const { device } = req.body;
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const log = { type: 'view', ip, device: device || req.headers['user-agent'] || 'unknown', timestamp: new Date() };
    await Models.Story.findByIdAndUpdate(req.params.id, { 
      $inc: { views: 1 }, 
      $push: { analyticsLogs: log } 
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});



router.post("/collection/stories/:id/comment", checkBan, async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const story = await Models.Story.findById(req.params.id);
    
    if (!story || story.allowComments === false) return res.status(403).json({ error: "Comments are turned off for this story. 🤫" });

    const userComments = (story.comments || []).filter(c => c.ip === ip);
    if (userComments.length >= 3) {
      BANNED_IPS.set(ip, Date.now() + 30 * 60 * 1000); // 30 min ban
      return res.status(403).json({ error: "Woah there! 🐾 You've left 3 comments. Let's give others a chance! ✨" });
    }

    const { text, device } = req.body;
    const devStr = device || req.headers['user-agent'] || 'unknown';
    const newComment = { id: Date.now().toString(), text, createdAt: new Date(), ip, device: devStr };
    const log = { type: 'comment', ip, device: devStr, timestamp: new Date() };
    
    await Models.Story.findByIdAndUpdate(req.params.id, {
       $push: { comments: newComment, analyticsLogs: log }
    });
    res.json(newComment);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/collection/stories/:id/react", checkBan, async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const story = await Models.Story.findById(req.params.id);
    if (!story) return res.status(404).json({ error: "Story not found! 🤷‍♂️" });

    const reactedIPs = story.reactedIPs || [];
    if (reactedIPs.includes(ip)) {
      BANNED_IPS.set(ip, Date.now() + 15 * 60 * 1000); // 15 min ban
      return res.status(403).json({ error: "You already styled this story with some love! 💖" });
    }

    const { type } = req.body;
    await Models.Story.findByIdAndUpdate(req.params.id, { 
      $inc: { [`reacts.${type}`]: 1 },
      $push: { reactedIPs: ip }
    });
    res.json({ success: true });
  } catch(err) { res.status(500).json({error: err.message}); }
});

router.put("/singleton/:name", async (req, res) => {
  const isAbout = req.params.name === "about";
  const Model = isAbout ? Models.About : Models.Settings;
  try {
    const body = { ...req.body };
    delete body.id;
    let data = await Model.findOne({});
    if (data) {
      data = await Model.findOneAndUpdate({}, body, { new: true });
    } else {
      data = await Model.create(body);
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



export default router;
