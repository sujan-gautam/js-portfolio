import { useEffect, useState } from "react";
import StoriesSection from "@/components/StoriesSection";
import HeroSection from "@/components/HeroSection";
import SEO from "@/components/SEO";
import axios from "axios";
import { API_BASE } from "@/config";

const Index = () => {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    // Track homepage view
    axios.post(`${API_BASE}/visitors/track`, {
      page: "/",
      browser: navigator.userAgent
    }).catch(err => console.error("Tracking failed", err));

    // Fetch settings for SEO
    axios.get(`${API_BASE}/singleton/settings`).then(r => setSettings(r.data)).catch(() => {});
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Sujan Gautam",
    "alternateName": "sujan-gautam",
    "url": "https://sujan1919.com.np",
    "image": settings?.ogImage || settings?.siteLogo || settings?.favicon || "https://sujan1919.com.np/assets/logo.png",
    "jobTitle": "Senior Software Developer & UI Architect",
    "worksFor": {
      "@type": "Organization",
      "name": "Freelance"
    },
    "sameAs": [
      "https://github.com/sujan-gautam",
      "https://www.linkedin.com/in/sujan-gautam-109524275/",
      "https://instagram.com/sujaan.gautam"
    ]
  };

  return (
    <>
      <SEO 
        title="Sujan Gautam | Full-Stack Developer & UI Architect" 
        description="Official portfolio of Sujan Gautam. High-fidelity UI/UX design, scalable backend systems, and cutting-edge web technologies."
        structuredData={structuredData}
      />
      <div className="min-h-screen pb-20">
        <StoriesSection />
        <HeroSection />
      </div>
    </>
  );
};

export default Index;
