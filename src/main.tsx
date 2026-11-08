import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import axios from "axios";
import CryptoJS from "crypto-js";
import { API_BASE } from "@/config";

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || "exact-echo-super-secret-key-24!";

const api = new URL(API_BASE, window.location.origin);
axios.interceptors.request.use((request) => {
  const url = new URL(request.url || "", window.location.href);
  if (url.origin === api.origin && url.pathname.startsWith(`${api.pathname}/`)) {
    const path = url.pathname.slice(api.pathname.length);
    if (/^\/(feed\/posts|collection\/(feed|blog_posts|users))(\/|$)/.test(path)) {
      const token = localStorage.getItem("admin_token");
      if (token) request.headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return request;
});

axios.interceptors.response.use((response) => {
  if (response.data && response.data.encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(response.data.encryptedData, SECRET_KEY);
      const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      response.data = decryptedData;
    } catch (e) {
      console.error("API Decryption failed");
    }
  }
  return response;
});

import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
