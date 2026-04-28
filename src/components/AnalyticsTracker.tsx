import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '@/config';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Never track admin pages
    if (location.pathname.startsWith('/admin')) return;

    const trackVisitor = async () => {
      try {
        const params = new URLSearchParams(window.location.search);

        let sessionId = sessionStorage.getItem('v_session_id');
        if (!sessionId) {
          sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          sessionStorage.setItem('v_session_id', sessionId);
        }

        const ua = navigator.userAgent;

        const getDeviceType = () => {
          if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "tablet";
          if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "mobile";
          return "desktop";
        };

        const getBrowser = () => {
          if (ua.includes("Edg")) return "Edge";
          if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
          if (ua.includes("Chrome")) return "Chrome";
          if (ua.includes("Firefox")) return "Firefox";
          if (ua.includes("Safari")) return "Safari";
          return "Other";
        };

        const getOS = () => {
          if (ua.includes("Windows")) return "Windows";
          if (ua.includes("Mac")) return "MacOS";
          if (ua.includes("Android")) return "Android";
          if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
          if (ua.includes("Linux")) return "Linux";
          return "Other";
        };

        // ── Resolve geo from the BROWSER (visitor's real IP, not Vercel's)
        let geoData: Record<string, any> = {};
        let resolvedIp = "";
        try {
          // ipwho.is: free, HTTPS, no key, returns city/country/isp/lat/lon
          const geo = await axios.get("https://ipwho.is/");
          if (geo.data?.success) {
            resolvedIp = geo.data.ip;
            geoData = {
              ip: geo.data.ip,
              city: geo.data.city,
              country: geo.data.country,
              countryCode: geo.data.country_code,
              region: geo.data.region,
              lat: geo.data.latitude,
              lon: geo.data.longitude,
              isp: geo.data.connection?.isp || geo.data.connection?.org || ""
            };
          }
        } catch {
          // geo failed — backend will still record without location
        }

        await axios.post(`${API_BASE}/visitors/track`, {
          page: window.location.pathname,
          referrer: document.referrer || "direct",
          device: getDeviceType(),
          browser: getBrowser(),
          os: getOS(),
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language,
          sessionID: sessionId,
          resolvedIp,   // real visitor IP from client side
          location: geoData,  // pre-resolved — backend skips its own lookup
          utm: {
            source: params.get('utm_source') || "",
            medium: params.get('utm_medium') || "",
            campaign: params.get('utm_campaign') || ""
          }
        });
      } catch {
        // silent fail — never break the page
      }
    };

    trackVisitor();
  }, [location.pathname]);

  return null;
};

export default AnalyticsTracker;
