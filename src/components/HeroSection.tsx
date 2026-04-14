import { useState } from "react";
import { Phone, ChevronLeft, ChevronRight } from "lucide-react";
import profile1 from "@/assets/profile-1.jpg";
import profile2 from "@/assets/profile-2.jpg";
import profile3 from "@/assets/profile-3.jpg";

const images = [profile1, profile2, profile3];

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const prev = () => setCurrentSlide((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrentSlide((c) => (c === images.length - 1 ? 0 : c + 1));

  return (
    <section className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 px-6 py-10 max-w-6xl mx-auto">
      {/* Circular Image Carousel */}
      <div className="relative flex-shrink-0">
        <div className="w-72 h-72 md:w-96 md:h-96 rounded-full overflow-hidden border-2 border-border relative">
          <div className="absolute inset-0 bg-background/20 z-10 pointer-events-none" />
          <img
            src={images[currentSlide]}
            alt="Sujan"
            className="w-full h-full object-cover"
            width={800}
            height={800}
          />
          {/* Overlay text */}
          <div className="absolute top-6 left-0 right-0 z-20 text-center">
            <p className="text-foreground text-sm font-medium leading-tight">
              Click Here To Check Out
              <br />
              Cool Stories!
            </p>
          </div>
        </div>

        {/* Nav arrows */}
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
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentSlide ? "bg-foreground" : "bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Text Content */}
      <div className="flex-1 text-center lg:text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-hero-title mb-2">
          Hi, I Am Sujan
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold mb-6">
          <span className="text-hero-role">Web Designer</span>
          <span className="text-hero-role"> / </span>
          <span className="text-hero-role">Developer</span>
        </h2>
        <p className="text-hero-desc leading-relaxed text-sm md:text-base mb-8 max-w-lg">
          Hey! I Am A Part Time Web Designer & Developer (Frontend/Backend), Currently Learning Flutter. I Can Perfectly Design/Develop A Website For Any Orgs, Institutes, Offices Or For A Particular Person. Check Out My Portfolios From The Sections Below And Do Check Our Social Media Handles @Webwithfreelancer🙌!
        </p>

        {/* Hire Me Button */}
        <button className="inline-flex items-center gap-3 bg-hire text-primary-foreground px-6 py-3 rounded-full font-semibold text-lg hover:opacity-90 transition-opacity">
          Hire Me
          <span className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Phone size={18} />
          </span>
        </button>

        {/* Visitor Count */}
        <div className="mt-6">
          <p className="text-muted-foreground text-sm">Total Visitors:</p>
          <p className="text-foreground font-medium">56170</p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
