import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { aboutDB, slidersDB, type AboutData, type SliderItem } from "@/lib/adminData";
import { SmartText } from "@/components/ui/SmartText";
import { Skeleton } from "@/components/ui/skeleton";
import profileFallback from "@/assets/profile-3.jpg";

type HomeProfile = Partial<AboutData> & { description?: string };

const heroLayout = "grid items-center gap-7 pb-8 pt-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-10 md:pb-12 md:pt-14";
const portraitClass = "aspect-[16/10] w-full rounded-lg border border-border bg-card object-cover object-[50%_40%] md:aspect-[4/3]";
const actionClass = "inline-flex min-h-11 items-center gap-2 rounded-md px-3.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";
const photoButtonClass = "grid size-11 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";

export default function HeroSection() {
  const [about, setAbout] = useState<HomeProfile>({});
  const [slides, setSlides] = useState<SliderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [failedImage, setFailedImage] = useState<string>();

  useEffect(() => {
    let active = true;
    Promise.all([aboutDB.get(), slidersDB.getAll()]).then(([profile, images]) => {
      if (!active) return;
      setAbout(profile ?? {});
      if (Array.isArray(images)) {
        setSlides(images.filter((image) => image.active && image.image).sort((a, b) => a.order - b.order));
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const name = about.name?.trim() || "Sujan Gautam";
  const description = about.description?.trim() || about.bio?.trim();
  const slide = slides[currentSlide];
  const useSlideImage = slide && slide.image !== failedImage;
  const changePhoto = (direction: number) => {
    setCurrentSlide((index) => (index + direction + slides.length) % slides.length);
  };

  if (loading) {
    return (
      <header className={heroLayout} aria-busy="true">
        <p role="status" className="sr-only">Loading profile</p>
        <div className="space-y-4" aria-hidden="true">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className={portraitClass} />
      </header>
    );
  }

  return (
    <header className={heroLayout}>
      <div className="min-w-0">
        <div aria-hidden="true" className="mb-4 h-0.5 w-9 rounded-full bg-primary" />
        <h1 className="break-words font-poppins text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.08] tracking-tight">
          {name}
        </h1>
        {about.title && <p className="mt-2 text-base font-medium text-muted-foreground sm:text-lg">{about.title}</p>}
        {description && (
          <p className="mt-5 max-w-[54ch] whitespace-pre-line break-words text-sm leading-relaxed text-foreground/80 sm:text-base [&_a]:text-red-400 [&_a]:underline [&_a]:underline-offset-2">
            <SmartText text={description} />
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link to="/portfolio/" className={`${actionClass} border border-border bg-card hover:bg-secondary`}>
            View portfolio <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/contact/" className={`${actionClass} text-muted-foreground hover:bg-secondary hover:text-foreground`}>
            Get in touch
          </Link>
        </div>
      </div>

      <figure className="min-w-0">
        <img
          src={useSlideImage ? slide.image : profileFallback}
          alt={(useSlideImage && slide.title?.trim()) || name}
          className={portraitClass}
          style={useSlideImage && slide.filter ? { filter: slide.filter } : undefined}
          onError={() => { if (useSlideImage) setFailedImage(slide.image); }}
          fetchPriority="high"
          width={800}
          height={600}
        />
        {slides.length > 1 && (
          <figcaption className="mt-1 flex items-center justify-between">
            <span className="pl-1 text-xs tabular-nums text-muted-foreground" aria-live="polite">
              <span className="sr-only">Photo </span>{currentSlide + 1} of {slides.length}
            </span>
            <div className="flex">
              <button type="button" aria-label="Previous photo" onClick={() => changePhoto(-1)} className={photoButtonClass}>
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button type="button" aria-label="Next photo" onClick={() => changePhoto(1)} className={photoButtonClass}>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </figcaption>
        )}
      </figure>
    </header>
  );
}
