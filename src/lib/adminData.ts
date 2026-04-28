import axios from "axios";

import { API_BASE } from "../config";

export interface AdminUser { id: string; name: string; email: string; role: string; status: "active" | "inactive"; createdAt: string; }
export interface PortfolioItem { id: string; title: string; description: string; image: string; category: string; demoUrl: string; status: boolean; createdAt: string; }
export interface EducationItem { id: string; degree: string; institution: string; year: string; gpa?: string; description: string; image?: string; status: boolean; }
export interface PollOption { id: string; label: string; votes: number; voters: string[]; }
export interface FeedComment { id: string; text: string; author: string; avatar?: string; votersId?: string; ip?: string; createdAt: string; reactions: { heart: number; fire: number; laugh: number }; }
export interface FeedPost {
  id: string;
  type: "text" | "image" | "poll" | "video" | "reel";
  content?: string;
  videoUrl?: string;
  image?: string;
  images?: string[];
  imageLayout?: "default" | "polaroid";
  imageCaptions?: string[];
  textLayout?: "default" | "quote";
  caption?: string;
  location?: string;
  pollQuestion?: string;
  pollOptions?: PollOption[];
  pollEndsAt?: string;
  tags?: string[];
  pinned?: boolean;
  published?: boolean;
  membersOnly?: boolean;
  musicVideoId?: string;
  musicTitle?: string;
  musicArtist?: string;
  musicStartTime?: number;
  musicEndTime?: number;
  views: number;
  shares: number;
  reactions: { heart: number; fire: number; like: number; wow: number; sad: number; };
  comments: FeedComment[];
  externalLink?: string;
  linkPreview?: {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    domain?: string;
  };
  createdAt: string;
  updatedAt?: string;
}
// Legacy alias kept for any existing references
export type FeedItem = FeedPost;
export interface SliderItem { id: string; title: string; subtitle: string; image: string; order: number; active: boolean; filter?: string; }
export interface ServiceItem { id: string; title: string; description: string; icon: string; active: boolean; }
export interface VideoItem { id: string; title: string; url: string; thumbnail: string; description: string; createdAt: string; }
export interface FunWorkItem { id: string; title: string; image: string; description: string; category: string; }
export interface StoryLayer { 
  id: string; 
  type: "text" | "gif" | "image" | "video" | "link" | "poll" | "sticker"; 
  content: string; 
  top: number; 
  left: number; 
  scale: number; 
  rotation: number; 
  color?: string; 
  fontFamily?: string; 
  fontSize?: number; 
  // Specific properties
  linkUrl?: string;
  linkLabel?: string;
  pollQuestion?: string;
  pollOptions?: { id: string; label: string; votes: number; voters: string[] }[];
  stickerId?: string;
  width?: number;
  height?: number;
  filter?: string; 
  contentX?: number;
  contentY?: number;
}
export interface StoryComment { id: string; text: string; createdAt: string; ip: string; device: string; }
export interface StoryAnalytics { type: string; ip: string; device: string; timestamp: string; }
export interface StoryItem { id: string; title: string; image: string; type?: "image" | "video" | "gif"; active: boolean; isMembersOnly?: boolean; createdAt: string; duration?: number; musicVideoId?: string; musicTitle?: string; musicArtist?: string; musicStartTime?: number; musicEndTime?: number; layers?: StoryLayer[]; filter?: string; views?: number; allowComments?: boolean; comments?: StoryComment[]; reacts?: { heart: number, fire: number, laugh: number }; analyticsLogs?: StoryAnalytics[]; }
export interface PopupItem { id: string; title: string; content: string; image: string; active: boolean; startDate: string; endDate: string; }
export interface AdItem { id: string; title: string; image: string; link: string; position: string; active: boolean; impressions: number; clicks: number; }
export interface ContactMessage { id: string; name: string; email: string; subject: string; message: string; read: boolean; createdAt: string; }
export interface VisitorRecord { 
  id: string; 
  ip: string; 
  page: string; 
  device: string; 
  browser: string;
  os?: string;
  userAgent?: string;
  referrer?: string;
  utm?: { source?: string; medium?: string; campaign?: string; };
  location?: {
    city?: string;
    country?: string;
    countryCode?: string;
    region?: string;
    lat?: number;
    lon?: number;
    isp?: string;
  };
  screenResolution?: string;
  language?: string;
  sessionID?: string;
  timestamp: string; 
}
export interface AppItem { id: string; name: string; platform: string; downloadUrl: string; icon: string; description: string; active: boolean; }
export interface CustomerItem { id: string; name: string; email: string; company: string; project: string; status: "active" | "completed" | "pending"; }
export interface WhatsNewItem { id: string; title: string; description: string; version: string; createdAt: string; }
export interface MusicItem { id: string; title: string; artist: string; url: string; active: boolean; videoId?: string; startTime?: number; endTime?: number; }
export interface UpdateItem { id: string; title: string; description: string; type: "feature" | "bugfix" | "improvement"; createdAt: string; }
export interface SkillItem { id: string; name: string; image: string; proficiency: number; }
export interface CourtesyItem { id: string; name: string; role: string; message: string; socialLinks: { platform: string; url: string }[]; image?: string; active: boolean; }
export interface AboutData { name: string; title: string; bio: string; phone: string; email: string; address: string; dob: string; nationality: string; languages: string; experience: string; clients: string; projects: string; }
export interface AdminSettings { siteName: string; siteDescription: string; courtesyDescription: string; quoteEnabled: boolean; maintenanceMode: boolean; analyticsId: string; socialLinks: { platform: string; url: string }[]; seoKeywords?: string; seoAuthor?: string; ogImage?: string; seoThemeColor?: string; feedProfileName?: string; feedProfileImage?: string; }

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function createCRUD<T extends { id: string }>(collectionName: string) {
  return {
    getAll: async (): Promise<T[]> => {
      try {
        const res = await axios.get(`${API_BASE}/collection/${collectionName}`);
        return res.data;
      } catch { return []; }
    },
    getById: async (id: string): Promise<T | undefined> => {
      try {
        const res = await axios.get(`${API_BASE}/collection/${collectionName}/${id}`);
        return res.data;
      } catch { return undefined; }
    },
    create: async (item: T): Promise<T> => {
      const res = await axios.post(`${API_BASE}/collection/${collectionName}`, item);
      return res.data;
    },
    update: async (id: string, updates: Partial<T>): Promise<void> => {
      await axios.put(`${API_BASE}/collection/${collectionName}/${id}`, updates);
    },
    delete: async (id: string): Promise<void> => {
      await axios.delete(`${API_BASE}/collection/${collectionName}/${id}`);
    },
    deleteAll: async (): Promise<void> => {
      await axios.delete(`${API_BASE}/collection/${collectionName}`);
    },
  };
}

