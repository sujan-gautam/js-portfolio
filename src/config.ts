// Production Config Manager
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const API_BASE = `${API_URL}/api`;

// YouTube Sourcing Keys
export const YT_KEYS = (import.meta.env.VITE_YOUTUBE_API_KEYS || "").split(",").filter(Boolean);
