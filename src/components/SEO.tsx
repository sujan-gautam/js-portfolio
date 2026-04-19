import { useEffect } from "react";
import { settingsDB } from "@/lib/adminData";

export default function SEO() {
  useEffect(() => {
    settingsDB.get().then(settings => {
      if (settings.siteName) {
        document.title = settings.siteName;
      }
      
      const updateMeta = (name: string, content: string, isOpengraph = false) => {
        if (!content) return;
        const attr = isOpengraph ? 'property' : 'name';
        let el = document.querySelector(`meta[${attr}="${name}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute(attr, name);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      updateMeta('description', settings.siteDescription);
      updateMeta('keywords', settings.seoKeywords || "");
      updateMeta('author', settings.seoAuthor || "");
      updateMeta('theme-color', settings.seoThemeColor || "#CB2729");
      
      updateMeta('og:title', settings.seoTitle || settings.siteName, true);
      updateMeta('og:description', settings.siteDescription, true);
      updateMeta('og:image', settings.ogImage || "", true);
      updateMeta('og:type', settings.ogType || 'website', true);

      updateMeta('twitter:card', 'summary_large_image');
      updateMeta('twitter:title', settings.seoTitle || settings.siteName);
      updateMeta('twitter:description', settings.siteDescription);
      updateMeta('twitter:image', settings.ogImage || "");
      if (settings.twitterHandle) {
        updateMeta('twitter:creator', settings.twitterHandle);
      }

      // Update Favicon
      if (settings.favicon) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = settings.favicon;
      }
    }).catch(err => console.error("Failed to load SEO settings", err));
  }, []);

  return null;
}
