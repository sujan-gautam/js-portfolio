import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import axios from "axios";
import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || "exact-echo-super-secret-key-24!";

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
