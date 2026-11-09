import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Check, CircleAlert, Facebook, Github, Globe, Instagram, Linkedin, Loader2, Mail, MapPin, MessageCircle, MessageSquare, Phone, Send, Twitter, UserRound, Youtube, type LucideIcon } from "lucide-react";
import SEO from "@/components/SEO";
import { SmartText } from "@/components/ui/SmartText";
import { Skeleton } from "@/components/ui/skeleton";
import { aboutDB, contactsDB, courtesyDB, settingsDB, type AboutData, type AdminSettings, type CourtesyItem } from "@/lib/adminData";

const inputClass = "block min-h-11 w-full rounded-md border border-border bg-background py-2.5 pl-10 pr-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm";
const fieldIconClass = "pointer-events-none absolute left-3 top-3.5 text-muted-foreground";
const detailIconClass = "absolute left-0 top-3 grid size-8 place-items-center rounded-md border border-border bg-card text-muted-foreground";
const linkClass = "rounded-sm underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";
const headingClass = "font-poppins text-lg font-semibold tracking-tight sm:text-xl";
const socialNames: Record<string, string> = { github: "GitHub", linkedin: "LinkedIn", youtube: "YouTube", whatsapp: "WhatsApp" };
const socialIcons: Record<string, LucideIcon> = { facebook: Facebook, github: Github, instagram: Instagram, linkedin: Linkedin, twitter: Twitter, youtube: Youtube };
const pageTitle = "Contact | Sujan Gautam";
const pageDescription = "Contact Sujan Gautam about a project or send him a message.";

function socialName(platform: string) {
  const name = platform.trim();
  return socialNames[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1);
}

type FormStatus = "idle" | "sending" | "sent" | "invalid" | "error";

