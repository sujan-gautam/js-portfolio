import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, Download, FileText, MessageCircle, X } from "lucide-react";
import axios from "axios";
import { aboutDB, educationDB, skillsDB, slidersDB, type AboutData, type EducationItem, type SkillItem } from "@/lib/adminData";
import { API_BASE } from "@/config";
import { Skeleton } from "@/components/ui/skeleton";
import profileFallback from "@/assets/profile-3.jpg";

type Profile = Partial<AboutData> & {
  age?: string;
  description?: string;
  freelanceStatus?: string;
  language?: string;
  yearsOfExperience?: string;
  happyClients?: string;
  projectCompleted?: string;
  awardsWon?: string;
  cvUrl?: string;
};

const actionClass = "inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";
const overlayClass = "fixed inset-0 z-[10000] bg-black/70";
const closeClass = "grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground";
const sectionHeading = "font-poppins text-xl font-semibold tracking-tight sm:text-2xl";
const questions = ["What kind of work do you do?", "What tools do you use?", "Where did you study?"];

function lastYear(year: string) {
  const years = String(year ?? "").match(/\b\d{4}\b/g) ?? [];
  return Number(years[years.length - 1] ?? 0);
}

export default function About() {
  const [profile, setProfile] = useState<Profile>({});
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [portrait, setPortrait] = useState(profileFallback);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [questionError, setQuestionError] = useState("");
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([aboutDB.get(), skillsDB.getAll(), educationDB.getAll(), slidersDB.getAll()]).then(
      ([about, skillList, educationList, sliders]) => {
        if (!active) return;
        setProfile(about ?? {});
        if (Array.isArray(skillList)) setSkills(skillList);
        if (Array.isArray(educationList)) setEducation([...educationList].sort((a, b) => lastYear(b.year) - lastYear(a.year)));
        const image = Array.isArray(sliders)
          ? sliders.filter((slide) => slide.active && slide.image).sort((a, b) => a.order - b.order)[0]?.image
          : undefined;
        if (image) setPortrait(image);
      },
    ).finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      request.current?.abort();
    };
  }, []);

  useEffect(() => {
    const siteName = "Sujan Gautam | Sujan1919";
    const title = `About | ${siteName}`;
    const desc = "About Sujan Gautam, including his background, skills, education, and CV.";
    const keywords = "Sujan Gautam, Sujan1919, Sujan, Software Developer, About, Portfolio, Web Developer, UI Architect, Nepal Developer";
    const url = "https://www.sujan1919.com.np/about/";

    document.title = title;
    setMeta("description", desc);
    setMeta("keywords", keywords);
    setMeta("author", "Sujan Gautam");
    setMeta("og:title", title, true);
    setMeta("og:description", desc, true);
    setMeta("og:url", url, true);
    setMeta("og:type", "profile", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", desc);

    // Canonical
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = url;

    // JSON-LD Person schema
    const personSchema = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Sujan Gautam",
      "alternateName": "sujan-gautam",
      "url": "https://sujan1919.com.np",
      "image": "https://sujan1919.com.np/assets/logo.png",
      "description": desc,
      "jobTitle": "Software Developer",
      "knowsAbout": ["React", "Node.js", "TypeScript", "UI/UX Design", "Web Development"],
      "sameAs": [
        "https://github.com/sujan-gautam",
        "https://www.linkedin.com/in/sujan-gautam-109524275/",
        "https://instagram.com/sujaan.gautam"
      ]
    };

    let el = document.getElementById("ld-about");
    if (!el) { el = document.createElement("script"); el.id = "ld-about"; (el as HTMLScriptElement).type = "application/ld+json"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(personSchema);

    return () => { document.getElementById("ld-about")?.remove(); };
  }, []);

  function setMeta(key: string, value: string, isProp = false) {
    if (!value) return;
    const attr = isProp ? "property" : "name";
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute("content", value);
  }

  const name = profile.name || "Sujan Gautam";
  const bio = profile.bio || profile.description;
  const details = [
    { label: "Location", value: profile.address },
    { label: "Languages", value: profile.languages || profile.language },
    { label: "Email", value: profile.email, href: profile.email && `mailto:${profile.email}` },
    { label: "Phone", value: profile.phone, href: profile.phone && `tel:${profile.phone.replace(/[^+0-9]/g, "")}` },
    { label: "Freelance", value: profile.freelanceStatus },
    { label: profile.age ? "Age" : "Date of birth", value: profile.age || profile.dob },
  ].filter(({ value }) => Boolean(value));
  const stats = [
    { label: "Years of experience", value: profile.yearsOfExperience || profile.experience },
    { label: "Clients", value: profile.happyClients || profile.clients },
    { label: "Completed projects", value: profile.projectCompleted || profile.projects },
    { label: "Awards", value: profile.awardsWon },
  ].filter(({ value }) => Boolean(value));

  const clearQuestion = () => {
    request.current?.abort();
    request.current = null;
    setQuestion("");
    setAnswer("");
    setAsking(false);
    setQuestionError("");
  };

  const ask = async (text: string) => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setQuestion(text);
    setAnswer("");
    setQuestionError("");
    setAsking(true);

    const prompt = `Answer the question about ${name} in one or two sentences using only the facts below. Say if a detail is unavailable.
Role: ${profile.title || ""}
Bio: ${bio || ""}
Skills: ${skills.map((skill) => skill.name).join(", ")}
Education: ${education.map((entry) => [entry.degree, entry.institution, entry.year].filter(Boolean).join(", ")).join("; ")}
Question: ${text}`;

    try {
      const { data } = await axios.post(`${API_BASE}/ai/ask`, { prompt }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (typeof data.answer !== "string" || !data.answer.trim()) throw new Error("Empty answer");
      setAnswer(data.answer);
    } catch {
      if (!controller.signal.aborted) setQuestionError("Couldn’t load an answer. Try again.");
    } finally {
      if (request.current === controller) {
        request.current = null;
        setAsking(false);
      }
    }
  };

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-5 pb-28 pt-8 sm:px-8 sm:pt-14" aria-busy="true">
        <p className="sr-only" role="status">Loading profile</p>
        <div aria-hidden="true" className="space-y-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-12 w-56 max-w-full" />
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-3/4 max-w-lg" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 pb-28 pt-8 font-inter text-foreground sm:px-8 sm:pt-14">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-4 pb-7 sm:gap-x-10 sm:pb-9">
        <div className="self-center sm:self-start">
          <p className="mb-2 text-sm font-medium text-red-500">About</p>
          <h1 className="break-words font-poppins text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">{name}</h1>
          {profile.title && <p className="mt-2 break-words text-sm text-muted-foreground sm:text-base">{profile.title}</p>}
        </div>
        <img
          src={portrait}
          alt={name}
          className="size-20 rounded-lg border border-border bg-card object-cover sm:row-span-2 sm:size-44 md:size-52"
          onError={() => { if (portrait !== profileFallback) setPortrait(profileFallback); }}
        />
        <div className="col-span-2 min-w-0 sm:col-span-1">
          {bio && <p className="max-w-prose whitespace-pre-line break-words text-base leading-relaxed text-foreground/85 sm:text-lg">{bio}</p>}
          {(profile.cvUrl || bio) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.cvUrl && (
                <Dialog.Root>
                  <Dialog.Trigger className={`${actionClass} border border-border bg-card text-foreground hover:bg-secondary`}>
                    <FileText size={16} aria-hidden="true" /> View CV
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className={overlayClass} />
                    <Dialog.Content aria-describedby={undefined} className="fixed inset-0 z-[10001] flex flex-col overflow-hidden border border-border bg-background font-inter text-foreground sm:inset-x-4 sm:inset-y-[5vh] sm:mx-auto sm:max-w-5xl sm:rounded-xl">
                      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2">
                        <Dialog.Title className="font-semibold">CV</Dialog.Title>
                        <div className="flex items-center gap-1">
                          <a href={profile.cvUrl} target="_blank" rel="noopener noreferrer" className={`${actionClass} text-muted-foreground hover:text-foreground`}>
                            Open PDF <ArrowUpRight size={16} aria-hidden="true" />
                          </a>
                          <a href={profile.cvUrl} download target="_blank" rel="noopener noreferrer" aria-label="Download CV" className={closeClass}>
                            <Download size={17} aria-hidden="true" />
                          </a>
                          <Dialog.Close aria-label="Close CV" className={closeClass}><X size={19} aria-hidden="true" /></Dialog.Close>
                        </div>
                      </header>
                      <iframe title="CV preview" src={profile.cvUrl} className="min-h-0 w-full flex-1 border-0 bg-card" />
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              )}
              {bio && (
                <Dialog.Root onOpenChange={(open) => { if (!open) clearQuestion(); }}>
                  <Dialog.Trigger className={`${actionClass} text-muted-foreground hover:bg-secondary hover:text-foreground`}>
                    <MessageCircle size={16} aria-hidden="true" /> Ask about my background
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className={overlayClass} />
                    <Dialog.Content aria-describedby={undefined} className="fixed inset-x-0 bottom-0 z-[10001] mx-auto flex max-h-[85dvh] max-w-md flex-col rounded-t-xl border border-border bg-background font-inter text-foreground sm:inset-x-4 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-xl">
                      <header className="flex items-center justify-between gap-4 px-4 pt-2 sm:px-5">
                        <Dialog.Title className="font-poppins text-base font-semibold">{name}</Dialog.Title>
                        <Dialog.Close aria-label="Close background questions" className={closeClass}><X size={18} aria-hidden="true" /></Dialog.Close>
                      </header>
                      <div className="min-h-0 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:px-5">
                        <ul className="divide-y divide-border">
                          {questions.map((suggestion) => (
                            <li key={suggestion}>
                              <button type="button" onClick={() => void ask(suggestion)} disabled={asking} className="min-h-11 w-full text-left text-sm text-muted-foreground hover:text-foreground disabled:opacity-50">
                                {suggestion}
                              </button>
                            </li>
                          ))}
                        </ul>
                        {question && (
                          <div aria-live="polite" className="mt-3 space-y-2 border-t border-border pt-4 text-sm leading-relaxed">
                            <p className="font-medium">{question}</p>
                            {asking ? <p role="status" className="text-muted-foreground">Loading answer…</p> : questionError
                              ? <p role="alert" className="text-red-400">{questionError}</p>
                              : <p className="whitespace-pre-wrap break-words text-muted-foreground">{answer}</p>}
                          </div>
                        )}
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              )}
            </div>
          )}
        </div>
      </header>

      {stats.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 border-y border-border py-5 sm:grid-cols-4">
          {stats.map(({ label, value }) => (
            <div key={label} className="flex min-w-0 flex-col-reverse gap-1">
              <dt className="text-xs text-muted-foreground sm:text-sm">{label}</dt>
              <dd className="break-words font-poppins text-2xl font-semibold tracking-tight sm:text-3xl">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {details.length > 0 && (
        <section aria-labelledby="about-details" data-section="About details" className="mt-8">
          <h2 id="about-details" className={sectionHeading}>Details</h2>
          <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
            {details.map(({ label, value, href }) => (
              <div key={label} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 border-b border-border py-3 text-sm">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="break-words">
                  {href ? <a href={href} className="underline-offset-4 hover:underline">{value}</a> : value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {skills.length > 0 && (
        <section aria-labelledby="about-skills" data-section="Skills" className="mt-8">
          <h2 id="about-skills" className={sectionHeading}>Skills</h2>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {skills.map((skill) => (
              <li key={skill.id} className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-sm">
                {skill.image && <img src={skill.image} alt="" loading="lazy" className="size-5 shrink-0 object-contain" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
                <span className="break-words">{skill.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {education.length > 0 && (
        <section aria-labelledby="about-education" data-section="Education" className="mt-8">
          <h2 id="about-education" className={sectionHeading}>Education</h2>
          <ol className="mt-3 divide-y divide-border border-y border-border">
            {education.map((entry) => (
              <li key={entry.id} className="grid gap-2 py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-5">
                {entry.year && <p className="text-sm font-medium text-muted-foreground sm:pt-1">{entry.year}</p>}
                <div className="flex min-w-0 items-start gap-3">
                  {entry.image && <img src={entry.image} alt="" loading="lazy" className="size-10 shrink-0 rounded-md bg-white p-1 object-contain" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
                  <div className="min-w-0 break-words">
                    <h3 className="font-semibold">{entry.institution}</h3>
                    {entry.degree && <p className="mt-0.5 text-sm">{entry.degree}</p>}
                    {entry.gpa && <p className="mt-1 text-xs text-muted-foreground">GPA {entry.gpa}</p>}
                    {entry.description && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{entry.description}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
