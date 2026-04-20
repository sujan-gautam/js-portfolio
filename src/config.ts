// Production Config Manager
// Dynamic API detection for local network testing (Mobile/Chrome)
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

export const API_URL = getBaseUrl();
export const API_BASE = `${API_URL}/api`;

// YouTube Sourcing Keys
export const YT_KEYS = (import.meta.env.VITE_YOUTUBE_API_KEYS || "").split(",").filter(Boolean);
