import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '@/config';

const RETURNING_KEY = 'v_returning';
const SESSION_KEY   = 'v_session_id';
const ENTRY_KEY     = 'v_entry_page';
const PV_KEY        = 'v_pv_count';

function getOrCreateSession() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

const getDeviceType = (ua: string) => {
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "tablet";
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "mobile";
  return "desktop";
};

const getBrowser = (ua: string) => {
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  return "Other";
};

const getOS = (ua: string) => {
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "MacOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  if (ua.includes("Linux")) return "Linux";
  return "Other";
};

const getConnectionType = () => {
  const nav = navigator as any;
  return nav.connection?.effectiveType || nav.connection?.type || "";
};

const AnalyticsTracker = () => {
  const location = useLocation();
  const pageStartRef    = useRef<number>(Date.now());
  const maxScrollRef    = useRef<number>(0);
  const clickCountRef   = useRef<number>(0);
  const sessionPageViews = useRef<number>(0);

  /* ── Scroll tracker ── */
  useEffect(() => {
    const onScroll = () => {
      const scrollPct = Math.round(
        ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
      );
      if (scrollPct > maxScrollRef.current) maxScrollRef.current = scrollPct;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Click tracker ── */
  useEffect(() => {
    const onClick = () => { clickCountRef.current += 1; };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  /* ── Per-page-view tracking ── */
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;

    // Reset per-page metrics
    pageStartRef.current  = Date.now();
    maxScrollRef.current  = 0;
    clickCountRef.current = 0;

    const ua         = navigator.userAgent;
    const params     = new URLSearchParams(window.location.search);
    const sessionId  = getOrCreateSession();
    const isReturning = !!localStorage.getItem(RETURNING_KEY);

    // Track session-level entry page (first page of session)
    if (!sessionStorage.getItem(ENTRY_KEY)) {
      sessionStorage.setItem(ENTRY_KEY, location.pathname);
    }
    const entryPage = sessionStorage.getItem(ENTRY_KEY) || location.pathname;

    // Page view counter per session
    const pvCount = parseInt(sessionStorage.getItem(PV_KEY) || '0') + 1;
    sessionStorage.setItem(PV_KEY, String(pvCount));
    sessionPageViews.current = pvCount;

    const basePayload = {
      page:             location.pathname,
      referrer:         document.referrer || "direct",
      device:           getDeviceType(ua),
      browser:          getBrowser(ua),
      os:               getOS(ua),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport:         `${window.innerWidth}x${window.innerHeight}`,
      language:         navigator.language,
      sessionID:        sessionId,
      timezone:         Intl.DateTimeFormat().resolvedOptions().timeZone,
      connectionType:   getConnectionType(),
      isReturning,
      entryPage,
      pageViews:        pvCount,
      bounced:          pvCount === 1,  // will be updated on navigation
      utm: {
        source:   params.get('utm_source')   || "",
        medium:   params.get('utm_medium')   || "",
        campaign: params.get('utm_campaign') || ""
      }
    };

    // Mark as returning for future sessions
    localStorage.setItem(RETURNING_KEY, '1');

    // ── GPS → IP fallback geo chain ──
    const sendWithGPS = async (lat: number, lon: number, accuracy: number) => {
      let geoLocation: Record<string, any> = { lat, lon, accuracy };
      try {
        const rev = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (rev.data?.address) {
          const a = rev.data.address;
          geoLocation = {
            lat, lon, accuracy,
            city:        a.city || a.town || a.village || a.county || "",
            region:      a.state || a.county || "",
            country:     a.country || "",
            countryCode: a.country_code?.toUpperCase() || "",
            postcode:    a.postcode || "",
            displayName: rev.data.display_name || "",
            source:      "gps"
          };
        }
      } catch { /* reverse geocode failed */ }
      await axios.post(`${API_BASE}/visitors/track`, { ...basePayload, location: geoLocation }).catch(() => {});
    };

    const sendWithIP = async () => {
      let geoLocation: Record<string, any> = {};
      try {
        // Use ipinfo.io as primary IP-geo source as it's more CORS-friendly
        const geo = await axios.get("https://ipinfo.io/json", { timeout: 5000 });
        if (geo.data?.city) {
          const [lat, lon] = (geo.data.loc || "0,0").split(",").map(Number);
          geoLocation = {
            ip: geo.data.ip, city: geo.data.city, country: geo.data.country,
            countryCode: geo.data.country, region: geo.data.region,
            lat, lon, isp: geo.data.org || "", source: "ip"
          };
        }
      } catch (err) {
        console.warn("Geo-IP tracking failed, falling back to server-side IP detection.");
      }

      await axios.post(`${API_BASE}/visitors/track`, {
        ...basePayload, resolvedIp: geoLocation.ip || "", location: geoLocation
      }).catch(() => {});
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => sendWithGPS(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
        ()  => sendWithIP(),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      sendWithIP();
    }

    // ── On unload/navigation: sync time-spent, scroll, clicks back ──
    const syncSession = () => {
      const timeSpent   = Math.round((Date.now() - pageStartRef.current) / 1000);
      const currentPV   = parseInt(sessionStorage.getItem(PV_KEY) || '1');
      const exitPage    = location.pathname;

      const payload = {
        sessionID:  sessionId,
        page:       location.pathname,
        timeSpent,
        scrollDepth: maxScrollRef.current,
        clickCount:  clickCountRef.current,
        exitPage,
        pageViews:   currentPV,
        bounced:     currentPV <= 1,
      };

      // Use sendBeacon for reliability on page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `${API_BASE}/analytics/update-session`,
          new Blob([JSON.stringify(payload)], { type: 'application/json' })
        );
      } else {
        // Fallback: fire-and-forget
        axios.post(`${API_BASE}/analytics/update-session`, payload).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', syncSession);
    return () => {
      syncSession();
      window.removeEventListener('beforeunload', syncSession);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return null;
};

export default AnalyticsTracker;
