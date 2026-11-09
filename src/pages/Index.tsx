import { contentTracking } from "@/lib/contentTracking";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, UsersRound } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import SEO from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { portfolioDB, type PortfolioItem } from "@/lib/adminData";
import { projectUrl } from "@/lib/projectUrl";
import axios from "axios";
import { API_BASE } from "@/config";

const workLink = "rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";

const Index = () => {
  const { search, hash } = useLocation();
  if (new URLSearchParams(search).get("story")) {
    return <Navigate to={{ pathname: "/feed/", search, hash }} replace />;
  }
  return <Home />;
};

function Home() {
  const [settings, setSettings] = useState<any>(null);
  const [projects, setProjects] = useState<PortfolioItem[] | null>(null);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    axios.get(`${API_BASE}/singleton/settings`).then((response) => {
      if (active) setSettings(response.data);
    }).catch(() => {});
    portfolioDB.getAll().then((items) => {
      if (!active) return;
      setProjects(Array.isArray(items) ? items.filter((project) => project.status !== false && project.title?.trim()) : []);
    });
    axios.get<{ visitorCount: number }>(`${API_BASE}/analytics/visitor-count`).then(({ data }) => {
      if (active && Number.isSafeInteger(data?.visitorCount) && data.visitorCount >= 0) {
        setVisitorCount(data.visitorCount);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const featured = projects?.find((project) => project.featuredOnHome)
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
      <main className="mx-auto min-h-screen max-w-[56rem] px-5 pb-28 pt-9 font-inter text-foreground sm:px-8 sm:pt-14">
        <HeroSection />
        <section aria-labelledby="home-work" className="mt-6 sm:mt-8">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 sm:mb-3">
            <h2 id="home-work" className="font-poppins text-xl font-semibold tracking-tight sm:text-2xl">Selected work</h2>
            <Link to="/portfolio/" className={`${workLink} inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground`}>
              All projects <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          {projects === null && (
            <div role="status" className="overflow-hidden rounded-lg border border-border">
              <span className="sr-only">Loading projects</span>
              <Skeleton className="aspect-[23/10] rounded-none" />
            </div>
          )}
          {featured && <FeaturedProject key={featured.id} project={featured} />}
          {otherProjects.length > 0 && (
            <div className="mt-4 sm:mt-6">
              <ul aria-label="More projects" className="divide-y divide-border border-y border-border">
                {otherProjects.map((project) => (
                  <li key={project.id} {...contentTracking("project", project.id, project.title, project.createdAt)}>
                    <ProjectLink project={project} className={`${workLink} group flex min-h-12 items-center justify-between gap-4 py-2 text-sm transition-colors hover:text-foreground`}>
                      <span className="break-words font-medium">{project.title}</span>
                      <span className="flex shrink-0 items-center gap-4 text-muted-foreground">
                        {project.category && <span className="hidden text-xs sm:inline">{project.category}</span>}
                        <ArrowRight size={15} aria-hidden="true" className="group-hover:text-foreground" />
                      </span>
                    </ProjectLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
        {visitorCount !== null && (
          <footer className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:mt-6">
            <UsersRound size={15} aria-hidden="true" />
            <span>Visitor sessions</span>
            <span className="font-medium tabular-nums text-foreground">{visitorCount.toLocaleString()}</span>
          </footer>
        )}
      </main>
    </>
  );
}

function FeaturedProject({ project }: { project: PortfolioItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = project.image && !imageFailed;
  const description = project.description?.trim().split("\n")[0];

  return (
    <article {...contentTracking("project", project.id, project.title, project.createdAt)} aria-labelledby="home-feature" className="group relative rounded-lg">
      {showImage && (
        <img
          src={project.image}
          alt=""
          className="aspect-[23/10] w-full rounded-lg border border-border object-cover object-top"
          onError={() => setImageFailed(true)}
          fetchPriority="high"
        />
      )}
      <div className="flex items-center justify-between gap-3 pt-3 sm:gap-5 sm:pt-4">
        <div className="min-w-0">
          <h3 id="home-feature" className="break-words font-poppins text-lg font-semibold leading-tight tracking-tight sm:text-xl">{project.title}</h3>
          {description && <p className="mt-1.5 line-clamp-3 max-w-prose break-words text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        <ProjectLink project={project} className="grid size-9 shrink-0 place-items-center text-muted-foreground transition-colors after:absolute after:-inset-1 after:rounded-lg after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring group-hover:text-foreground">
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
