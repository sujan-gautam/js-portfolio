import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, ChevronLeft, ChevronRight, Images, MapPin, X } from "lucide-react";
import { Link } from "react-router-dom";
import { aboutDB, slidersDB, type AboutData, type SliderItem } from "@/lib/adminData";
import { Skeleton } from "@/components/ui/skeleton";
import profileFallback from "@/assets/profile-3.jpg";

const masthead = "min-w-0 border-b border-border pb-4 lg:col-start-1 lg:row-start-1 lg:pb-5";
const avatar = "size-14 shrink-0 rounded-lg border border-border bg-card object-cover object-[50%_40%] sm:size-16 lg:size-[88px]";
const action = "inline-flex min-h-11 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";
const galleryButton = "grid size-11 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";

export default function HeroSection() {
  const [about, setAbout] = useState<Partial<AboutData>>({});
  const [slides, setSlides] = useState<SliderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);

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
  const avatarSlide = slides[0];
  const currentPhoto = slides[currentSlide];
  const photoSource = (slide: SliderItem | undefined) => slide && !failedImages.includes(slide.image) ? slide.image : profileFallback;
  const markFailed = (source: string) => {
    if (source !== profileFallback) setFailedImages((images) => images.includes(source) ? images : [...images, source]);
  };
  const changePhoto = (direction: number) => {
    setCurrentSlide((index) => (index + direction + slides.length) % slides.length);
  };

  if (loading) {
    return (
      <header className={masthead} aria-busy="true">
        <p role="status" className="sr-only">Loading profile</p>
        <div aria-hidden="true" className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-4">
          <Skeleton className={avatar} />
          <div className="space-y-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </header>
    );
  }

  const avatarSource = photoSource(avatarSlide);
  const gallerySource = photoSource(currentPhoto);
  const portrait = (
    <img
      src={avatarSource}
      alt=""
      className={avatar}
      style={{ filter: avatarSource !== profileFallback ? avatarSlide?.filter : undefined }}
      onError={() => markFailed(avatarSource)}
    />
  );

  return (
    <header className={masthead}>
      <div className="flex min-w-0 items-center gap-3 sm:gap-4 lg:flex-col lg:items-start">
        {slides.length > 1 ? (
          <Dialog.Root onOpenChange={(open) => { if (open) setCurrentSlide(0); }}>
            <Dialog.Trigger aria-label="Open photo gallery" className="group relative shrink-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
              {portrait}
              <span aria-hidden="true" className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-md border border-border bg-card text-muted-foreground group-hover:text-foreground">
                <Images size={12} />
              </span>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/75" />
              <Dialog.Content
                aria-describedby={undefined}
                className="fixed inset-x-4 top-1/2 z-[10001] mx-auto max-w-2xl -translate-y-1/2 overflow-hidden rounded-xl border border-border bg-card font-inter text-foreground"
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                    event.preventDefault();
                    changePhoto(event.key === "ArrowLeft" ? -1 : 1);
                  }
                }}
              >
                <header className="flex items-center justify-between gap-3 px-3 py-1 sm:px-4">
                  <Dialog.Title className="text-sm font-medium">Photos</Dialog.Title>
                  <Dialog.Close aria-label="Close photo gallery" className={galleryButton}><X size={19} aria-hidden="true" /></Dialog.Close>
                </header>
                <img
                  src={gallerySource}
                  alt={currentPhoto?.title?.trim() || name}
                  className="h-[min(58dvh,36rem)] w-full border-y border-border bg-background object-contain"
                  style={{ filter: gallerySource !== profileFallback ? currentPhoto?.filter : undefined }}
                  onError={() => markFailed(gallerySource)}
                />
                <div className="flex items-center justify-between px-3 py-1 sm:px-4">
                  <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
                    Photo {currentSlide + 1} of {slides.length}
                  </p>
                  <div className="flex">
                    <button type="button" aria-label="Previous photo" onClick={() => changePhoto(-1)} className={galleryButton}><ChevronLeft size={19} aria-hidden="true" /></button>
                    <button type="button" aria-label="Next photo" onClick={() => changePhoto(1)} className={galleryButton}><ChevronRight size={19} aria-hidden="true" /></button>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        ) : portrait}
        <div className="min-w-0">
          <h1 className="break-words font-poppins text-2xl font-semibold leading-tight tracking-tight sm:text-[1.75rem]">{name}</h1>
          {about.title && <p className="mt-0.5 break-words text-sm text-muted-foreground lg:mt-1">{about.title}</p>}
          {about.address && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground lg:mt-3">
              <MapPin size={13} className="shrink-0" aria-hidden="true" /> {about.address}
            </p>
          )}
        </div>
      </div>
      <div className="-ml-2.5 mt-2 flex flex-wrap items-center gap-x-1 lg:mt-3">
        <Link to="/about/" className={`${action} text-muted-foreground hover:bg-secondary hover:text-foreground`}>About</Link>
        <Link to="/contact/" className={`${action} text-foreground hover:bg-secondary`}>
          Contact <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
