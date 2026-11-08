import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import StoriesSection from "@/components/StoriesSection";
import HeroSection from "@/components/HeroSection";
import SEO from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { portfolioDB, type PortfolioItem } from "@/lib/adminData";
import { projectUrl } from "@/lib/projectUrl";
import axios from "axios";
import { API_BASE } from "@/config";

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
      setProjects(Array.isArray(items) ? items.filter((project) => project.status !== false && project.title?.trim()).slice(0, 2) : []);
    });
    return () => { active = false; };
  }, []);

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
        {(projects === null || projects.length > 0) && (
          <section aria-labelledby="home-work" aria-busy={projects === null} className="border-y border-border py-5 sm:py-7">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4">
              <h2 id="home-work" className="font-poppins text-xl font-semibold tracking-tight sm:text-2xl">Selected work</h2>
              <Link to="/portfolio/" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                All projects <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
              {projects === null ? (
                <>
                  <Skeleton className="aspect-[21/10] rounded-lg" />
                  <Skeleton className="aspect-[21/10] rounded-lg" />
                </>
              ) : projects.map((project) => <ProjectPreview key={project.id} project={project} />)}
            </div>
          </section>
        )}
        <section aria-label="Stories and music" className="-mx-4 mt-4">
          <StoriesSection showLabel={false} />
        </section>
      </main>
    </>
  );
};

function ProjectPreview({ project }: { project: PortfolioItem }) {
  const url = projectUrl(project.link) || projectUrl(project.demoUrl);
  const external = Boolean(url && !url.startsWith("/"));
  const Direction = external ? ArrowUpRight : ArrowRight;
  const className = "group block min-w-0 rounded-lg border border-border bg-card transition-colors hover:border-muted-foreground/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";
  const content = (
    <>
      {project.image && (
        <img
          src={project.image}
          alt=""
          loading="lazy"
          className="aspect-[21/10] w-full rounded-t-[7px] border-b border-border object-cover object-top"
          onError={(event) => { event.currentTarget.style.display = "none"; }}
        />
      )}
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <h3 className="break-words font-poppins text-base font-medium leading-snug">{project.title}</h3>
          {project.category && <p className="mt-1 text-xs text-muted-foreground">{project.category}</p>}
        </div>
        <Direction size={17} aria-hidden="true" className="shrink-0 text-muted-foreground group-hover:text-foreground" />
      </div>
    </>
  );
  return external ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>{content}</a>
  ) : (
    <Link to={url ?? "/portfolio/"} className={className}>{content}</Link>
  );
}

export default Index;
