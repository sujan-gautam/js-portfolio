import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import StoriesSection from "@/components/StoriesSection";
import HeroSection from "@/components/HeroSection";
import SEO from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { portfolioDB, type PortfolioItem } from "@/lib/adminData";
import { projectUrl } from "@/lib/projectUrl";
import axios from "axios";
import { API_BASE } from "@/config";

const featuredPath = "/mitas-kitchen/";
const workLink = "rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";

const Index = () => {
  const [settings, setSettings] = useState<any>(null);
  const [projects, setProjects] = useState<PortfolioItem[] | null>(null);

  useEffect(() => {
    let active = true;
    axios.get(`${API_BASE}/singleton/settings`).then((response) => {
      if (active) setSettings(response.data);
    }).catch(() => {});
    portfolioDB.getAll().then((items) => {
      if (!active) return;
      setProjects(Array.isArray(items) ? items.filter((project) => project.status !== false && project.title?.trim()) : []);
    });
    return () => { active = false; };
  }, []);

  const featured = projects?.find((project) => projectUrl(project.link) === featuredPath && project.image)
    ?? projects?.find((project) => project.image)
    ?? projects?.[0];
  const otherProjects = projects?.filter((project) => project.id !== featured?.id).slice(0, 3) ?? [];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Sujan Gautam",
    "alternateName": "sujan-gautam",
    "url": "https://sujan1919.com.np",
    "image": settings?.ogImage || settings?.siteLogo || settings?.favicon || "https://sujan1919.com.np/assets/logo.png",
    "jobTitle": "Full-Stack Software Engineer",
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
        title="Sujan Gautam | Full-Stack Software Engineer"
        description="Explore Sujan Gautam’s software projects, writing, and background."
        structuredData={structuredData}
      />
      <main className="mx-auto grid min-h-screen max-w-6xl content-start gap-y-6 px-5 pb-28 pt-7 font-inter text-foreground sm:px-8 sm:pt-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-9 lg:pt-14">
        <HeroSection />
        <section aria-labelledby="home-work" className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:border-l lg:border-border lg:pl-9">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4">
            <h2 id="home-work" className="font-poppins text-xl font-semibold tracking-tight sm:text-2xl">Selected work</h2>
            <Link to="/portfolio/" className={`${workLink} inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground`}>
              All projects <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          {projects === null && (
            <div role="status" className="overflow-hidden rounded-xl border border-border">
              <span className="sr-only">Loading projects</span>
              <Skeleton className="aspect-[23/10] rounded-none" />
            </div>
          )}
          {featured && <FeaturedProject key={featured.id} project={featured} />}
          {otherProjects.length > 0 && (
            <div className="mt-5">
              <h3 id="more-projects" className="mb-2 text-xs font-medium text-muted-foreground">More projects</h3>
              <ul aria-labelledby="more-projects" className="divide-y divide-border rounded-lg border border-border">
                {otherProjects.map((project) => (
                  <li key={project.id}>
                    <ProjectLink project={project} className={`${workLink} group grid min-h-14 grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-card sm:grid-cols-[4rem_minmax(0,1fr)_auto]`}>
                      <span aria-hidden="true" className="aspect-video overflow-hidden rounded border border-border bg-card">
                        {project.image && <img src={project.image} alt="" loading="lazy" className="size-full object-cover object-top" onError={(event) => { event.currentTarget.hidden = true; }} />}
                      </span>
                      <span className="break-words font-medium">{project.title}</span>
                      <span className="flex items-center gap-4 text-muted-foreground">
                        {project.category && <span className="hidden text-xs sm:inline">{project.category}</span>}
                        <ArrowRight size={16} aria-hidden="true" className="group-hover:text-foreground" />
                      </span>
                    </ProjectLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
        <section aria-labelledby="home-feed" className="min-w-0 lg:col-start-1 lg:row-start-2">
          <div className="flex items-center justify-between gap-2">
            <h2 id="home-feed" className="text-sm font-medium">From the feed</h2>
            <Link to="/feed/" className={`${workLink} inline-flex min-h-11 items-center gap-1 text-xs text-muted-foreground hover:text-foreground`}>
              Open feed <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <StoriesSection showLabel={false} compact />
        </section>
      </main>
    </>
  );
};

function FeaturedProject({ project }: { project: PortfolioItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = project.image && !imageFailed;
  const description = projectUrl(project.link) === featuredPath
    ? "A website for a Himalayan restaurant, with its menu, location, and contact details in one place."
    : project.description?.trim().split("\n")[0];

  return (
    <article aria-labelledby="home-feature" className="group relative overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-muted-foreground/50">
      {showImage && (
        <img
          src={project.image}
          alt=""
          className="aspect-[23/10] w-full border-b border-border object-cover object-top"
          onError={() => setImageFailed(true)}
          fetchPriority="high"
        />
      )}
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:gap-5 sm:px-5">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium text-red-400">Featured project</p>
          <h3 id="home-feature" className="break-words font-poppins text-lg font-semibold leading-tight tracking-tight sm:text-xl">{project.title}</h3>
          {description && <p className="mt-1.5 line-clamp-3 max-w-prose break-words text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        <ProjectLink project={project} className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring group-hover:border-muted-foreground/50 group-hover:text-foreground">
          <span className="sr-only">View project</span>
          <ArrowRight size={18} aria-hidden="true" />
        </ProjectLink>
      </div>
    </article>
  );
}

function ProjectLink({ project, className, children }: { project: PortfolioItem; className: string; children: ReactNode }) {
  const url = projectUrl(project.link) || projectUrl(project.demoUrl);
  return url && !url.startsWith("/") ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>{children}<span className="sr-only"> (opens in a new tab)</span></a>
  ) : (
    <Link to={url ?? "/portfolio/"} className={className}>{children}</Link>
  );
}

export default Index;
