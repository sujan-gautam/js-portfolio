import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import crudRoutes from "./routes/crudRoutes.js";
import axios from "axios";
import * as cheerio from "cheerio";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

// Ensure database connection is ready before handling any requests (prevents serverless cold-start race conditions)
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log("DB: Connection not ready, connecting...");
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    }
  } catch (err) {
    console.error("DB: Connection failed during request:", err.message);
  }
  next();
});

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
    { url: `${SITE}/blog/`,     priority: "0.9", freq: "daily" },
  ];

  let feedUrls = [], storyUrls = [], blogUrls = [];
  try {
    // Fetching more fields: videoUrl, images, image, content
    const posts = await Models.Feed.find({ published: true }, "_id createdAt caption content images image videoUrl").lean();
    feedUrls = posts.map(p => {
      const title = p.caption ? `${p.caption.slice(0, 70)} | Sujan Gautam` : "Professional Post | Sujan1919 Software Developer";
      return {
        url: `${SITE}/feed/post/${p._id}`,
        lastmod: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : today,
        priority: "0.9",
        freq: "daily",
        image: p.images?.[0] || p.image || null,
        video: p.videoUrl || null,
        title: title,
        desc: p.caption || p.content?.replace(/<[^>]+>/g, '').substring(0, 150) || title
      };
    });
  } catch (e) { console.error("Sitemap feed error:", e.message); }

  try {
    const stories = await Models.Story.find({}, "_id createdAt title mediaUrl type duration").lean();
    storyUrls = stories.map(s => {
      const title = s.title ? `${s.title} | Sujan Gautam Story` : "Exclusive Story | Sujan1919 Software Developer";
      const isVideo = s.type === "video" || (s.mediaUrl && s.mediaUrl.match(/\.(mp4|webm|mov|ogg)$/));
      return {
        url: `${SITE}/story/${s._id}`,
        lastmod: s.createdAt ? new Date(s.createdAt).toISOString().split("T")[0] : today,
        priority: "0.8",
        freq: "weekly",
        image: !isVideo ? s.mediaUrl : null,
        video: isVideo ? s.mediaUrl : null,
        title: title,
        desc: title
      };
    });
  } catch (e) { console.error("Sitemap story error:", e.message); }

  try {
    const blogs = await Models.BlogPost.find({ status: "Published" }, "_id title excerpt featuredImage updatedAt createdAt").lean();
    blogUrls = blogs.map(b => ({
      url: `${SITE}/post/${b._id}`,
      lastmod: (b.updatedAt || b.createdAt) ? new Date(b.updatedAt || b.createdAt).toISOString().split("T")[0] : today,
      priority: "0.8",
      freq: "weekly",
      image: b.featuredImage || null,
      title: b.title,
      desc: b.excerpt || b.title
    }));
  } catch (e) { console.error("Sitemap blog error:", e.message); }

  const escapeXml = (unsafe) => unsafe ? unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
      }
  }) : "";

  const renderUrl = (entry) => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod || today}</lastmod>
    <changefreq>${entry.freq}</changefreq>
    <priority>${entry.priority}</priority>${entry.image ? `
    <image:image>
      <image:loc>${entry.image}</image:loc>${entry.title ? `
      <image:title>${escapeXml(entry.title)}</image:title>` : ""}
    </image:image>` : ""}${entry.video ? `
    <video:video>
      <video:thumbnail_loc>${entry.image || "https://sujan1919.com.np/favicon.png"}</video:thumbnail_loc>
      <video:title>${escapeXml(entry.title)}</video:title>
      <video:description>${escapeXml(entry.desc)}</video:description>
      <video:content_loc>${entry.video}</video:content_loc>
    </video:video>` : ""}
  </url>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${staticPages.map(p => renderUrl({ ...p, lastmod: today })).join("")}
${feedUrls.map(renderUrl).join("")}
${storyUrls.map(renderUrl).join("")}
${blogUrls.map(renderUrl).join("")}
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

// ── Dynamic SEO Meta Tag & Schema Injector (SSR-lite for SPA pages) ──────────
let cachedHtml = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

