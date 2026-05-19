import { useEffect } from "react";
import StoriesSection from "@/components/StoriesSection";
import HeroSection from "@/components/HeroSection";
import SEO from "@/components/SEO";
import axios from "axios";
import { API_BASE } from "@/config";

const Index = () => {
  useEffect(() => {
    // Track homepage view
    axios.post(`${API_BASE}/visitors/track`, {
      page: "/",
      browser: navigator.userAgent
    }).catch(err => console.error("Tracking failed", err));
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Sujan Gautam",
    "alternateName": "sujan1919",
    "url": "https://sujan1919.com.np",
    "image": "https://sujan1919.com.np/assets/logo.png",
    "jobTitle": "Senior Software Developer & UI Architect",
    "worksFor": {
      "@type": "Organization",
      "name": "Freelance"
    },
    "sameAs": [
      "https://github.com/sujan1919",
      "https://linkedin.com/in/sujan1919"
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