// Collection instances
export const usersDB = createCRUD<AdminUser>("users");
export const portfolioDB = createCRUD<PortfolioItem>("portfolio");
export const educationDB = createCRUD<EducationItem>("education");
export const feedDB = createCRUD<FeedItem>("feed");
export const slidersDB = createCRUD<SliderItem>("sliders");
export const servicesDB = createCRUD<ServiceItem>("services");
export const videosDB = createCRUD<VideoItem>("videos");
export const funWorkDB = createCRUD<FunWorkItem>("funwork");
export const storiesDB = createCRUD<StoryItem>("stories");
export const popupsDB = createCRUD<PopupItem>("popups");
export const adsDB = createCRUD<AdItem>("ads");
export const contactsDB = {
  ...createCRUD<ContactMessage>("contacts"),
    sendEmail: async (data: { name?: string, email?: string, phone?: string, message: string }): Promise<void> => {
      const res = await axios.post(`${API_BASE}/contact/email`, data);
      if (res.data && res.data.success === false) {
        throw new Error(res.data.error || "Failed to send email");
      }
    }
};
export const visitorsDB = createCRUD<VisitorRecord>("visitors");
export const appsDB = createCRUD<AppItem>("apps");
export const customersDB = createCRUD<CustomerItem>("customers");
export const whatsNewDB = createCRUD<WhatsNewItem>("whatsnew");
export const musicDB = createCRUD<MusicItem>("music");
export const updatesDB = createCRUD<UpdateItem>("updates");
export const skillsDB = createCRUD<SkillItem>("skills");
export const courtesyDB = createCRUD<CourtesyItem>("courtesy");

export const aboutDB = {
  get: async (): Promise<AboutData> => {
    try {
      const res = await axios.get(`${API_BASE}/singleton/about`);
      return res.data;
    } catch {
      return {} as AboutData;
    }
  },
  update: async (data: Partial<AboutData>): Promise<void> => {
    await axios.put(`${API_BASE}/singleton/about`, data);
  },
  uploadCV: async (file: File): Promise<{ url: string, about: AboutData }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post(`${API_BASE}/cv/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export const settingsDB = {
  get: async (): Promise<AdminSettings> => {
    try {
      const res = await axios.get(`${API_BASE}/singleton/settings`);
      return res.data;
    } catch {
      return {} as AdminSettings;
    }
  },
  update: async (data: Partial<AdminSettings>): Promise<void> => {
    await axios.put(`${API_BASE}/singleton/settings`, data);
  },
};

// Seeding is handled via backend if needed, skipping here
export async function seedData() {
  try {
    await axios.post(`${API_BASE}/seed`);
  } catch (e) {
    console.error("Failed to seed", e);
  }
}

// ── Feed Social API ──────────────────────────────────────
export const feedAPI = {
  getPosts: async (): Promise<FeedPost[]> => {
    try { const r = await axios.get(`${API_BASE}/feed/posts`); return r.data; }
    catch { return []; }
  },
  createPost: async (post: Partial<FeedPost>): Promise<FeedPost> => {
    const r = await axios.post(`${API_BASE}/collection/feed`, post); return r.data;
  },
  updatePost: async (id: string, data: Partial<FeedPost>): Promise<void> => {
    await axios.put(`${API_BASE}/collection/feed/${id}`, data);
  },
  deletePost: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/collection/feed/${id}`);
  },
  react: async (id: string, type: string): Promise<FeedPost> => {
    const r = await axios.post(`${API_BASE}/feed/posts/${id}/react`, { type }); return r.data;
  },
  addComment: async (id: string, text: string, author?: string, votersId?: string): Promise<FeedPost> => {
    const r = await axios.post(`${API_BASE}/feed/posts/${id}/comment`, { text, author, votersId }); return r.data;
  },
  deleteComment: async (postId: string, commentId: string): Promise<FeedPost> => {
    const r = await axios.delete(`${API_BASE}/feed/posts/${postId}/comment/${commentId}`); return r.data;
  },
  reactToComment: async (postId: string, commentId: string, type: string): Promise<void> => {
    await axios.post(`${API_BASE}/feed/posts/${postId}/comment/${commentId}/react`, { type });
  },
  votePoll: async (postId: string, optionId: string, voterId: string): Promise<FeedPost> => {
    const r = await axios.post(`${API_BASE}/feed/posts/${postId}/poll/vote`, { optionId, voterId }); return r.data;
  },
  trackView: async (id: string): Promise<void> => {
    await axios.post(`${API_BASE}/feed/posts/${id}/view`);
  },
  trackShare: async (id: string): Promise<void> => {
    await axios.post(`${API_BASE}/feed/posts/${id}/share`);
  },
};