export default function Contact() {
  const [about, setAbout] = useState<Partial<AboutData> | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [courtesy, setCourtesy] = useState<CourtesyItem[]>([]);
  const [status, setStatus] = useState<FormStatus>("idle");
  const sending = useRef(false);

  useEffect(() => {
    let active = true;
    aboutDB.get().then((data) => { if (active) setAbout(data ?? {}); });
    settingsDB.get().then((data) => { if (active) setSettings(data); });
    courtesyDB.getAll().then((items) => {
      if (active && Array.isArray(items)) setCourtesy(items.filter((entry) => entry.active));
    });
    return () => { active = false; };
  }, []);

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const name = String(fields.get("name") ?? "").trim();
    const email = String(fields.get("email") ?? "").trim();
    const message = String(fields.get("message") ?? "").trim();

    if (!name || !email || !message) {
      setStatus("invalid");
      const field = !name ? "name" : !email ? "email" : "message";
      form.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
      return;
    }

    sending.current = true;
    setStatus("sending");
    const analytics = window as Window & { reportActivity?: (type: string, target: string) => void };
    analytics.reportActivity?.("form_submit_start", "Contact Form");
    try {
      await contactsDB.sendEmail({ name, email, message });
      form.reset();
      setStatus("sent");
      analytics.reportActivity?.("form_submit_success", "Contact Form Submitted");
    } catch {
      setStatus("error");
      analytics.reportActivity?.("form_submit_error", "Contact Form Failed");
    } finally {
      sending.current = false;
    }
  };

  const email = about?.email?.trim();
  const phone = about?.phone?.trim();
  const phoneDigits = phone?.replace(/\D/g, "");
  const dial = phoneDigits ? (phone.startsWith("+") ? "+" : "") + phoneDigits : undefined;
  const location = about?.address?.trim();
  const socials = (settings?.socialLinks ?? [])
    .map(({ platform, url }) => ({ platform: platform?.trim(), url: url?.trim() }))
    .filter(({ platform, url }) => platform && /^https?:\/\//i.test(url));
  const thanks = settings?.courtesyDescription?.trim();
  const courtesyLinks = courtesy.flatMap((entry) => (entry.socialLinks ?? [])
    .map(({ platform, url }) => ({ platform, url: url?.trim(), name: entry.name, id: entry.id }))
    .filter(({ name, url }) => name?.trim() && /^https?:\/\//i.test(url)));

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        url="https://sujan1919.com.np/contact/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          mainEntity: {
            "@type": "Person",
            name: about?.name || "Sujan Gautam",
            jobTitle: about?.title || "Software Developer",
            url: "https://sujan1919.com.np",
            ...(email || dial ? { contactPoint: { "@type": "ContactPoint", contactType: "professional", email, telephone: dial } } : {}),
          },
        }}
      />
      <main className="mx-auto min-h-screen max-w-[56rem] px-5 pb-28 pt-9 font-inter text-foreground sm:px-8 sm:pt-14">
        <header className="border-b border-border pb-5 sm:pb-6">
          <h1 className="font-poppins text-[clamp(1.75rem,5vw,2.75rem)] font-semibold leading-tight tracking-tight">Contact</h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">Have a project in mind or a question? Send me a message or reach me directly.</p>
        </header>

        <div className="mt-6 grid items-start gap-8 sm:mt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] md:gap-9">
          <section aria-labelledby="contact-form" data-section="Contact form" className="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-6">
            <h2 id="contact-form" className={headingClass}>Send a message</h2>
            <p id="contact-form-note" className="mt-1 text-sm leading-relaxed text-muted-foreground">Leave an email so I can reply.</p>
            <form aria-describedby="contact-form-note" onSubmit={send} onInput={() => { if (!sending.current) setStatus("idle"); }} className="mt-5">
              <fieldset disabled={status === "sending"} className="grid gap-4 disabled:opacity-65">
                <legend className="sr-only">Your message and contact information</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block min-w-0 space-y-1.5 text-sm font-medium">
                    <span>Name</span>
                    <span className="relative block">
                      <UserRound size={16} className={fieldIconClass} aria-hidden="true" />
                      <input className={inputClass} name="name" autoComplete="name" required />
                    </span>
                  </label>
                  <label className="block min-w-0 space-y-1.5 text-sm font-medium">
                    <span>Email</span>
                    <span className="relative block">
                      <Mail size={16} className={fieldIconClass} aria-hidden="true" />
                      <input className={inputClass} type="email" name="email" autoComplete="email" required />
                    </span>
                  </label>
                </div>
                <label className="block space-y-1.5 text-sm font-medium">
                  <span>Message</span>
                  <span className="relative block">
                    <MessageSquare size={16} className={fieldIconClass} aria-hidden="true" />
                    <textarea className={`${inputClass} min-h-32 resize-y`} name="message" rows={5} placeholder="What would you like to discuss?" required />
                  </span>
                </label>
              </fieldset>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border pt-4">
                <button type="submit" disabled={status === "sending"} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60 sm:w-auto">
                  {status === "sending" ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Sending…</> : <><Send size={15} aria-hidden="true" /> Send message</>}
                </button>
                <span role="status" className={status === "sent" ? "text-sm text-muted-foreground" : "sr-only"}>
                  {status === "sending" && "Sending your message."}
                  {status === "sent" && <span className="inline-flex items-center gap-1.5"><Check size={15} aria-hidden="true" /> Message sent.</span>}
                </span>
              </div>
              {(status === "invalid" || status === "error") && (
                <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-red-400">
                  <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {status === "invalid" ? "Enter your name, email, and a message." : "Couldn’t send your message. Please try again."}
                </p>
              )}
            </form>
          </section>

          <aside aria-labelledby="contact-direct" className="min-w-0 border-t border-border pt-5 md:border-t-0 md:pt-6">
            <h2 id="contact-direct" className={headingClass}>Direct contact</h2>
            {about === null ? (
              <div aria-busy="true" aria-label="Loading contact details" className="mt-4 space-y-3">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-4 w-32 max-w-full" />
              </div>
            ) : (email || dial || location) && (
              <dl className="mt-2 divide-y divide-border border-b border-border text-sm">
                {email && (
                  <div className="relative py-3 pl-10">
                    <dt className="mb-1 text-xs text-muted-foreground"><span className={detailIconClass} aria-hidden="true"><Mail size={16} /></span>Email</dt>
                    <dd className="break-words"><a href={`mailto:${email}`} className={linkClass}>{email}</a></dd>
                  </div>
                )}
                {dial && (
                  <div className="relative py-3 pl-10">
                    <dt className="mb-1 text-xs text-muted-foreground"><span className={detailIconClass} aria-hidden="true"><Phone size={16} /></span>Phone</dt>
                    <dd className="break-words"><a href={`tel:${dial}`} className={linkClass}>{phone}</a></dd>
                    <dd className="mt-1.5">
                      <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer" className={`${linkClass} inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground`}>
                        <MessageCircle size={13} aria-hidden="true" /> WhatsApp <ArrowUpRight size={12} aria-hidden="true" />
                      </a>
                    </dd>
                  </div>
                )}
                {location && (
                  <div className="relative py-3 pl-10">
                    <dt className="mb-1 text-xs text-muted-foreground"><span className={detailIconClass} aria-hidden="true"><MapPin size={16} /></span>Location</dt>
                    <dd className="break-words">{location}</dd>
                  </div>
                )}
              </dl>
            )}
            {socials.length > 0 && (
              <ul aria-label="Social profiles" className="mt-4 flex flex-wrap gap-2">
                {socials.map(({ platform, url }) => {
                  const Icon = socialIcons[platform.toLowerCase()] ?? Globe;
                  const name = socialName(platform);
                  return (
                    <li key={`${platform}:${url}`}>
                      <a href={url} target="_blank" rel="noopener noreferrer" aria-label={name} title={name} className={`${linkClass} grid size-11 place-items-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground`}>
                        <Icon size={18} aria-hidden="true" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>

        {(thanks || courtesyLinks.length > 0) && (
          <section aria-labelledby="contact-credits" className="mt-8 border-t border-border pt-4 sm:mt-10">
            <h2 id="contact-credits" className="text-sm font-medium">Acknowledgments</h2>
            {thanks && <p className="mt-2 max-w-prose whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground [&_a]:text-red-400 [&_a]:underline"><SmartText text={thanks} /></p>}
            {courtesyLinks.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {courtesyLinks.map(({ id, name, platform, url }) => (
                  <li key={`${id}:${platform}:${url}`}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className={`${linkClass} inline-flex min-h-9 items-center gap-1 text-sm text-muted-foreground hover:text-foreground`}>
                      {name}<span className="sr-only"> on {socialName(platform)}</span> <ArrowUpRight size={12} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </>
  );
}