async function getHtmlTemplate(req) {
  const now = Date.now();
  if (cachedHtml && (now - cacheTime < CACHE_DURATION)) {
    return cachedHtml;
  }

  // PRODUCTION FIRST: Always prefer the compiled dist/index.html
  // Root index.html contains /src/main.tsx which 404s in production
  try {
    const prodLocalPath = path.join(process.cwd(), "dist", "index.html");
    if (fs.existsSync(prodLocalPath)) {
      cachedHtml = fs.readFileSync(prodLocalPath, "utf-8");
      cacheTime = now;
      console.log("SEO: Loaded HTML template from dist/index.html");
      return cachedHtml;
    }
  } catch (err) {
    console.log("dist/index.html not found, trying HTTP fetch...");
  }

  // Fetch the compiled index over HTTP (Vercel serves static dist via /raw-index.html rewrite)
  try {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers.host;
    const url = `${protocol}://${host}/raw-index.html`;
    console.log("SEO: Fetching compiled HTML template from:", url);
    const response = await axios.get(url, { timeout: 5000 });
    if (response.data && typeof response.data === "string" && response.data.includes("</html>")) {
      cachedHtml = response.data;
      cacheTime = now;
      return cachedHtml;
    }
  } catch (err) {
    console.error("HTTP fetch of raw-index.html failed:", err.message);
  }

  // Local dev fallback: root index.html (has /src/main.tsx, only valid with Vite dev server)
  try {
    const devPath = path.join(process.cwd(), "index.html");
    if (fs.existsSync(devPath)) {
      cachedHtml = fs.readFileSync(devPath, "utf-8");
      cacheTime = now;
      console.log("SEO: Loaded HTML template from root index.html (dev mode)");
      return cachedHtml;
    }
  } catch (err) {
    console.log("Root index.html read failed.");
  }

  // Ultimate fallback — minimal shell
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><title>Sujan Gautam</title></head><body><div id="root"></div></body></html>`;
}

app.get("*", async (req, res, next) => {
  // If the request is for API or static assets/files, let Vercel/Express static routing handle it
  if (req.path.startsWith("/api") || req.path.includes(".")) {
    return next();
  }

  try {
    const rawHtml = await getHtmlTemplate(req);
    const $ = cheerio.load(rawHtml);

    // Default metadata values
    let title = "Sujan Gautam — Full-Stack Software Engineer | Hattiesburg, MS";
    let desc = "Sujan Gautam is a full-stack software engineer and web developer based in Hattiesburg, MS. Building responsive websites and digital solutions for clients worldwide. Available for freelance.";
    let keywords = "Sujan Gautam, full stack developer, web developer Hattiesburg MS, freelance web developer, React developer, Node.js developer, software engineer";
    let ogImage = "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236920/exact-echo/og/og_home.jpg";
    let canonicalUrl = `https://sujan1919.com.np${req.path}`;
    let robots = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
    let schemaData = null;

    const pathClean = req.path.replace(/\/$/, ""); // Normalize trailing slashes

    // Helper: build BreadcrumbList schema for any page
    const buildBreadcrumb = (crumbs) => ({
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://sujan1919.com.np/" },
        ...crumbs.map((c, i) => ({ "@type": "ListItem", "position": i + 2, "name": c.name, "item": c.url }))
      ]
    });

    if (pathClean === "" || pathClean === "/") {
      // Home Page
      let servedStory = null;
      if (req.query.story) {
        try {
          servedStory = await Models.Story.findById(req.query.story).lean();
        } catch (e) {
          console.error("SEO: Homepage story query error:", e);
        }
      }

      if (servedStory) {
        const isVideo = servedStory.type === "video";
        const mediaUrl = servedStory.mediaUrl || servedStory.image || "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236706/exact-echo/og/og_feed.jpg";
        title = servedStory.title ? `${servedStory.title} — Sujan Gautam` : "Exclusive Story — Sujan Gautam";
        desc = servedStory.description || servedStory.caption || "View an exclusive story from Sujan Gautam's portfolio.";
        ogImage = servedStory.thumbnail || (isVideo ? "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236706/exact-echo/og/og_feed.jpg" : mediaUrl);
        canonicalUrl = `https://sujan1919.com.np/?story=${req.query.story}`;

        if (servedStory.isMembersOnly) robots = "noindex, nofollow";

        const mediaSchema = isVideo ? {
          "@type": "VideoObject",
          "@id": canonicalUrl + "#video",
          "name": servedStory.title || "Exclusive Story — Sujan Gautam",
          "description": desc,
          "contentUrl": mediaUrl,
          "thumbnailUrl": ogImage,
          "uploadDate": servedStory.createdAt,
          "duration": servedStory.duration ? `PT${servedStory.duration}S` : undefined,
          "author": { "@type": "Person", "@id": "https://sujan1919.com.np/#person", "name": "Sujan Gautam", "url": "https://sujan1919.com.np/" },
          "publisher": {
            "@type": "Person",
            "@id": "https://sujan1919.com.np/#person",
            "name": "Sujan Gautam",
            "url": "https://sujan1919.com.np/",
            "logo": { "@type": "ImageObject", "url": "https://res.cloudinary.com/dspj4fc14/image/upload/v1782238482/exact-echo/favicon.jpg" }
          },
          "url": canonicalUrl
        } : {
          "@type": "ImageObject",
          "@id": canonicalUrl + "#image",
          "name": servedStory.title || "Exclusive Story — Sujan Gautam",
          "description": desc,
          "contentUrl": mediaUrl,
          "url": canonicalUrl,
          "author": { "@type": "Person", "@id": "https://sujan1919.com.np/#person", "name": "Sujan Gautam", "url": "https://sujan1919.com.np/" },
          "uploadDate": servedStory.createdAt
        };

        schemaData = {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": canonicalUrl + "#webpage",
              "url": canonicalUrl,
              "name": title,
              "description": desc,
              "inLanguage": "en-US",
              "isPartOf": { "@id": "https://sujan1919.com.np/#website" },
              "author": { "@id": "https://sujan1919.com.np/#person" },
              "image": { "@type": "ImageObject", "url": ogImage }
            },
            mediaSchema,
            buildBreadcrumb([
              { name: "Stories", url: "https://sujan1919.com.np/feed/" },
              { name: servedStory.title || "Story", url: canonicalUrl }
            ])
          ]
        };
      } else {
        title = "Sujan Gautam — Full-Stack Software Engineer | Hattiesburg, MS";
        desc = "Sujan Gautam is a full-stack software engineer and web developer based in Hattiesburg, MS. Building responsive websites and digital solutions for clients worldwide. Available for freelance.";
        ogImage = "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236920/exact-echo/og/og_home.jpg";
        
        // Fetch live home content for rich schema
        let homeStories = [], homeFeedCount = 0;
        try {
          homeStories = await Models.Story.find({ active: true }).sort({ createdAt: -1 }).limit(6).lean();
          homeFeedCount = await Models.Feed.countDocuments();
        } catch (e) { /* non-critical */ }

        const storyItems = homeStories.map((s, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "url": `https://sujan1919.com.np/story/${s._id}`,
          "name": s.title || "Exclusive Story — Sujan Gautam"
        }));

        schemaData = {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": "https://sujan1919.com.np/#webpage",
              "url": "https://sujan1919.com.np/",
              "name": "Sujan Gautam — Full-Stack Software Engineer | Hattiesburg, MS",
              "description": "Sujan Gautam is a full-stack software engineer and web developer based in Hattiesburg, MS. Building responsive websites and digital solutions for clients worldwide. Available for freelance.",
              "inLanguage": "en-US",
              "isPartOf": { "@id": "https://sujan1919.com.np/#website" },
              "about": { "@id": "https://sujan1919.com.np/#person" },
              "image": {
                "@type": "ImageObject",
                "url": "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236920/exact-echo/og/og_home.jpg",
                "width": 1200,
                "height": 630
              },
              "mainEntity": {
                "@type": "ItemList",
                "name": "Featured Content by Sujan Gautam",
                "description": "Portfolio highlights, stories, posts and media by full-stack developer Sujan Gautam.",
                "numberOfItems": 5 + storyItems.length,
                "itemListElement": [
                  {
                    "@type": "ListItem", "position": 1,
                    "name": "Portfolio Projects",
                    "url": "https://sujan1919.com.np/portfolio/",
                    "description": "Web apps, POS systems and software tools built by Sujan Gautam"
                  },
                  {
                    "@type": "ListItem", "position": 2,
                    "name": `Feed — ${homeFeedCount}+ Posts`,
                    "url": "https://sujan1919.com.np/feed/",
                    "description": "Personal posts, updates and photos by Sujan Gautam"
                  },
                  {
                    "@type": "ListItem", "position": 3,
                    "name": "About Sujan Gautam",
                    "url": "https://sujan1919.com.np/about/",
                    "description": "Full-stack developer, USM Computer Science student, 4.0 GPA, available for freelance"
                  },
                  {
                    "@type": "ListItem", "position": 4,
                    "name": "Blog — Technical Articles",
                    "url": "https://sujan1919.com.np/blog/",
                    "description": "Coding tutorials and web development insights by Sujan Gautam"
                  },
                  {
                    "@type": "ListItem", "position": 5,
                    "name": "Contact & Hire",
                    "url": "https://sujan1919.com.np/contact/",
                    "description": "Hire Sujan Gautam for freelance web development projects"
                  },
                  ...storyItems.map(s => ({ ...s, "position": s.position + 5 }))
                ]
              }
            },
            {
              "@type": "Person",
              "@id": "https://sujan1919.com.np/#person",
              "name": "Sujan Gautam",
              "url": "https://sujan1919.com.np/",
              "image": {
                "@type": "ImageObject",
                "url": ogImage,
                "width": 1200,
                "height": 630
              },
              "jobTitle": "Full-Stack Software Engineer",
              "description": "Full-stack web developer and software engineer based in Hattiesburg, MS. Available for freelance projects.",
              "email": "gautamsujan1919@gmail.com",
              "telephone": "+18179707616",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Hattiesburg",
                "addressRegion": "MS",
                "addressCountry": "US"
              },
              "sameAs": [
                "https://www.instagram.com/webwithfreelancer"
              ],
              "knowsLanguage": ["en", "ne", "hi"],
              "nationality": "Nepalese",
              "alumniOf": [
                {
                  "@type": "EducationalOrganization",
                  "name": "University of Southern Mississippi"
                }
              ]
            },
            {
              "@type": "WebSite",
              "@id": "https://sujan1919.com.np/#website",
              "url": "https://sujan1919.com.np/",
              "name": "Sujan Gautam Portfolio",
              "description": "Portfolio and personal site of Sujan Gautam, full-stack software engineer.",
              "publisher": { "@id": "https://sujan1919.com.np/#person" },
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://sujan1919.com.np/feed/?search={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            },
            buildBreadcrumb([])
          ]
        };
      }
    } else if (pathClean === "/about") {
      title = "About Sujan Gautam — Full-Stack Developer | USM Computer Science, 4.0 GPA";
      desc = "Learn about Sujan Gautam — a 20-year-old full-stack developer at the University of Southern Mississippi (4.0 GPA). Fluent in HTML, CSS, JavaScript, React, Node.js, and Python. 1.5+ years experience, 12+ clients, 35+ projects.";
      keywords = "Sujan Gautam about, USM computer science student, full stack developer skills, React Node.js developer portfolio, Nepali developer USA, software engineer student";
      ogImage = "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236703/exact-echo/og/og_about.jpg";
      
      schemaData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "ProfilePage",
            "url": "https://sujan1919.com.np/about/",
            "name": "About Sujan Gautam",
            "mainEntity": {
              "@type": "Person",
              "@id": "https://sujan1919.com.np/#person",
              "name": "Sujan Gautam",
              "givenName": "Sujan",
              "familyName": "Gautam",
              "birthDate": "2004",
              "gender": "Male",
              "nationality": "Nepalese",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Hattiesburg",
                "addressRegion": "Mississippi",
                "addressCountry": "US"
              },
              "email": "gautamsujan1919@gmail.com",
              "telephone": "+18179707616",
              "knowsAbout": ["HTML", "CSS", "JavaScript", "React", "Node.js", "Python", "Full-Stack Development", "Web Design"],
              "hasCredential": [
                {
                  "@type": "EducationalOccupationalCredential",
                  "credentialCategory": "degree",
                  "educationalLevel": "Bachelor's",
                  "recognizedBy": {
                    "@type": "EducationalOrganization",
                    "name": "University of Southern Mississippi",
                    "address": { "addressLocality": "Hattiesburg", "addressRegion": "MS" }
                  }
                }
              ]
            }
          },
          buildBreadcrumb([{ name: "About", url: "https://sujan1919.com.np/about/" }])
        ]
      };
    } else if (pathClean === "/portfolio") {
      title = "Portfolio — Sujan Gautam | Web Apps, POS Systems & Full-Stack Projects";
      desc = "Browse Sujan Gautam's completed projects: Golden Deals (full-stack Node.js/React), Techy POS (inventory management platform), Mitas Himalayan Kitchen (restaurant website), Trace Time-Travel Debugger. 35+ projects completed.";
      keywords = "Sujan Gautam portfolio, web app projects, POS system developer, React Node.js projects, full stack portfolio, Techy POS, Golden Deals app, Trace debugger";
      ogImage = "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236705/exact-echo/og/og_portfolio.jpg";
      
      let projectsSchema = [];
      try {
        const portfolios = await Models.Portfolio.find({ active: true }).lean();
        projectsSchema = portfolios.map(p => ({
          "@type": p.category?.toLowerCase() === "restaurant" ? "WebSite" : "SoftwareApplication",
          "name": p.title,
          "description": p.description || p.shortDesc || "",
          "applicationCategory": p.category === "pos" ? "BusinessApplication" : p.category === "debugger" ? "DeveloperApplication" : "WebApplication",
          "url": p.link || `https://sujan1919.com.np/portfolio`,
          "author": { "@id": "https://sujan1919.com.np/#person" }
        }));
      } catch (err) {
        console.error("SEO Portfolio query error:", err);
      }

      if (projectsSchema.length === 0) {
        projectsSchema = [
          {
            "@type": "SoftwareApplication",
            "name": "Golden Deals",
            "description": "A full-stack project built with Node.js backend and React-based frontend.",
            "applicationCategory": "WebApplication",
            "url": "https://sujan1919.com.np/golden-deals/",
            "author": { "@id": "https://sujan1919.com.np/#person" }
          },
          {
            "@type": "SoftwareApplication",
            "name": "Techy POS",
            "description": "A custom POS and inventory management platform developed for a specialized electronics franchise.",
            "applicationCategory": "BusinessApplication",
            "url": "https://sujan1919.com.np/techy-pos/",
            "author": { "@id": "https://sujan1919.com.np/#person" }
          },
          {
            "@type": "WebSite",
            "name": "Mitas Himalayan Kitchen",
            "description": "Fully functional restaurant website designed and developed for Mitas Himalayan Kitchen.",
            "url": "https://sujan1919.com.np/mitas-kitchen/",
            "author": { "@id": "https://sujan1919.com.np/#person" }
          },
          {
            "@type": "SoftwareApplication",
            "name": "Trace — Time-Travel Debugger",
            "description": "An advanced interactive tool designed to help developers debug, visualize, and trace code execution.",
            "applicationCategory": "DeveloperApplication",
            "url": "https://trace.sujan1919.com.np",
            "author": { "@id": "https://sujan1919.com.np/#person" }
          }
        ];
      }

      schemaData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "CollectionPage",
            "name": "Sujan Gautam — Project Portfolio",
            "url": "https://sujan1919.com.np/portfolio/",
            "description": "A showcase of full-stack web apps, POS systems, and software tools built by Sujan Gautam.",
            "creator": { "@id": "https://sujan1919.com.np/#person" },
            "hasPart": projectsSchema
          },
          buildBreadcrumb([{ name: "Portfolio", url: "https://sujan1919.com.np/portfolio/" }])
        ]
      };
    } else if (pathClean === "/feed") {
      const postId = req.query.post;
      if (postId) {
        try {
          const post = await Models.Feed.findById(postId).lean();
          if (post) {
            title = post.seoTitle || (post.caption ? `${post.caption.slice(0, 60)} — Sujan Gautam` : "Feed Post — Sujan Gautam");
            desc = post.seoDescription || (post.caption ? post.caption.slice(0, 155) : "Sujan Gautam feed update");
            ogImage = post.images?.[0] || post.image || "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236706/exact-echo/og/og_feed.jpg";
            canonicalUrl = `https://sujan1919.com.np/feed/?post=${postId}`;

            if (post.membersOnly) {
              robots = "noindex, nofollow";
            }

            schemaData = {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "BlogPosting",
                  "@id": canonicalUrl + "#article",
                  "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl },
                  "headline": title.slice(0, 110),
                  "description": desc,
                  "url": canonicalUrl,
                  "datePublished": post.createdAt,
                  "dateModified": post.updatedAt || post.createdAt,
                  "author": { "@type": "Person", "@id": "https://sujan1919.com.np/#person", "name": "Sujan Gautam", "url": "https://sujan1919.com.np/" },
                  "publisher": {
                    "@type": "Person",
                    "@id": "https://sujan1919.com.np/#person",
                    "name": "Sujan Gautam",
                    "url": "https://sujan1919.com.np/",
                    "logo": { "@type": "ImageObject", "url": "https://res.cloudinary.com/dspj4fc14/image/upload/v1782238482/exact-echo/favicon.jpg" }
                  },
                  "image": {
                    "@type": "ImageObject",
                    "url": ogImage,
                    "width": 1200,
                    "height": 630
                  },
                  "interactionStatistic": [
                    {
                      "@type": "InteractionCounter",
                      "interactionType": "https://schema.org/LikeAction",
                      "userInteractionCount": post.likes || 0
                    }
                  ]
                },
                buildBreadcrumb([
                  { name: "Feed", url: "https://sujan1919.com.np/feed/" },
                  { name: title.slice(0, 60), url: canonicalUrl }
                ])
              ]
            };
          }
        } catch (err) {
          console.error("SEO Feed Post fetch error:", err);
        }
      } else {
        title = "Feed — Sujan Gautam | Posts, Updates & Blog";
        desc = "Sujan Gautam's personal feed — posts, updates, photos, and blog entries. Follow along for insights into his development journey and daily life.";
        keywords = "Sujan Gautam feed, sujan1919 blog, developer posts, sujan gautam updates";
        ogImage = "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236706/exact-echo/og/og_feed.jpg";

        schemaData = {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Blog",
              "name": "Sujan Gautam's Feed",
              "url": "https://sujan1919.com.np/feed/",
              "description": "Personal posts, updates and blog entries by Sujan Gautam.",
              "author": { "@id": "https://sujan1919.com.np/#person" }
            },
            buildBreadcrumb([{ name: "Feed", url: "https://sujan1919.com.np/feed/" }])
          ]
        };
      }
    } else if (pathClean.startsWith("/feed/post/") || pathClean.startsWith("/post/")) {
      const parts = pathClean.split("/");
      const postId = parts[parts.length - 1];
      try {
        const post = await Models.Feed.findById(postId).lean();
        if (post) {
          title = post.seoTitle || (post.caption ? `${post.caption.slice(0, 60)} — Sujan Gautam` : "Feed Post — Sujan Gautam");
          desc = post.seoDescription || (post.caption ? post.caption.slice(0, 155) : "Sujan Gautam feed update");
          ogImage = post.images?.[0] || post.image || "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236706/exact-echo/og/og_feed.jpg";
          canonicalUrl = `https://sujan1919.com.np/feed/?post=${postId}`;

          if (post.membersOnly) {
            robots = "noindex, nofollow";
          }

          schemaData = {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BlogPosting",
                "@id": canonicalUrl + "#article",
                "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl },
                "headline": title.slice(0, 110),
                "description": desc,
                "url": canonicalUrl,
                "datePublished": post.createdAt,
                "dateModified": post.updatedAt || post.createdAt,
                "author": { "@type": "Person", "@id": "https://sujan1919.com.np/#person", "name": "Sujan Gautam", "url": "https://sujan1919.com.np/" },
                "publisher": {
                  "@type": "Person",
                  "@id": "https://sujan1919.com.np/#person",
                  "name": "Sujan Gautam",
                  "url": "https://sujan1919.com.np/",
                  "logo": { "@type": "ImageObject", "url": "https://res.cloudinary.com/dspj4fc14/image/upload/v1782238482/exact-echo/favicon.jpg" }
                },
                "image": {
                  "@type": "ImageObject",
                  "url": ogImage,
                  "width": 1200,
                  "height": 630
                },
                "interactionStatistic": [
                  {
                    "@type": "InteractionCounter",
                    "interactionType": "https://schema.org/LikeAction",
                    "userInteractionCount": post.likes || 0
                  }
                ]
              },
              buildBreadcrumb([
                { name: "Feed", url: "https://sujan1919.com.np/feed/" },
                { name: title.slice(0, 60), url: canonicalUrl }
              ])
            ]
          };
        }
      } catch (err) {
        console.error("SEO Direct Post fetch error:", err);
      }
    } else if (pathClean.startsWith("/blog/")) {
      const parts = pathClean.split("/");
      const slug = parts[parts.length - 1];
      try {
        const blog = await Models.BlogPost.findOne({ slug }).lean();
        if (blog) {
          title = blog.seoTitle || `${blog.title} — Sujan Gautam`;
          desc = blog.seoDescription || blog.excerpt || blog.title;
          ogImage = blog.featuredImage || "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236706/exact-echo/og/og_feed.jpg";
          canonicalUrl = `https://sujan1919.com.np/blog/${slug}`;

          schemaData = {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BlogPosting",
                "@id": canonicalUrl + "#article",
                "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl },
                "headline": blog.title,
                "description": desc,
                "url": canonicalUrl,
                "datePublished": blog.createdAt,
                "dateModified": blog.updatedAt || blog.createdAt,
                "author": { "@type": "Person", "@id": "https://sujan1919.com.np/#person", "name": "Sujan Gautam", "url": "https://sujan1919.com.np/" },
                "publisher": {
                  "@type": "Person",
                  "@id": "https://sujan1919.com.np/#person",
                  "name": "Sujan Gautam",
                  "url": "https://sujan1919.com.np/",
                  "logo": { "@type": "ImageObject", "url": "https://res.cloudinary.com/dspj4fc14/image/upload/v1782238482/exact-echo/favicon.jpg" }
                },
                "image": {
                  "@type": "ImageObject",
                  "url": ogImage,
                  "width": 1200,
                  "height": 630
                }
              },
              buildBreadcrumb([
                { name: "Blog", url: "https://sujan1919.com.np/blog/" },
                { name: blog.title, url: canonicalUrl }
              ])
            ]
          };
        }
      } catch (err) {
        console.error("SEO Blog fetch error:", err);
      }
    } else if (pathClean.startsWith("/story/")) {
      const parts = pathClean.split("/");
      const storyId = parts[parts.length - 1];
      try {
        const story = await Models.Story.findById(storyId).lean();
        if (story) {
          const isVideo = story.type === "video";
          const mediaUrl = story.mediaUrl || story.image || "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236706/exact-echo/og/og_feed.jpg";
          title = story.title ? `${story.title} — Sujan Gautam` : "Exclusive Story — Sujan Gautam";
          desc = story.description || story.caption || "View an exclusive story from Sujan Gautam's portfolio.";
          ogImage = story.thumbnail || (isVideo ? "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236706/exact-echo/og/og_feed.jpg" : mediaUrl);
          canonicalUrl = `https://sujan1919.com.np/story/${storyId}`;

          if (story.isMembersOnly) robots = "noindex, nofollow";

          const mediaSchema = isVideo ? {
            "@type": "VideoObject",
            "@id": canonicalUrl + "#video",
            "name": story.title || "Exclusive Story — Sujan Gautam",
            "description": desc,
            "contentUrl": mediaUrl,
            "thumbnailUrl": ogImage,
            "uploadDate": story.createdAt,
            "duration": story.duration ? `PT${story.duration}S` : undefined,
            "author": { "@type": "Person", "@id": "https://sujan1919.com.np/#person", "name": "Sujan Gautam", "url": "https://sujan1919.com.np/" },
            "publisher": {
              "@type": "Person",
              "@id": "https://sujan1919.com.np/#person",
              "name": "Sujan Gautam",
              "url": "https://sujan1919.com.np/",
              "logo": { "@type": "ImageObject", "url": "https://res.cloudinary.com/dspj4fc14/image/upload/v1782238482/exact-echo/favicon.jpg" }
            },
            "url": canonicalUrl
          } : {
            "@type": "ImageObject",
            "@id": canonicalUrl + "#image",
            "name": story.title || "Exclusive Story — Sujan Gautam",
            "description": desc,
            "contentUrl": mediaUrl,
            "url": canonicalUrl,
            "author": { "@type": "Person", "@id": "https://sujan1919.com.np/#person", "name": "Sujan Gautam", "url": "https://sujan1919.com.np/" },
            "uploadDate": story.createdAt
          };

          schemaData = {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebPage",
                "@id": canonicalUrl + "#webpage",
                "url": canonicalUrl,
                "name": title,
                "description": desc,
                "inLanguage": "en-US",
                "isPartOf": { "@id": "https://sujan1919.com.np/#website" },
                "author": { "@id": "https://sujan1919.com.np/#person" },
                "image": { "@type": "ImageObject", "url": ogImage }
              },
              mediaSchema,
              buildBreadcrumb([
                { name: "Stories", url: "https://sujan1919.com.np/feed/" },
                { name: story.title || "Story", url: canonicalUrl }
              ])
            ]
          };
        }
      } catch (err) {
        console.error("SEO Story fetch error:", err);
      }
    } else if (pathClean === "/contact") {
      title = "Contact Sujan Gautam — Hire a Full-Stack Developer | Hattiesburg, MS";
      desc = "Get in touch with Sujan Gautam for freelance web development, collaborations, or project inquiries. Available via email, phone, or social media. Based in Hattiesburg, MS.";
      keywords = "hire Sujan Gautam, contact web developer, freelance developer contact, Sujan Gautam email, full stack developer for hire";
      ogImage = "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236926/exact-echo/og/og_contact.jpg";
      
      schemaData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "ContactPage",
            "name": "Contact Sujan Gautam",
            "url": "https://sujan1919.com.np/contact/",
            "description": "Contact page for hiring or collaborating with Sujan Gautam, full-stack developer.",
            "mainEntity": {
              "@type": "Person",
              "@id": "https://sujan1919.com.np/#person",
              "name": "Sujan Gautam",
              "email": "gautamsujan1919@gmail.com",
              "telephone": "+18179707616",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Hattiesburg",
                "addressRegion": "MS",
                "addressCountry": "US"
              }
            }
          },
          buildBreadcrumb([{ name: "Contact", url: "https://sujan1919.com.np/contact/" }])
        ]
      };
    } else if (pathClean === "/blog") {
      title = "Blog — Sujan Gautam | Technical Articles & Coding Guides";
      desc = "Read the latest articles, coding tutorials, and web development insights by Sujan Gautam. Topics include React, Node.js, and scaling software architectures.";
      keywords = "Sujan Gautam blog, coding guides, web development tutorials, react nodejs developer blog";
      ogImage = "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236706/exact-echo/og/og_feed.jpg";

      schemaData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Blog",
            "name": "Sujan Gautam's Technical Blog",
            "url": "https://sujan1919.com.np/blog/",
            "description": "Read technical articles, tutorials and software engineering insights by Sujan Gautam.",
            "author": { "@id": "https://sujan1919.com.np/#person" }
          },
          buildBreadcrumb([{ name: "Blog", url: "https://sujan1919.com.np/blog/" }])
        ]
      };
    } else if (pathClean === "/trace") {
      title = "Trace — Interactive Time-Travel Debugger | Sujan Gautam";
      desc = "Explore Trace, an advanced time-travel debugger designed to help developers trace, visualize, and debug JavaScript code execution step-by-step in real-time.";
      keywords = "Trace debugger, time travel debugger, javascript debugging tool, sujan gautam trace";
      ogImage = "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236705/exact-echo/og/og_portfolio.jpg";

      schemaData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "SoftwareApplication",
            "name": "Trace — Time-Travel Debugger",
            "description": "An advanced interactive tool designed to help developers debug, visualize, and trace code execution.",
            "applicationCategory": "DeveloperApplication",
            "url": "https://trace.sujan1919.com.np",
            "author": { "@id": "https://sujan1919.com.np/#person" }
          },
          buildBreadcrumb([
            { name: "Portfolio", url: "https://sujan1919.com.np/portfolio/" },
            { name: "Trace", url: "https://sujan1919.com.np/trace/" }
          ])
        ]
      };
    } else if (pathClean === "/techy-pos") {
      title = "Techy POS — Custom Inventory & Retail POS Platform | Sujan Gautam";
      desc = "Explore Techy POS, a custom Point of Sale and inventory management platform designed for specialized electronics retail operations.";
      keywords = "Techy POS, point of sale system, inventory management software, retail dashboard";
      ogImage = "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236705/exact-echo/og/og_portfolio.jpg";

      schemaData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "SoftwareApplication",
            "name": "Techy POS",
            "description": "A custom POS and inventory management platform developed for a specialized electronics franchise.",
            "applicationCategory": "BusinessApplication",
            "url": "https://sujan1919.com.np/techy-pos/",
            "author": { "@id": "https://sujan1919.com.np/#person" }
          },
          buildBreadcrumb([
            { name: "Portfolio", url: "https://sujan1919.com.np/portfolio/" },
            { name: "Techy POS", url: "https://sujan1919.com.np/techy-pos/" }
          ])
        ]
      };
    } else if (pathClean === "/mitas-kitchen") {
      title = "Mitas Himalayan Kitchen — Premium Restaurant Website | Sujan Gautam";
      desc = "Explore the web design and development of Mitas Himalayan Kitchen, a fully functional restaurant website with menu management and ordering.";
      keywords = "restaurant website, mitas kitchen, nepalese restaurant web design, online menu system";
      ogImage = "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236705/exact-echo/og/og_portfolio.jpg";

      schemaData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "name": "Mitas Himalayan Kitchen",
            "description": "Fully functional restaurant website designed and developed for Mitas Himalayan Kitchen.",
            "url": "https://sujan1919.com.np/mitas-kitchen/",
            "author": { "@id": "https://sujan1919.com.np/#person" }
          },
          buildBreadcrumb([
            { name: "Portfolio", url: "https://sujan1919.com.np/portfolio/" },
            { name: "Mitas Kitchen", url: "https://sujan1919.com.np/mitas-kitchen/" }
          ])
        ]
      };
    } else if (pathClean === "/golden-deals") {
      title = "Golden Deals — Full-Stack E-Commerce Web Application | Sujan Gautam";
      desc = "Explore Golden Deals, a robust full-stack e-commerce web application featuring secure payments, cart management, and admin panels.";
      keywords = "e-commerce web application, golden deals online shop, full stack ecommerce portfolio";
      ogImage = "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236705/exact-echo/og/og_portfolio.jpg";

      schemaData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "SoftwareApplication",
            "name": "Golden Deals",
            "description": "A full-stack project built with Node.js backend and React-based frontend.",
            "applicationCategory": "WebApplication",
            "url": "https://sujan1919.com.np/golden-deals/",
            "author": { "@id": "https://sujan1919.com.np/#person" }
          },
          buildBreadcrumb([
            { name: "Portfolio", url: "https://sujan1919.com.np/portfolio/" },
            { name: "Golden Deals", url: "https://sujan1919.com.np/golden-deals/" }
          ])
        ]
      };
    } else if (pathClean === "/webwithfreelancer") {
      title = "Web With Freelancer — Freelance Portal & Client Studio | Sujan Gautam";
      desc = "Explore Web With Freelancer, a client portal and booking workspace designed for seamless digital project delivery.";
      keywords = "freelance developer portal, webwithfreelancer, client management workspace";
      ogImage = "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236705/exact-echo/og/og_portfolio.jpg";

      schemaData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "SoftwareApplication",
            "name": "Web With Freelancer",
            "description": "A client portal and booking workspace designed for seamless digital project delivery.",
            "applicationCategory": "BusinessApplication",
            "url": "https://sujan1919.com.np/webwithfreelancer/",
            "author": { "@id": "https://sujan1919.com.np/#person" }
          },
          buildBreadcrumb([
            { name: "Portfolio", url: "https://sujan1919.com.np/portfolio/" },
            { name: "Web With Freelancer", url: "https://sujan1919.com.np/webwithfreelancer/" }
          ])
        ]
      };
    } else if (pathClean === "/project-ida") {
      title = "Project IDA — Client Custom Design & Web Suite | Sujan Gautam";
      desc = "Explore Project IDA, a specialized full-stack custom web solution and dashboard designed to streamline internal client workflows.";
      keywords = "Project IDA, custom enterprise software, dashboard web app";
      ogImage = "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236705/exact-echo/og/og_portfolio.jpg";

      schemaData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "SoftwareApplication",
            "name": "Project IDA",
            "description": "A specialized full-stack custom web solution and dashboard designed to streamline internal client workflows.",
            "applicationCategory": "BusinessApplication",
            "url": "https://sujan1919.com.np/project-ida/",
            "author": { "@id": "https://sujan1919.com.np/#person" }
          },
          buildBreadcrumb([
            { name: "Portfolio", url: "https://sujan1919.com.np/portfolio/" },
            { name: "Project IDA", url: "https://sujan1919.com.np/project-ida/" }
          ])
        ]
      };
    } else if (pathClean === "/privacy") {
      title = "Privacy Policy — Sujan Gautam";
      desc = "Privacy Policy for sujan1919.com.np. Learn how we handle your personal data and privacy settings.";
      keywords = "privacy policy sujan gautam";
      ogImage = "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236920/exact-echo/og/og_home.jpg";
    } else if (pathClean === "/terms") {
      title = "Terms of Service — Sujan Gautam";
      desc = "Terms of Service for sujan1919.com.np. Read the terms, conditions, and usage policies of this website.";
      keywords = "terms of service sujan gautam";
      ogImage = "https://res.cloudinary.com/dspj4fc14/image/upload/v1782236920/exact-echo/og/og_home.jpg";
    }

    $('title').text(title);
    $('meta[name="description"]').attr('content', desc);

    if ($('link[rel="canonical"]').length > 0) {
      $('link[rel="canonical"]').attr('href', canonicalUrl);
    } else {
      $('head').append(`<link rel="canonical" href="${canonicalUrl}" />`);
    }

    if ($('meta[name="keywords"]').length > 0) {
      $('meta[name="keywords"]').attr('content', keywords);
    } else {
      $('head').append(`<meta name="keywords" content="${keywords}" />`);
    }
    if ($('meta[name="robots"]').length > 0) {
      $('meta[name="robots"]').attr('content', robots);
    } else {
      $('head').append(`<meta name="robots" content="${robots}" />`);
    }

    $('meta[property="og:url"]').attr('content', canonicalUrl);
    $('meta[property="og:title"]').attr('content', title);
    $('meta[property="og:description"]').attr('content', desc);
    $('meta[property="og:image"]').attr('content', ogImage);
    $('meta[property="og:image:alt"]').attr('content', title);

    // Twitter meta uses name= not property=
    $('meta[name="twitter:url"]').attr('content', canonicalUrl);
    $('meta[name="twitter:title"]').attr('content', title);
    $('meta[name="twitter:description"]').attr('content', desc);
    $('meta[name="twitter:image"]').attr('content', ogImage);

    $('script[type="application/ld+json"]').remove();

    if (schemaData) {
      $('head').append(`<script type="application/ld+json">${JSON.stringify(schemaData)}</script>`);
    }

    res.setHeader("Content-Type", "text/html");
    return res.send($.html());
  } catch (err) {
    console.error("Meta injection failed:", err);
    return next();
  }
});

// We still run listen manually if running locally vs Vercel
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
      console.log(`Backend is running on http://localhost:${PORT}`);
    });
}

export default app;
