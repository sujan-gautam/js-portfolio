import { useEffect, useRef, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, ArrowUpRight, MessageCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { portfolioDB, type PortfolioItem, aboutDB, type AboutData } from "@/lib/adminData";
import { API_BASE } from "@/config";
import { SmartText } from "@/components/ui/SmartText";
import { Skeleton } from "@/components/ui/skeleton";

const actionClass = "inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";
const projectAction = "inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";
const overlayClass = "fixed inset-0 z-[10000] bg-black/70";
const closeClass = "grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground";

function projectUrl(value: string) {
  const url = value?.trim();
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) return url;

  const isHttpUrl = /^https?:\/\//i.test(url);
  if (!isHttpUrl && (url.startsWith("/") || url.includes("://"))) return null;
  try {
    const external = new URL(isHttpUrl ? url : `https://${url}`);
    return external.username || external.password ? null : external.href;
  } catch {
    return null;
  }
}

const Portfolio = () => {
  const [projects, setProjects] = useState<PortfolioItem[]>([]);
  const [about, setAbout] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ title: string; url: string } | null>(null);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [chatProject, setChatProject] = useState<PortfolioItem | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{ question: string; answer: string }[]>([]);
  const [asking, setAsking] = useState(false);
  const [chatError, setChatError] = useState("");
  const questionRequest = useRef<AbortController | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const dialogTrigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    portfolioDB.getAll().then((data) => {
      setProjects(data.filter((project) => project.status !== false));
      setLoading(false);
    });
    aboutDB.get().then(setAbout);
    return () => questionRequest.current?.abort();
  }, []);

  useEffect(() => {
    const siteName = "Sujan Gautam | Sujan1919";
    const title = `Portfolio | ${siteName}`;
    const desc = "Web apps, websites, and developer tools built by Sujan Gautam.";
    const keywords = "Sujan Gautam Portfolio, Sujan1919 Projects, Full Stack Developer Portfolio, Software Developer Nepal, React Projects, Web Development Portfolio";
    const url = "https://sujan1919.com.np/portfolio/";

    document.title = title;
    setMeta("description", desc);
    setMeta("keywords", keywords);
    setMeta("author", "Sujan Gautam");
    setMeta("og:title", title, true);
    setMeta("og:description", desc, true);
    setMeta("og:url", url, true);
    setMeta("og:type", "website", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", desc);

    // Canonical
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = url;

    // JSON-LD CollectionPage schema
    const portfolioSchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Sujan Gautam's Work",
      "description": desc,
      "url": url,
      "about": {
        "@type": "Person",
        "name": "Sujan Gautam",
        "jobTitle": "Software Developer"
      },
      "hasPart": projects.map(p => ({
        "@type": "CreativeWork",
        "name": p.title,
        "description": p.description,
        "url": p.link || p.demoUrl,
        "image": p.image
      }))
    };

    let el = document.getElementById("ld-portfolio");
    if (!el) { el = document.createElement("script"); el.id = "ld-portfolio"; (el as HTMLScriptElement).type = "application/ld+json"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(portfolioSchema);

    return () => { document.getElementById("ld-portfolio")?.remove(); };
  }, [projects]);

  function setMeta(key: string, value: string, isProp = false) {
    if (!value) return;
    const attr = isProp ? "property" : "name";
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute("content", value);
  }

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: "nearest" });
  }, [messages, asking]);

  const categories = [...new Set(projects.map((project) => project.category).filter(Boolean))];
  const showFilters = categories.length > 1 || (categories.length === 1 && projects.some((project) => !project.category));
  const visibleProjects = filter ? projects.filter((project) => project.category === filter) : projects;

  const openChat = (project: PortfolioItem, trigger: HTMLButtonElement) => {
    dialogTrigger.current = trigger;
    setChatProject(project);
    setMessages([]);
    setQuestion("");
    setChatError("");
  };

  const closeChat = () => {
    questionRequest.current?.abort();
    questionRequest.current = null;
    setAsking(false);
    setChatProject(null);
  };

  const ask = async (value: string) => {
    const text = value.trim();
    if (!text || !chatProject || questionRequest.current) return;
    const controller = new AbortController();
    questionRequest.current = controller;
    setAsking(true);
    setChatError("");

    const prompt = `Answer this question about Sujan Gautam’s project using the details provided. Keep the answer concise and say when a detail is unavailable.
Project: ${chatProject.title}
Description: ${chatProject.description}
Category: ${chatProject.category || "Unspecified"}
Link: ${chatProject.link || chatProject.demoUrl || "Unavailable"}
Author background: ${about?.bio || ""}
Question: ${text}`;

    try {
      const { data } = await axios.post(`${API_BASE}/ai/ask`, { prompt }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (typeof data.answer !== "string" || !data.answer.trim()) throw new Error("Empty answer");
      setMessages((current) => [...current, { question: text, answer: data.answer }]);
      setQuestion("");
    } catch {
      if (!controller.signal.aborted) setChatError("Couldn’t load an answer. Try again.");
    } finally {
      if (questionRequest.current === controller) {
        questionRequest.current = null;
        setAsking(false);
      }
    }
  };

  const restoreDialogFocus = (event: Event) => {
    event.preventDefault();
    dialogTrigger.current?.focus();
  };

  const submitQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void ask(question);
  };

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 pb-28 pt-8 font-inter text-foreground sm:px-8 sm:pt-14">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-border pb-5">
        <h1 className="font-poppins text-3xl font-semibold tracking-tight sm:text-5xl">Portfolio</h1>
        {!loading && projects.length > 0 && (
          <p className="text-sm tabular-nums text-muted-foreground">
            {visibleProjects.length} {visibleProjects.length === 1 ? "project" : "projects"}
          </p>
        )}
      </header>

      {showFilters && (
        <div role="group" aria-label="Filter projects by category" className="flex flex-wrap gap-x-5 border-b border-border">
          {[null, ...categories].map((category) => (
            <button
              key={category ?? "__all"}
              type="button"
              onClick={() => setFilter(category)}
              aria-pressed={filter === category}
              className={`min-h-11 border-b-2 px-0.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${
                filter === category ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {category ?? "All"}
            </button>
          ))}
        </div>
      )}

      <section aria-label="Projects" aria-busy={loading} className="divide-y divide-border">
        {loading ? (
          <>
            <p className="sr-only" role="status">Loading projects</p>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} aria-hidden="true" className="grid items-center gap-5 py-6 md:grid-cols-2 md:gap-9">
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="space-y-3">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </>
        ) : visibleProjects.length > 0 ? (
          visibleProjects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              onAsk={(trigger) => openChat(project, trigger)}
              onPreview={(url, trigger) => {
                dialogTrigger.current = trigger;
                setIframeLoading(true);
                setPreview({ title: project.title, url });
              }}
            />
          ))
        ) : (
          <p role="status" className="py-8 text-sm text-muted-foreground">No projects to show.</p>
        )}
      </section>

      <Dialog.Root open={Boolean(chatProject)} onOpenChange={(open) => { if (!open) closeChat(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className={overlayClass} />
          <Dialog.Content
            aria-describedby={undefined}
            onCloseAutoFocus={restoreDialogFocus}
            className="fixed inset-x-4 top-1/2 z-[10001] mx-auto flex max-h-[85dvh] max-w-lg -translate-y-1/2 flex-col rounded-xl border border-border bg-background font-inter text-foreground"
          >
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-2 sm:px-5">
              <Dialog.Title className="min-w-0 break-words font-semibold">{chatProject?.title}</Dialog.Title>
              <Dialog.Close aria-label="Close project questions" className={closeClass}><X size={19} aria-hidden="true" /></Dialog.Close>
            </header>
            <div aria-live="polite" className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              {messages.length === 0 && !asking && (
                <div className="flex flex-wrap gap-2">
                  {["What does it do?", "How was it built?"].map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => void ask(suggestion)} className={`${actionClass} border border-border text-muted-foreground hover:bg-secondary hover:text-foreground`}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              {messages.map(({ question: sentQuestion, answer }, index) => (
                <div key={index} className="space-y-2 border-b border-border pb-4 text-sm leading-relaxed">
                  <p className="break-words font-medium">{sentQuestion}</p>
                  <p className="whitespace-pre-wrap break-words text-muted-foreground">{answer}</p>
                </div>
              ))}
              {asking && <p role="status" className="text-sm text-muted-foreground">Loading answer…</p>}
              <div ref={chatEnd} />
            </div>
            <form onSubmit={submitQuestion} className="shrink-0 border-t border-border p-4 sm:px-5">
              <label htmlFor="project-question" className="mb-2 block text-sm font-medium">Ask about this project</label>
              <div className="flex gap-2">
                <input
                  id="project-question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  className="min-w-0 flex-1 rounded-md border border-border bg-card px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                />
                <button type="submit" disabled={!question.trim() || asking} className={`${actionClass} bg-foreground text-background disabled:opacity-40`}>Ask</button>
              </div>
              {chatError && <p role="alert" className="mt-2 text-sm text-red-400">{chatError}</p>}
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={Boolean(preview)} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className={overlayClass} />
          <Dialog.Content
            aria-describedby={undefined}
            onCloseAutoFocus={restoreDialogFocus}
            className="fixed inset-0 z-[10001] flex flex-col overflow-hidden border border-border bg-background font-inter text-foreground sm:inset-x-4 sm:inset-y-[6vh] sm:mx-auto sm:max-w-5xl sm:rounded-xl"
          >
            <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 border-b border-border px-4 py-2">
              <Dialog.Title className="min-w-0 break-words text-sm font-semibold">{preview?.title}</Dialog.Title>
              <div className="ml-auto flex items-center">
                <a href={preview?.url} target="_blank" rel="noopener noreferrer" className={`${actionClass} text-muted-foreground hover:text-foreground`}>
                  Open in new tab <ArrowUpRight size={16} aria-hidden="true" />
                </a>
                <Dialog.Close aria-label="Close project preview" className={closeClass}><X size={19} aria-hidden="true" /></Dialog.Close>
              </div>
            </header>
            {preview && (
              <div className="relative min-h-0 flex-1 bg-background">
                <iframe title={`Preview of ${preview.title}`} src={preview.url} className="size-full border-0 bg-white" onLoad={() => setIframeLoading(false)} />
                {iframeLoading && <p role="status" className="absolute inset-0 grid place-items-center bg-background text-sm text-muted-foreground">Loading preview…</p>}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
};

function ProjectRow({ project, onAsk, onPreview }: {
  project: PortfolioItem;
  onAsk: (trigger: HTMLButtonElement) => void;
  onPreview: (url: string, trigger: HTMLButtonElement) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const url = projectUrl(project.link) || projectUrl(project.demoUrl);
  const description = project.description?.trim() || "";
  const canExpand = description.length > 170;
  const descriptionText = canExpand && !expanded ? `${description.slice(0, 170).trimEnd()}…` : description;

  return (
    <article className={`grid items-center gap-5 py-6 md:gap-9 md:py-8 ${project.image ? "md:grid-cols-2" : ""}`}>
      {project.image && (
        <img
          src={project.image}
          alt=""
          loading="lazy"
          className="aspect-[16/10] w-full rounded-lg border border-border bg-card object-cover"
        />
      )}
      <div className="min-w-0">
        {project.category && <p className="mb-1.5 text-xs font-medium text-red-500">{project.category}</p>}
        <h2 className="break-words font-poppins text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{project.title}</h2>
        {descriptionText && (
          <div className="mt-3 max-w-prose break-words text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p className="whitespace-pre-line"><SmartText text={descriptionText} /></p>
            {canExpand && (
              <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="mt-2 text-sm text-foreground underline-offset-4 hover:underline">
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}
        <div className="-mx-2 mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
          {url?.startsWith("/") ? (
            <Link to={url} className={`${projectAction} text-foreground hover:bg-secondary`}>
              View project <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ) : url ? (
            <button type="button" onClick={(event) => onPreview(url, event.currentTarget)} className={`${projectAction} text-foreground hover:bg-secondary`}>
              View project <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          ) : null}
          <button type="button" onClick={(event) => onAsk(event.currentTarget)} className={`${projectAction} text-muted-foreground hover:bg-secondary hover:text-foreground`}>
            <MessageCircle size={16} aria-hidden="true" /> Ask about project
          </button>
        </div>
      </div>
    </article>
  );
}

export default Portfolio;
