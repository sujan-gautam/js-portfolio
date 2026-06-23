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

  /* ── Scroll depth tracker ── */
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

  /* ── Per-page-view tracking & Activity Engine ── */
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

    // Define the global window-level logger
    (window as any).reportActivity = async (type: string, target: string, details = "") => {
      const payload = {
        sessionID: sessionId,
        page: window.location.pathname,
        type,
        target,
        details
      };
      
      axios.post(`${API_BASE}/analytics/track-activity`, payload).catch(() => {});
    };

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

    // Fetch IP location and fire initial track
    const sendWithIP = async () => {
      const fetchIpapiCo = async () => {
        const geo = await axios.get("https://ipapi.co/json/", { timeout: 3000 });
        if (geo.data?.city) return { ip: geo.data.ip, city: geo.data.city, region: geo.data.region, country: geo.data.country_name, countryCode: geo.data.country_code, postcode: geo.data.postal, lat: geo.data.latitude, lon: geo.data.longitude, timezone: geo.data.timezone, isp: geo.data.org, org: geo.data.org, source: "ipapi.co" };
        throw new Error("ipapi.co failed");
      };

      const fetchIpInfo = async () => {
        const geo = await axios.get("https://ipinfo.io/json", { timeout: 3000 });
        if (geo.data?.city) {
          const [lat, lon] = (geo.data.loc || "0,0").split(",").map(Number);
          return { ip: geo.data.ip, city: geo.data.city, region: geo.data.region, country: geo.data.country, countryCode: geo.data.country, postcode: geo.data.postal, lat, lon, isp: geo.data.org || "", org: geo.data.org || "", timezone: geo.data.timezone || "", source: "ipinfo" };
        }
        throw new Error("ipinfo failed");
      };

      const fetchGeoJs = async () => {
        const geo = await axios.get("https://get.geojs.io/v1/ip/geo.json", { timeout: 3000 });
        if (geo.data?.city) return { ip: geo.data.ip, city: geo.data.city, region: geo.data.region, country: geo.data.country, countryCode: geo.data.country_code, postcode: geo.data.area_code || "", lat: parseFloat(geo.data.latitude), lon: parseFloat(geo.data.longitude), timezone: geo.data.timezone, isp: geo.data.organization_name, org: geo.data.organization, source: "geojs" };
        throw new Error("geojs failed");
      };

      const raceFastest = (promises: Promise<any>[]): Promise<any> => {
        return new Promise((resolve) => {
          let rejected = 0;
          promises.forEach(p => {
            p.then(res => resolve(res)).catch(() => {
              rejected++;
              if (rejected === promises.length) resolve({});
            });
          });
        });
      };

      const geoLocation: Record<string, any> = await raceFastest([
        fetchGeoJs(), fetchIpapiCo(), fetchIpInfo()
      ]);

      await axios.post(`${API_BASE}/visitors/track`, {
        ...basePayload, resolvedIp: geoLocation.ip || "", location: geoLocation
      }).then(() => {
        // Log page load as first activity in database
        (window as any).reportActivity?.('visit', `Landed on page: ${location.pathname}`, `Referrer: ${document.referrer || 'direct'}`);
      }).catch(() => {});
    };

    sendWithIP();

    // ── Global Clicks Tracking on All Pages and Subpages ──
    const handleGlobalClick = (e: MouseEvent) => {
      clickCountRef.current += 1;
      const target = e.target as HTMLElement;
      if (!target) return;

      // Find closest interactive element
      const interactiveEl = target.closest('a, button, input[type="submit"], input[type="button"], [role="button"], .cursor-pointer, [data-clickable="true"]');
      if (!interactiveEl) return;

      const tagName = interactiveEl.tagName.toLowerCase();
      let text = (interactiveEl.textContent || '').trim().replace(/\s+/g, ' ');
      
      // If element contains SVG icon and no text, look for helper title
      if (!text && interactiveEl.querySelector('svg')) {
        text = interactiveEl.querySelector('title')?.textContent || '';
      }

      if (text.length > 50) text = text.substring(0, 50) + '...';

      let eventTarget = text || 'Unnamed interactive element';
      let details = '';

      if (tagName === 'a') {
        const href = interactiveEl.getAttribute('href') || '';
        eventTarget = text ? `Link: "${text}"` : `Link to ${href}`;
        details = `URL: ${href}`;
        
        // Mark external links, mailto, tel, etc.
        if (href.startsWith('mailto:')) {
          eventTarget = `Email Link: "${text || href.replace('mailto:', '')}"`;
          details = `Email: ${href.replace('mailto:', '')}`;
        } else if (href.startsWith('tel:')) {
          eventTarget = `Phone Link: "${text || href.replace('tel:', '')}"`;
          details = `Phone: ${href.replace('tel:', '')}`;
        } else if (href.startsWith('http') && !href.includes(window.location.host)) {
          details = `External URL: ${href}`;
        }
      } else if (tagName === 'button' || interactiveEl.getAttribute('role') === 'button') {
        eventTarget = text ? `Button: "${text}"` : `Button (${interactiveEl.className.split(' ')[0] || 'unnamed'})`;
        const ariaLabel = interactiveEl.getAttribute('aria-label');
        if (ariaLabel) details = `Aria Label: ${ariaLabel}`;
      } else if (tagName === 'input') {
        const type = (interactiveEl as HTMLInputElement).type;
        const val = (interactiveEl as HTMLInputElement).value;
        const name = (interactiveEl as HTMLInputElement).name;
        eventTarget = `Input field: ${name || type}`;
        details = `Value: ${val || ''}`;
      }

      // Send activity
      (window as any).reportActivity?.('click', eventTarget, details);
    };

    document.addEventListener('click', handleGlobalClick);

    // ── Dynamic Section View Observer for All Pages and Subpages ──
    const getSectionName = (el: HTMLElement) => {
      if (el.getAttribute('data-section')) return el.getAttribute('data-section')!;
      if (el.id) {
        return el.id.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
      const heading = el.querySelector('h1, h2, h3, h4');
      if (heading && heading.textContent) {
        const text = heading.textContent.trim().replace(/\s+/g, ' ');
        if (text.length > 0 && text.length < 35) return text;
      }
      if (el.tagName.toLowerCase() === 'article') return 'Article Content';
      return el.className ? `Block: ${el.className.split(' ')[0]}` : 'Unnamed Section';
    };

    const activeViews = new Map<HTMLElement, number>();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          activeViews.set(el, Date.now());
        } else {
          const startTime = activeViews.get(el);
          if (startTime) {
            const duration = Math.round((Date.now() - startTime) / 1000);
            activeViews.delete(el);

            if (duration >= 1.5) { // Viewed for at least 1.5 seconds
              const name = getSectionName(el);
              (window as any).reportActivity?.('section_view', name, `Viewed section for ${duration}s`);
            }
          }
        }
      });
    }, {
      threshold: 0.35 // Must cover at least 35% of screen height
    });

    const findAndObserve = () => {
      // Find sections or articles
      const selectors = [
        'section',
        'article',
        '#hero',
        '#projects',
        '#skills',
        '#services',
        '#stories',
        '#videos',
        '#about',
        '#contact',
        '.section-block',
        '[data-section]'
      ];
      const targets = document.querySelectorAll(selectors.join(', '));
      targets.forEach(t => observer.observe(t));
    };

    // Run observation after components settle
    const observerTimer = setTimeout(findAndObserve, 800);

    // ── On unload/navigation: sync metrics back ──
    const syncSession = () => {
      const timeSpent   = Math.round((Date.now() - pageStartRef.current) / 1000);
      const currentPV   = parseInt(sessionStorage.getItem(PV_KEY) || '1');
      const exitPage    = location.pathname;

      // Close out any currently visible sections and record their time spent
      activeViews.forEach((startTime, el) => {
        const duration = Math.round((Date.now() - startTime) / 1000);
        if (duration >= 1.5) {
          const name = getSectionName(el);
          // Fire-and-forget sync
          axios.post(`${API_BASE}/analytics/track-activity`, {
            sessionID: sessionId,
            page: location.pathname,
            type: 'section_view',
            target: name,
            details: `Viewed section for ${duration}s`
          }).catch(() => {});
        }
      });

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

      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `${API_BASE}/analytics/update-session`,
          new Blob([JSON.stringify(payload)], { type: 'application/json' })
        );
      } else {
        axios.post(`${API_BASE}/analytics/update-session`, payload).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', syncSession);
    return () => {
      syncSession();
      document.removeEventListener('click', handleGlobalClick);
      observer.disconnect();
      clearTimeout(observerTimer);
      window.removeEventListener('beforeunload', syncSession);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return null;
};

export default AnalyticsTracker;
