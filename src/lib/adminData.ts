// localStorage-based data layer for admin panel

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  createdAt: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  link: string;
  createdAt: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  year: string;
  description: string;
}

export interface FeedItem {
  id: string;
  title: string;
  image: string;
  caption: string;
  location: string;
  date: string;
  views: number;
  likes: number;
}

export interface SliderItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  order: number;
  active: boolean;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  active: boolean;
}

export interface VideoItem {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  description: string;
  createdAt: string;
}

export interface FunWorkItem {
  id: string;
  title: string;
  image: string;
  description: string;
  category: string;
}

export interface StoryItem {
  id: string;
  title: string;
  image: string;
  active: boolean;
  createdAt: string;
}

export interface PopupItem {
  id: string;
  title: string;
  content: string;
  image: string;
  active: boolean;
  startDate: string;
  endDate: string;
}

export interface AdItem {
  id: string;
  title: string;
  image: string;
  link: string;
  position: string;
  active: boolean;
  impressions: number;
  clicks: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface VisitorRecord {
  id: string;
  ip: string;
  page: string;
  device: string;
  browser: string;
  timestamp: string;
}

export interface AppItem {
  id: string;
  name: string;
  platform: string;
  downloadUrl: string;
  icon: string;
  description: string;
  active: boolean;
}

export interface CustomerItem {
  id: string;
  name: string;
  email: string;
  company: string;
  project: string;
  status: "active" | "completed" | "pending";
}

export interface WhatsNewItem {
  id: string;
  title: string;
  description: string;
  version: string;
  createdAt: string;
}

export interface MusicItem {
  id: string;
  title: string;
  artist: string;
  url: string;
  active: boolean;
}

export interface UpdateItem {
  id: string;
  title: string;
  description: string;
  type: "feature" | "bugfix" | "improvement";
  createdAt: string;
}

export interface AboutData {
  name: string;
  title: string;
  bio: string;
  phone: string;
  email: string;
  address: string;
  dob: string;
  nationality: string;
  languages: string;
  experience: string;
  clients: string;
  projects: string;
}

export interface AdminSettings {
  siteName: string;
  siteDescription: string;
  quoteEnabled: boolean;
  maintenanceMode: boolean;
  analyticsId: string;
  socialLinks: { platform: string; url: string }[];
}

// Generic CRUD helpers
function getCollection<T>(key: string): T[] {
  const data = localStorage.getItem(`admin_${key}`);
  return data ? JSON.parse(data) : [];
}

function setCollection<T>(key: string, data: T[]): void {
  localStorage.setItem(`admin_${key}`, JSON.stringify(data));
}

function getSingle<T>(key: string, defaultVal: T): T {
  const data = localStorage.getItem(`admin_${key}`);
  return data ? JSON.parse(data) : defaultVal;
}

function setSingle<T>(key: string, data: T): void {
  localStorage.setItem(`admin_${key}`, JSON.stringify(data));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// CRUD factory
export function createCRUD<T extends { id: string }>(collectionName: string) {
  return {
    getAll: (): T[] => getCollection<T>(collectionName),
    getById: (id: string): T | undefined => getCollection<T>(collectionName).find(item => item.id === id),
    create: (item: T): void => {
      const items = getCollection<T>(collectionName);
      items.push(item);
      setCollection(collectionName, items);
    },
    update: (id: string, updates: Partial<T>): void => {
      const items = getCollection<T>(collectionName);
      const index = items.findIndex(item => item.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...updates };
        setCollection(collectionName, items);
      }
    },
    delete: (id: string): void => {
      const items = getCollection<T>(collectionName).filter(item => item.id !== id);
      setCollection(collectionName, items);
    },
    deleteAll: (): void => {
      setCollection(collectionName, []);
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
export const contactsDB = createCRUD<ContactMessage>("contacts");
export const visitorsDB = createCRUD<VisitorRecord>("visitors");
export const appsDB = createCRUD<AppItem>("apps");
export const customersDB = createCRUD<CustomerItem>("customers");
export const whatsNewDB = createCRUD<WhatsNewItem>("whatsnew");
export const musicDB = createCRUD<MusicItem>("music");
export const updatesDB = createCRUD<UpdateItem>("updates");

// Singleton data
const defaultAbout: AboutData = {
  name: "Sujan Shrestha",
  title: "Graphic Designer & UI/UX Developer",
  bio: "A passionate designer with 1.5+ years of experience creating stunning visual experiences.",
  phone: "+977-9800000000",
  email: "info@sujan1919.com.np",
  address: "Kathmandu, Nepal",
  dob: "2005-01-01",
  nationality: "Nepali",
  languages: "Nepali, English, Hindi",
  experience: "1.5+",
  clients: "12+",
  projects: "18+",
};

const defaultSettings: AdminSettings = {
  siteName: "Sujan 1919",
  siteDescription: "Personal Portfolio & Creative Showcase",
  quoteEnabled: false,
  maintenanceMode: false,
  analyticsId: "",
  socialLinks: [
    { platform: "Facebook", url: "#" },
    { platform: "Instagram", url: "#" },
    { platform: "YouTube", url: "#" },
    { platform: "TikTok", url: "#" },
  ],
};

export const aboutDB = {
  get: (): AboutData => getSingle("about", defaultAbout),
  update: (data: Partial<AboutData>): void => {
    const current = getSingle("about", defaultAbout);
    setSingle("about", { ...current, ...data });
  },
};

export const settingsDB = {
  get: (): AdminSettings => getSingle("settings", defaultSettings),
  update: (data: Partial<AdminSettings>): void => {
    const current = getSingle("settings", defaultSettings);
    setSingle("settings", { ...current, ...data });
  },
};

// Seed initial data
export function seedData() {
  if (localStorage.getItem("admin_seeded")) return;

  usersDB.create({ id: generateId(), name: "Sujan Shrestha", email: "sujan@example.com", role: "admin", status: "active", createdAt: new Date().toISOString() });
  usersDB.create({ id: generateId(), name: "Guest User", email: "guest@example.com", role: "viewer", status: "active", createdAt: new Date().toISOString() });

  for (let i = 1; i <= 6; i++) {
    portfolioDB.create({ id: generateId(), title: `Project ${i}`, description: `Description for project ${i}`, image: `/placeholder.svg`, category: "Design", link: "#", createdAt: new Date().toISOString() });
  }

  educationDB.create({ id: generateId(), degree: "Bachelor in IT", institution: "Tribhuvan University", year: "2023", description: "Computer Science" });
  educationDB.create({ id: generateId(), degree: "High School", institution: "National School", year: "2020", description: "+2 Science" });

  for (let i = 1; i <= 4; i++) {
    feedDB.create({ id: generateId(), title: `Post ${i}`, image: `/placeholder.svg`, caption: `Caption ${i}`, location: "Kathmandu", date: "2024", views: Math.floor(Math.random() * 500), likes: Math.floor(Math.random() * 100) });
  }

  servicesDB.create({ id: generateId(), title: "UI/UX Design", description: "Modern user interfaces", icon: "Palette", active: true });
  servicesDB.create({ id: generateId(), title: "Graphic Design", description: "Creative visual design", icon: "Image", active: true });
  servicesDB.create({ id: generateId(), title: "Web Development", description: "Responsive websites", icon: "Code", active: true });

  musicDB.create({ id: generateId(), title: "Chill Vibes", artist: "Lo-Fi", url: "#", active: true });

  localStorage.setItem("admin_seeded", "true");
}
