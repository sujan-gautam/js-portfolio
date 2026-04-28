import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '@/config';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Never track admin pages
    if (location.pathname.startsWith('/admin')) return;

    const ua = navigator.userAgent;
    const params = new URLSearchParams(window.location.search);

    let sessionId = sessionStorage.getItem('v_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('v_session_id', sessionId);
    }

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

    const basePayload = {
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

    // ── Step 1: Try GPS (most accurate — city/street level on mobile)
    const sendWithGPS = async (lat: number, lon: number, accuracy: number) => {
      let geoLocation: Record<string, any> = { lat, lon, accuracy };

      // Reverse geocode GPS coords → city, country, region
      try {
        const rev = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (rev.data?.address) {
          const a = rev.data.address;
          geoLocation = {
            lat,
            lon,
            accuracy,
            city: a.city || a.town || a.village || a.county || "",
            region: a.state || a.county || "",
            country: a.country || "",
            countryCode: a.country_code?.toUpperCase() || "",
            postcode: a.postcode || "",
            displayName: rev.data.display_name || "",
            source: "gps"
          };
        }
      } catch { /* reverse geocode failed, still store lat/lon */ }

      await axios.post(`${API_BASE}/visitors/track`, {
        ...basePayload,
        location: geoLocation
      }).catch(() => {});
    };

    // ── Step 2: Fallback — IP-based geo from browser (real IP, not Vercel proxy)
    const sendWithIP = async () => {
      let geoLocation: Record<string, any> = {};
      try {
        // Try ipapi.co first (HTTPS, browser-safe, returns city/country/isp)
        const geo = await axios.get("https://ipapi.co/json/", { timeout: 5000 });
        if (geo.data && !geo.data.error && geo.data.city) {
          geoLocation = {
            ip: geo.data.ip,
            city: geo.data.city,
            country: geo.data.country_name,
            countryCode: geo.data.country_code,
            region: geo.data.region,
            lat: geo.data.latitude,
            lon: geo.data.longitude,
            isp: geo.data.org || "",
            source: "ip"
          };
        }
      } catch { /* try next */ }

      // Fallback: ipinfo.io
      if (!geoLocation.city) {
        try {
          const geo2 = await axios.get("https://ipinfo.io/json", { timeout: 5000 });
          if (geo2.data && geo2.data.city) {
            const [lat, lon] = (geo2.data.loc || "0,0").split(",").map(Number);
            geoLocation = {
              ip: geo2.data.ip,
              city: geo2.data.city,
              country: geo2.data.country,
              countryCode: geo2.data.country,
              region: geo2.data.region,
              lat,
              lon,
              isp: geo2.data.org || "",
              source: "ip"
            };
          }
        } catch { /* geo failed entirely */ }
      }

      await axios.post(`${API_BASE}/visitors/track`, {
        ...basePayload,
        resolvedIp: geoLocation.ip || "",
        location: geoLocation
      }).catch(() => {});
    };

    // ── Try GPS first, fall back to IP
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sendWithGPS(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        },
        () => {
          // User denied or GPS unavailable → fall back to IP geo
          sendWithIP();
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      sendWithIP();
    }

  }, [location.pathname]);

  return null;
};

export default AnalyticsTracker;
