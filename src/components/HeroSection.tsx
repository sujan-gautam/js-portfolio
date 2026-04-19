import { useState, useEffect } from "react";
import { Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { aboutDB, slidersDB, SliderItem, AboutData } from "@/lib/adminData";
import axios from "axios";
import { API_BASE } from "@/config";
import { SmartText } from "@/components/ui/SmartText";

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [about, setAbout] = useState<AboutData | null>(null);
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [visitorCount, setVisitorCount] = useState(56170);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      // Fetch About & Sliders simultaneously
      const [aboutData, slidersData] = await Promise.all([
        aboutDB.get(),
        slidersDB.getAll()
      ]);
      setAbout(aboutData);
      setSliders(slidersData.filter(s => s.active));

      // Track Visitor safely
      try {
        const res = await axios.post(`${API_BASE}/visitors/track`, {
           page: "/", device: navigator.userAgent
        });
        setVisitorCount(res.data.count);
      } catch (err) {
        // Fallback to static count if offline
        console.error("Visitor track failed", err);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const sortedSliders = sliders.sort((a,b) => a.order - b.order);
  const visuals = sortedSliders.map(s => s.image);
  const totalSlides = visuals.length;

  const prev = () => setCurrentSlide((c) => (c === 0 ? totalSlides - 1 : c - 1));
  const next = () => setCurrentSlide((c) => (c === totalSlides - 1 ? 0 : c + 1));

  // Determine roles based on comma separated string or fallback
  const roleText = about?.title || "Web Designer / Developer";
  const roles = roleText.split(/[/&,]/).map(r => r.trim()).filter(Boolean);

  if (isLoading) {
    return (
      <section className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 px-6 py-10 max-w-6xl mx-auto">
        <div className="w-72 h-72 md:w-96 md:h-96 rounded-full bg-muted animate-pulse border-2 border-border" />
        <div className="flex-1 space-y-4 w-full">
          <div className="h-10 bg-muted animate-pulse rounded w-3/4 mx-auto lg:mx-0" />
          <div className="h-6 bg-muted animate-pulse rounded w-1/2 mx-auto lg:mx-0" />
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded w-full" />
            <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
          </div>
          <div className="h-12 bg-muted animate-pulse rounded-full w-40 mx-auto lg:mx-0" />
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 px-6 py-20 max-w-5xl mx-auto min-h-[70vh]">
      {/* Circular Image Carousel */}
      {totalSlides > 0 && (
        <div className="relative flex-shrink-0">
          <div className="w-72 h-72 md:w-96 md:h-96 rounded-full overflow-hidden border-2 border-border relative">
            <div className="absolute inset-0 bg-background/20 z-10 pointer-events-none" />
            <img
              src={visuals[currentSlide]}
              alt={about?.name || "Sujan"}
              className="w-full h-full object-cover"
              width={800}
              height={800}
            />
          </div>

          {/* Nav arrows only if there are multiple slides */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight size={28} />
              </button>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-3">
                {visuals.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentSlide ? "bg-foreground" : "bg-muted-foreground/40"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Text Content */}
      <div className="flex-1 text-center lg:text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-hero-title mb-2">
          Hi, I Am {about?.name?.split(" ")[0] || "Sujan"}
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold mb-6">
          {roles.map((role, idx) => (
            <span key={idx}>
              <span className="text-hero-role">{role}</span>
              {idx < roles.length - 1 && <span className="text-hero-role"> / </span>}
            </span>
          ))}
        </h2>
        <div className="text-hero-desc leading-relaxed text-sm md:text-base mb-8 max-w-lg whitespace-pre-wrap">
          <SmartText text={(about as any)?.description || about?.bio || "Hey! I Am A Part Time Web Designer & Developer (Frontend/Backend), Currently Learning Flutter. I Can Perfectly Design/Develop A Website For Any Orgs, Institutes, Offices Or For A Particular Person. Check Out My Portfolios From The Sections Below And Do Check Our Social Media Handles @Webwithfreelancer🙌!"} />
        </div>

        {/* Hire Me Button */}
        <a 
          href={`tel:${about?.phone || ""}`} 
          className="inline-flex items-center gap-3 bg-hire text-white px-6 py-3 rounded-full font-semibold text-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg shadow-primary/20"
        >
          Hire Me
          <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm">
            <Phone size={18} className="text-primary fill-primary" />
          </span>
        </a>

        {/* Visitor Count */}
        <div className="mt-6">
          <p className="text-muted-foreground text-sm">Total Visitors:</p>
          <p className="text-foreground font-medium">{visitorCount.toLocaleString()}</p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
