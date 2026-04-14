import StoriesSection from "@/components/StoriesSection";
import HeroSection from "@/components/HeroSection";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <StoriesSection />
      <HeroSection />
      <BottomNav />
    </div>
  );
};

export default Index;
