import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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


type Activity = {
  eventID: string;
  type: string;
  target: string;
  details: string;
  path: string;
  timestamp: string;
  contentType?: string;
  contentId?: string;
  contentTitle?: string;
  contentPublishedAt?: string;
};

type ActivityWindow = Window & { reportActivity?: (type: string, target: string, details?: string) => void };

const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
const endpoint = `${API_BASE}/visitors/track`;
const contentSelector = "[data-analytics-id][data-analytics-type]";
const trackedSelector = `${contentSelector}, section[id], [data-section]`;

function analyticsUrl() {
  const params = new URLSearchParams(window.location.search);
  const content = new URLSearchParams();
  for (const key of ["post", "story"]) {
    const value = params.get(key);
    if (value && /^[\w-]{1,128}$/.test(value)) content.set(key, value);
  }
  return window.location.pathname + (content.size ? `?${content}` : "");
}

export default function AnalyticsTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const started = Date.now();
    const pageUrl = analyticsUrl();
    const sessionID = getOrCreateSession();
    const entryPage = sessionStorage.getItem(ENTRY_KEY) || pageUrl;
    const pageViews = (Number(sessionStorage.getItem(PV_KEY)) || 0) + 1;
    const isReturning = Boolean(localStorage.getItem(RETURNING_KEY));
    sessionStorage.setItem(ENTRY_KEY, entryPage);
    sessionStorage.setItem(PV_KEY, String(pageViews));
    localStorage.setItem(RETURNING_KEY, "1");
    const params = new URLSearchParams(window.location.search);
    const ua = navigator.userAgent;
    const base = {
      pageViewID: newId().slice(0, 24),
      page: pathname,
      pageUrl,
      sessionID,
      entryPage,
      pageViews,
      visitedAt: new Date(started).toISOString(),
      isReturning,
      device: getDeviceType(ua),
      browser: getBrowser(ua),
      os: getOS(ua),
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${innerWidth}x${innerHeight}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      connectionType: getConnectionType(),
      referrer: document.referrer.split(/[?#]/, 1)[0] || "direct",
      utm: {
        source: params.get("utm_source") || "",
        medium: params.get("utm_medium") || "",
        campaign: params.get("utm_campaign") || "",
      },
    };

    const pending: Activity[] = [];
    let inFlight: Activity[] = [];
    let timer: number | undefined;
    let frame: number | undefined;
    let closed = false;
    let sending = false;
    let bounced = pageViews === 1;
    let scrollDepth = 0;
    let clickCount = 0;
    const liveWindow = window as ActivityWindow;

    const transmit = (activities: Activity[]) => fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...base,
        activities,
        bounced,
        clickCount,
        scrollDepth,
        timeSpent: Math.round((Date.now() - started) / 1000),
      }),
      keepalive: true,
    });

    function schedule(delay = 500) {
      if (!closed && timer === undefined) timer = window.setTimeout(() => {
        timer = undefined;
        void flush();
      }, delay);
    }

    async function flush() {
      if (closed || sending || pending.length === 0) return;
      sending = true;
      const batch = pending.splice(0, 30);
      inFlight = batch;
      let retry = false;
      try {
        const response = await transmit(batch);
        if (response.status >= 500) throw new Error("Analytics unavailable");
      } catch {
        retry = true;
        pending.unshift(...batch);
      } finally {
        inFlight = [];
        sending = false;
        if (pending.length) schedule(retry ? 3000 : 500);
      }
    }

    function record(type: string, target: string, details = "", content?: Partial<Activity>, time = Date.now()) {
      if (closed) return;
      const path = window.location.pathname === pathname ? analyticsUrl() : pageUrl;
      pending.push({ eventID: newId(), type, target: target.slice(0, 300), details: details.slice(0, 500), path, timestamp: new Date(time).toISOString(), ...content });
      schedule();
    }

    const reportActivity = (type: string, target: string, details = "") => record(type, target, details);
    liveWindow.reportActivity = reportActivity;
    record("visit", `Landed on ${pageUrl}`, "", { path: pageUrl }, started);
    void flush();

    const handleScroll = (event: Event) => {
      const scroller = event.target instanceof HTMLElement ? event.target : document.scrollingElement;
      if (!scroller || scroller.scrollHeight <= scroller.clientHeight) return;
      const depth = Math.round((scroller.scrollTop + scroller.clientHeight) / scroller.scrollHeight * 100);
      scrollDepth = Math.max(scrollDepth, Math.min(100, depth));
    };
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest("a, button, [role=button]");
      if (!control) return;
      clickCount++;
      const label = control.getAttribute("aria-label") || control.textContent?.trim().replace(/\s+/g, " ") || control.tagName.toLowerCase();
      const href = control.getAttribute("href");
      const destination = href && !/^(mailto|tel):/i.test(href) ? href.split(/[?#]/, 1)[0] : "";
      record("click", label, destination ? `URL: ${destination}` : "");
    };

    const watched = new Map<HTMLElement, string>();
    const visible = new Map<HTMLElement, { started: number; timer?: number }>();
    const seen = new Set<string>();

    function stopWatching(el: HTMLElement) {
      const view = visible.get(el);
      if (!view) return;
      visible.delete(el);
      window.clearTimeout(view.timer);
      if (watched.get(el) !== "" || document.hidden) return;
      const seconds = Math.floor((Date.now() - view.started) / 1000);
      const label = el.dataset.section || el.querySelector("h1,h2,h3,h4")?.textContent?.trim() || el.id;
      if (seconds >= 2 && label) record("section_view", label, `Viewed section for ${seconds}s`);
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const key = watched.get(el);
        if (!entry.isIntersecting || entry.intersectionRect.height < Math.min(32, entry.boundingClientRect.height / 2) || document.hidden || key === undefined) {
          stopWatching(el);
          continue;
        }
        if (visible.has(el)) continue;
        const view: { started: number; timer?: number } = { started: Date.now() };
        visible.set(el, view);
        if (!key) continue;
        const isStory = el.dataset.analyticsType === "story";
        const recordView = () => {
          if (document.hidden || !el.isConnected || watched.get(el) !== key || (!isStory && seen.has(key))) return;
          if (!isStory) seen.add(key);
          const { analyticsId, analyticsType, analyticsTitle, analyticsPublishedAt } = el.dataset;
          record("content_view", analyticsTitle || analyticsId || "", "", {
            contentId: analyticsId,
            contentType: analyticsType,
            contentTitle: analyticsTitle,
            contentPublishedAt: analyticsPublishedAt,
          }, view.started);
        };
        if (isStory) recordView();
        else if (!seen.has(key)) view.timer = window.setTimeout(recordView, 400);
      }
    }, { threshold: [0, 0.01, 0.05, 0.5] });

    const scan = () => {
      frame = undefined;
      const targets = new Set(document.querySelectorAll<HTMLElement>(trackedSelector));
      for (const [el, previous] of watched) {
        const current = el.dataset.analyticsId && el.dataset.analyticsType ? `${el.dataset.analyticsType}:${el.dataset.analyticsId}` : "";
        if (targets.has(el) && current === previous) continue;
        stopWatching(el);
        observer.unobserve(el);
        watched.delete(el);
      }
      for (const el of targets) {
        if (watched.has(el)) continue;
        const key = el.dataset.analyticsId && el.dataset.analyticsType ? `${el.dataset.analyticsType}:${el.dataset.analyticsId}` : "";
        watched.set(el, key);
        observer.observe(el);
      }
    };
    const changes = new MutationObserver(() => {
      if (frame === undefined) frame = requestAnimationFrame(scan);
    });
    changes.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-analytics-id", "data-analytics-type"] });
    scan();

    function flushOnExit() {
      for (const el of visible.keys()) stopWatching(el);
      const events = [...inFlight, ...pending];
      for (let index = 0; index < Math.max(1, events.length); index += 30) {
        void transmit(events.slice(index, index + 30)).catch(() => {});
      }
    }

    function handleVisibility() {
      if (document.hidden) {
        flushOnExit();
      } else {
        for (const el of watched.keys()) {
          observer.unobserve(el);
          observer.observe(el);
        }
      }
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    window.addEventListener("pagehide", flushOnExit);
    return () => {
      if (window.location.pathname !== pathname) bounced = false;
      flushOnExit();
      closed = true;
      if (frame !== undefined) cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      changes.disconnect();
      observer.disconnect();
      document.removeEventListener("click", handleClick);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("pagehide", flushOnExit);
      if (liveWindow.reportActivity === reportActivity) delete liveWindow.reportActivity;
    };
  }, [pathname]);

  return null;
}
