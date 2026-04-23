import express from "express";
import * as Models from "../models/index.js";
import { parser } from "../config/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";

const router = express.Router();

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
  courtesy: Models.Courtesy
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
    await Models.VisitorRecord.create({
      ip: req.ip || "unknown",
      page: req.body.page || "/",
      device: req.body.device || "browser",
      browser: req.body.browser || "unknown",
      timestamp: new Date()
    });
    const count = await Models.VisitorRecord.countDocuments({});
    // Add real database count to the base "legacy" count so it increases on every visit
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

  // 3. Global Request Limiting (e.g., max 10 Feed interactions per 10 seconds)
  const now = Date.now();
  const limiter = GLOBAL_RATE_LIMITER.get(ip) || { count: 0, lastReset: now };
  
  if (now - limiter.lastReset > 10000) { // Reset every 10s
    limiter.count = 1;
    limiter.lastReset = now;
  } else {
    limiter.count += 1;
  }
  
  GLOBAL_RATE_LIMITER.set(ip, limiter);

  if (limiter.count > 12) { // Allow slightly higher burst but block abuse
    BANNED_IPS.set(ip, now + 15 * 60 * 1000); // 15 min ban
    return res.status(403).json({ error: "Woah! 🐾 You're moving way too fast! Take a deep breath and come back in 15 minutes. ✨" });
  }

  next();
}

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


// ═══════════════════════════════════════════════════
// FEED — Dedicated interaction routes
// ═══════════════════════════════════════════════════

// GET published posts (sorted: pinned first, then newest)
router.get("/feed/posts", async (req, res) => {
  try {
    const posts = await Models.Feed.find({ published: true })
      .sort({ pinned: -1, createdAt: -1 });
    res.json(posts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST react to a post  { type: "heart"|"fire"|"like"|"wow"|"sad" }
router.post("/feed/posts/:id/react", checkBan, async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const postObj = await Models.Feed.findById(req.params.id);
    if (!postObj) return res.status(404).json({ error: "Post not found" });

    // Limit to 1 reaction per IP per post
    if (postObj.reactedIPs?.includes(ip)) {
      BANNED_IPS.set(ip, Date.now() + 10 * 60 * 1000); // 10 min ban for trying to double react
      return res.status(403).json({ error: "You've already shared your vibe on this post! ✨" });
    }

    const { type } = req.body;
    const allowed = ["heart", "fire", "like", "wow", "sad"];
    if (!allowed.includes(type)) return res.status(400).json({ error: "Invalid reaction" });
    
    const inc = {};
    inc[`reactions.${type}`] = 1;
    const updated = await Models.Feed.findByIdAndUpdate(req.params.id, { 
      $inc: inc,
      $push: { reactedIPs: ip } 
    }, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST add comment
router.post("/feed/posts/:id/comment", checkBan, async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const postObj = await Models.Feed.findById(req.params.id);
    if (!postObj) return res.status(404).json({ error: "Post not found" });

    const { text, author, avatar, votersId } = req.body;
    
    // Check by both IP and votersId
    const hasCommentedByIP = (postObj.comments || []).some(c => c.ip === ip);
    const hasCommentedBySession = votersId && (postObj.comments || []).some(c => c.votersId === votersId);

    if (hasCommentedByIP || hasCommentedBySession) {
      BANNED_IPS.set(ip, Date.now() + 15 * 60 * 1000); // 15 min ban for trying to double comment
      return res.status(403).json({ error: "One definitive thought per post! You've already shared yours. ✨" });
    }

    if (!text) return res.status(400).json({ error: "Comment text required" });
    
    const updated = await Models.Feed.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { text, author: author || "Visitor", avatar, ip, votersId: votersId || "unknown", createdAt: new Date() } } },
      { new: true }
    );
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE a comment from post
router.delete("/feed/posts/:id/comment/:commentId", async (req, res) => {
  try {
    const post = await Models.Feed.findByIdAndUpdate(
      req.params.id,
      { $pull: { comments: { _id: req.params.commentId } } },
      { new: true }
    );
    res.json(post);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST react to a comment  { type: "heart"|"fire"|"laugh" }
router.post("/feed/posts/:id/comment/:commentId/react", async (req, res) => {
  try {
    const { type } = req.body;
    const post = await Models.Feed.findById(req.params.id);
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    comment.reactions[type] = (comment.reactions[type] || 0) + 1;
    await post.save();
    res.json(post);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST vote on a poll option  { optionId, voterId }
router.post("/feed/posts/:id/poll/vote", checkBan, async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const post = await Models.Feed.findById(req.params.id);
    if (!post || post.type !== "poll") return res.status(400).json({ error: "Not a poll" });
    
    // Prevent double voting by IP as well as voterId
    const alreadyVotedByIP = post.pollOptions.some(o => o.voters.includes(ip));
    const { optionId, voterId } = req.body;
    const alreadyVotedBySession = post.pollOptions.some(o => o.voters.includes(voterId));
    
    if (alreadyVotedByIP || alreadyVotedBySession) {
      BANNED_IPS.set(ip, Date.now() + 15 * 60 * 1000); // 15 min ban for double voting attempt
      return res.status(403).json({ error: "Your voice has already been counted in this poll! 🗳️✨" });
    }

    const option = post.pollOptions.id(optionId);
    if (!option) return res.status(404).json({ error: "Option not found" });
    option.votes += 1;
    option.voters.push(voterId);
    if (ip !== "unknown") option.voters.push(ip);
    await post.save();
    res.json(post);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST increment view count
router.post("/feed/posts/:id/view", async (req, res) => {
  try {
    const post = await Models.Feed.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
    res.json({ views: post.views });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST increment share count
router.post("/feed/posts/:id/share", async (req, res) => {
  try {
    const post = await Models.Feed.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } }, { new: true });
    res.json({ shares: post.shares });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
