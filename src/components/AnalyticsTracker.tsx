import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '@/config';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const trackVisitor = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        
        // Handle Session ID
        let sessionId = sessionStorage.getItem('v_session_id');
        if (!sessionId) {
          sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          sessionStorage.setItem('v_session_id', sessionId);
        }

        const getDeviceType = () => {
          const ua = navigator.userAgent;
          if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "tablet";
          if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "mobile";
          return "desktop";
        };

        const getBrowser = () => {
          const ua = navigator.userAgent;
          if (ua.includes("Chrome")) return "Chrome";
          if (ua.includes("Firefox")) return "Firefox";
          if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
          if (ua.includes("Edge")) return "Edge";
          return "Other";
        };

        const getOS = () => {
          const ua = navigator.userAgent;
          if (ua.includes("Windows")) return "Windows";
          if (ua.includes("Mac")) return "MacOS";
          if (ua.includes("Linux")) return "Linux";
          if (ua.includes("Android")) return "Android";
          if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
          return "Other";
        };

        const payload = {
          page: window.location.pathname,
          referrer: document.referrer || "direct",
          device: getDeviceType(),
          browser: getBrowser(),
          os: getOS(),
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language,
          sessionID: sessionId,
          utm: {
            source: params.get('utm_source') || "",
            medium: params.get('utm_medium') || "",
            campaign: params.get('utm_campaign') || ""
          }
        };

        await axios.post(`${API_BASE}/visitors/track`, payload);
      } catch (error) {
        console.error("Analytics error:", error);
      }
    };

    trackVisitor();
  }, [location.pathname]); // Trigger on every path change

  return null;
};

export default AnalyticsTracker;
