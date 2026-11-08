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
      <main className="mx-auto min-h-screen max-w-5xl px-5 pb-28 font-inter text-foreground sm:px-8">
        <HeroSection />
        {projects === null && (
          <div role="status" className="rounded-xl border border-border">
            <span className="sr-only">Loading projects</span>
            <Skeleton className="aspect-[23/10] md:h-64" />
          </div>
        )}
        {featured && <FeaturedProject key={featured.id} project={featured} />}
        {featured && (
          <section aria-labelledby="home-work" className="mt-5 border-b border-border pb-2 sm:mt-7">
            <div className="flex flex-wrap items-center justify-between gap-x-4 border-b border-border">
              <h2 id="home-work" className="font-poppins text-lg font-medium tracking-tight">{otherProjects.length ? "More work" : "Portfolio"}</h2>
              <Link to="/portfolio/" className={`${workLink} inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground`}>
                All projects <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
            {otherProjects.length > 0 && (
              <ul className="divide-y divide-border">
                {otherProjects.map((project) => (
                  <li key={project.id}>
                    <ProjectLink project={project} className={`${workLink} group flex min-h-12 items-center justify-between gap-3 py-2 text-sm`}>
                      <span className="min-w-0 break-words font-medium group-hover:underline group-hover:underline-offset-4">{project.title}</span>
                      <span className="flex shrink-0 items-center gap-4 text-muted-foreground">
                        {project.category && <span className="hidden text-xs sm:inline">{project.category}</span>}
                        <ArrowRight size={16} aria-hidden="true" className="group-hover:text-foreground" />
                      </span>
                    </ProjectLink>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        <section aria-label="Stories and music" className="-mx-4 mt-4">
          <StoriesSection showLabel={false} />
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
    <section aria-labelledby="home-feature" className={`overflow-hidden rounded-xl border border-border bg-card ${showImage ? "md:grid md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : ""}`}>
      {showImage && (
        <img
          src={project.image}
          alt=""
          className="aspect-[23/10] h-full w-full border-b border-border object-cover object-top md:border-b-0 md:border-r"
          onError={() => setImageFailed(true)}
          fetchPriority="high"
        />
      )}
      <div className="flex min-w-0 flex-col justify-center px-5 py-4 sm:px-7 sm:py-6">
        <p className="mb-2 text-xs font-medium text-red-400">Featured project</p>
        <h2 id="home-feature" className="break-words font-poppins text-xl font-semibold leading-tight tracking-tight sm:text-[1.75rem]">{project.title}</h2>
        {description && <p className="mt-2 line-clamp-3 max-w-prose break-words text-sm leading-relaxed text-muted-foreground">{description}</p>}
        <ProjectLink project={project} className={`${workLink} mt-2 inline-flex min-h-11 w-fit items-center gap-2 text-sm font-medium hover:underline hover:underline-offset-4`}>
          View project <ArrowRight size={16} aria-hidden="true" />
        </ProjectLink>
      </div>
    </section>
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
