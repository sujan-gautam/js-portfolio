import { useEffect } from "react";
import StoriesSection from "@/components/StoriesSection";
import HeroSection from "@/components/HeroSection";
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

  return (
    <div className="min-h-screen pb-20">
      <StoriesSection />
      <HeroSection />
    </div>
  );
};

export default Index;
