import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String, 
  email: { type: String, required: true, unique: true }, 
  password: { type: String, select: false }, // Hidden by default for security
  googleId: String,
  avatar: String,
  role: { type: String, default: "visitor" }, 
  status: { type: String, default: "active" }, 
  createdAt: { type: Date, default: Date.now }
});
const PortfolioSchema = new mongoose.Schema({
  title: String, 
  description: String, 
  image: String, 
  category: String, 
  demoUrl: String, 
  link: String, // Sync with frontend
  tags: String, // Sync with frontend
  status: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { strict: false });
const EducationSchema = new mongoose.Schema({
  degree: String,
  institution: String,
  title: String, // Fallback
  year: String, 
  description: String, 
  image: String,
  status: { type: Boolean, default: true }
}, { strict: false });
const CommentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String, default: "Visitor" },
  avatar: String,
  ip: String,
  votersId: String,
  createdAt: { type: Date, default: Date.now },
  reactions: {
    heart: { type: Number, default: 0 },
    fire: { type: Number, default: 0 },
    laugh: { type: Number, default: 0 },
  }
});

const PollOptionSchema = new mongoose.Schema({
  label: String,
  votes: { type: Number, default: 0 },
  voters: [String], // track IP/session to prevent double votes
});

const FeedSchema = new mongoose.Schema({
  type: { type: String, enum: ["text", "image", "poll", "video", "reel"], default: "text" },
  // Text / Caption content
  content: String,
  // Image post fields
  image: String,
  images: [String],
  imageLayout: { type: String, enum: ["default", "polaroid"], default: "default" },
  imageCaptions: [String],
  textLayout: { type: String, enum: ["default", "quote"], default: "default" },
  caption: String,
  location: String,
  // Poll fields
  pollQuestion: String,
  pollOptions: [PollOptionSchema],
  pollEndsAt: Date,
  // Metadata
  tags: [String],
  pinned: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
  // Engagement
  views: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  reactions: {
    heart: { type: Number, default: 0 },
    fire: { type: Number, default: 0 },
    like: { type: Number, default: 0 },
    wow: { type: Number, default: 0 },
    sad: { type: Number, default: 0 },
  },
  comments: [CommentSchema],
  reactedIPs: [String],
  externalLink: String,
  linkPreview: {
    url: String,
    title: String,
    description: String,
    image: String,
    domain: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { strict: false });

const SliderSchema = new mongoose.Schema({
  title: String, subtitle: String, image: String, order: Number, active: Boolean
});
const ServiceSchema = new mongoose.Schema({
  title: String, description: String, icon: String, active: Boolean
});
const VideoSchema = new mongoose.Schema({
  title: String, url: String, thumbnail: String, description: String, createdAt: Date
});
const FunWorkSchema = new mongoose.Schema({
  title: String, image: String, description: String, category: String
});
const StorySchema = new mongoose.Schema({
  title: String, 
  image: String, 
  type: { type: String, enum: ["image", "video", "gif"], default: "image" },
  active: Boolean, 
  createdAt: Date
}, { strict: false });
const PopupSchema = new mongoose.Schema({
  title: String, content: String, image: String, active: Boolean, startDate: String, endDate: String
});
const AdSchema = new mongoose.Schema({
  title: String, image: String, link: String, position: String, active: Boolean, impressions: Number, clicks: Number
});
const ContactMessageSchema = new mongoose.Schema({
  name: String, email: String, subject: String, message: String, read: Boolean, createdAt: Date
});
const VisitorRecordSchema = new mongoose.Schema({
  ip: String, page: String, device: String, browser: String, timestamp: Date
});
const AppSchema = new mongoose.Schema({
  name: String, platform: String, downloadUrl: String, icon: String, description: String, active: Boolean
});
const CustomerSchema = new mongoose.Schema({
  name: String, email: String, company: String, project: String, status: String
});
const WhatsNewSchema = new mongoose.Schema({
  title: String, description: String, version: String, createdAt: Date
});
const MusicSchema = new mongoose.Schema({
  title: String, artist: String, url: String, active: Boolean,
  videoId: String, startTime: Number, endTime: Number
});
const UpdateSchema = new mongoose.Schema({
  title: String, description: String, type: String, createdAt: Date
});
const SkillSchema = new mongoose.Schema({
  name: String, image: String, proficiency: Number
});

const AboutSchema = new mongoose.Schema({
  name: String, title: String, bio: String, description: String, phone: String, email: String, address: String, 
  dob: String, nationality: String, languages: String, experience: String, clients: String, projects: String,
  skill: String, age: String, freelanceStatus: String, yearsOfExperience: String, 
  happyClients: String, projectCompleted: String, awardsWon: String,
  cvUrl: String
}, { strict: false });

const SettingsSchema = new mongoose.Schema({
  siteName: String, 
  siteDescription: String, 
  siteLogo: String,
  favicon: String,
  adminLogo: String,
  courtesyDescription: String, 
  quoteEnabled: Boolean, 
  maintenanceMode: Boolean, 
  analyticsId: String, 
  socialLinks: [{ platform: String, url: String }],
  seoTitle: String,
  seoKeywords: String, 
  seoAuthor: String, 
  ogImage: String, 
  seoThemeColor: String,
  ogType: { type: String, default: "website" },
  twitterHandle: String
});
const CourtesySchema = new mongoose.Schema({
  name: String, role: String, message: String, image: String, socialLinks: [{ platform: String, url: String }], active: { type: Boolean, default: true }
});

// Configure schemas to handle `id` similarly to frontend
const serialize = (schema) => {
  const options = {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
      if (ret._id) ret.id = ret._id.toString();
      delete ret._id;
    },
  };
  schema.set("toJSON", options);
  schema.set("toObject", options);
};

const schemas = [
  UserSchema, PortfolioSchema, EducationSchema, FeedSchema, SliderSchema, ServiceSchema, VideoSchema,
  FunWorkSchema, StorySchema, PopupSchema, AdSchema, ContactMessageSchema, VisitorRecordSchema,
  AppSchema, CustomerSchema, WhatsNewSchema, MusicSchema, UpdateSchema, SkillSchema, AboutSchema, SettingsSchema, CourtesySchema
];
schemas.forEach(serialize);

export const User = mongoose.model("User", UserSchema);
export const Portfolio = mongoose.model("Portfolio", PortfolioSchema);
export const Education = mongoose.model("Education", EducationSchema);
export const Feed = mongoose.model("Feed", FeedSchema);
export const Slider = mongoose.model("Slider", SliderSchema);
export const Service = mongoose.model("Service", ServiceSchema);
export const Video = mongoose.model("Video", VideoSchema);
export const FunWork = mongoose.model("FunWork", FunWorkSchema);
export const Story = mongoose.model("Story", StorySchema);
export const Popup = mongoose.model("Popup", PopupSchema);
export const Ad = mongoose.model("Ad", AdSchema);
export const ContactMessage = mongoose.model("ContactMessage", ContactMessageSchema);
export const VisitorRecord = mongoose.model("VisitorRecord", VisitorRecordSchema);
export const AppModel = mongoose.model("App", AppSchema);
export const Customer = mongoose.model("Customer", CustomerSchema);
export const WhatsNew = mongoose.model("WhatsNew", WhatsNewSchema);
export const Music = mongoose.model("Music", MusicSchema);
export const Update = mongoose.model("Update", UpdateSchema);
export const Skill = mongoose.model("Skill", SkillSchema);
export const About = mongoose.model("About", AboutSchema);
export const Settings = mongoose.model("Settings", SettingsSchema);
export const Courtesy = mongoose.model("Courtesy", CourtesySchema);
