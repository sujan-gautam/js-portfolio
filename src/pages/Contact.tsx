import { useState, useEffect } from "react";
import { 
  MapPin, Mail, Phone, Facebook, Linkedin, Instagram, Github, Twitter, Youtube, 
  Heart, Send, Loader2, Globe, MessageSquare, PhoneCall, X, CheckCircle2
} from "lucide-react";
import { aboutDB, settingsDB, courtesyDB, contactsDB, AboutData, AdminSettings, CourtesyItem } from "@/lib/adminData";
import { toast } from "sonner";
import { SmartText } from "@/components/ui/SmartText";
import { Skeleton } from "@/components/ui/skeleton";

const IconMap: Record<string, any> = {
  facebook: Facebook,
  linkedin: Linkedin,
  instagram: Instagram,
  github: Github,
  twitter: Twitter,
  youtube: Youtube,
};

const Contact = () => {
  const [about, setAbout] = useState<AboutData | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [courtesy, setCourtesy] = useState<CourtesyItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([
      aboutDB.get(),
      settingsDB.get(),
      courtesyDB.getAll()
    ]).then(([aboutData, settingsData, courtesyData]) => {
      setAbout(aboutData);
      setSettings(settingsData);
      setCourtesy(courtesyData.filter(c => c.active));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const siteName = "Sujan Gautam | Sujan1919";
    const profession = "Software Developer & UI Architect";
    const title = `Contact | ${siteName} | ${profession}`;
    const desc = "Get in touch with Sujan Gautam (sujan1919). Open for collaborations, freelance projects, and professional inquiries in software development and UI/UX design.";
    const keywords = "Sujan Gautam Contact, Sujan1919 Contact, Hire Sujan Gautam, Software Developer Contact, Nepal Developer, Sujan Shrestha";
    const url = "https://sujan1919.com.np/contact/";

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

    // JSON-LD ContactPoint schema
    const contactSchema = {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "mainEntity": {
        "@type": "Person",
        "name": "Sujan Gautam",
        "jobTitle": "Software Developer",
        "url": "https://sujan1919.com.np",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+18179707616",
          "contactType": "professional",
          "email": "sujaan1919@gmail.com",
          "availableLanguage": ["English", "Nepali"]
        }
      }
    };

    let el = document.getElementById("ld-contact");
    if (!el) { el = document.createElement("script"); el.id = "ld-contact"; (el as HTMLScriptElement).type = "application/ld+json"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(contactSchema);

    return () => { document.getElementById("ld-contact")?.remove(); };
  }, []);

  function setMeta(key: string, value: string, isProp = false) {
    if (!value) return;
    const attr = isProp ? "property" : "name";
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute("content", value);
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message || (!formData.email && !formData.phone)) {
       return toast.error("Please provide your details and a message.");
    }

    setSubmitting(true);
    (window as any).reportActivity?.('form_submit_start', 'Contact Form', `Name: ${formData.name || 'Anonymous'}`);
    try {
      await contactsDB.sendEmail(formData);
      setSubmitted(true);
      toast.success("Message sent successfully.");
      (window as any).reportActivity?.('form_submit_success', 'Contact Form Submitted', `Name: ${formData.name}, Email: ${formData.email}`);
      setFormData({ name: "", email: "", phone: "", message: "" });
      setTimeout(() => {
        setSubmitted(false);
        setIsModalOpen(false);
      }, 3000);
    } catch (error: any) {
       toast.error(error.message || "Failed to send message. Please try again.");
       (window as any).reportActivity?.('form_submit_error', 'Contact Form Failed', `Error: ${error.message || 'Unknown error'}`);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center max-w-7xl mx-auto px-6 md:px-10 w-full space-y-16">
        <Skeleton className="h-20 w-3/4 mx-auto opacity-20" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-6">
            <Skeleton className="h-8 w-32 opacity-20" />
            <Skeleton className="h-20 w-full opacity-10" />
            <div className="flex gap-4">
              {[1,2,3].map(i => <Skeleton key={i} className="w-10 h-10 rounded-full opacity-10" />)}
            </div>
          </div>
          <div className="space-y-10">
            <Skeleton className="h-8 w-32 opacity-20" />
            <div className="space-y-6">
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-8 h-8 rounded opacity-10" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-16 opacity-10" />
                    <Skeleton className="h-4 w-full opacity-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
             <Skeleton className="h-8 w-32 opacity-20" />
             <Skeleton className="h-16 w-full opacity-10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] text-white selection:bg-red-500/30 font-poppins flex flex-col justify-center pt-8 pb-32">
      
      {/* Dynamic Contact Page Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 w-full animate-in fade-in duration-1000">
        
        {/* Main Header */}
        <div className="text-center mb-6 md:mb-16">
          <h1 className="text-[36px] md:text-[75px] font-black uppercase tracking-tighter leading-none">
            <span className="sr-only">Sujan Gautam | </span>CONTACT <span className="text-[#CB2729]">Me</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-16 mb-8 md:mb-16 items-start">
          
          {/* Column 1: Get in Touch */}
          <div>
            <h2 className="text-[20px] font-black uppercase mb-8 tracking-tight">GET IN TOUCH</h2>
            <p className="text-white/60 text-[13px] leading-relaxed mb-8 max-w-[280px] font-medium tracking-wide">
              You Can Contact Us Via Email, Calls Or Through Social Medias. ✨
            </p>
            <div className="flex gap-4">
              {settings?.socialLinks?.map((link, i) => {
                const Icon = IconMap[link.platform.toLowerCase()] || Globe;
                return (
                  <a 
                    key={i} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-[#CB2729] transition-all bg-white/[0.02]"
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Contact Info */}
          <div className="space-y-10">
            <h2 className="text-[20px] font-black uppercase mb-8 tracking-tight">CONTACT ME</h2>
            <div className="space-y-8">
               <ContactItem label="ADDRESS :" value={about?.address || "604 N 31st Ave"} icon={<MapPin size={20} className="text-red-500" />} />
               <ContactItem label="EMAIL :" value={about?.email || "sujaan1919@gmail.com"} icon={<Mail size={20} className="text-red-500" />} />
               <ContactItem label="NUMBER :" value={about?.phone || "+18179707616"} icon={<Phone size={20} className="text-red-500" />} />
            </div>
          </div>

          {/* Column 3: Courtesy */}
          <div className="flex flex-col">
            <h2 className="text-[20px] font-black uppercase mb-8 tracking-tight">COURTESY</h2>
            <div>
               <div className="text-white/60 text-[13px] leading-relaxed font-medium tracking-wide opacity-80 mb-6">
                 <SmartText text={settings?.courtesyDescription || "Thanks To Shreya And Swostika, And Special Thanks To Sujit, For Their Help Throughout The Journey. ❤️"} />
               </div>
            </div>
            
            {/* Heart links to social handles */}
            <div className="flex flex-wrap gap-4 mt-2">
               {courtesy.some(c => c.socialLinks && c.socialLinks.length > 0) ? (
                 courtesy.flatMap(c => (c.socialLinks || []).map((sl, idx) => (
                   <a 
                     key={`${c.id}-${idx}`} 
                     href={sl.url} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/20 bg-white/[0.03] hover:text-[#CB2729] hover:border-[#CB2729]/30 transition-all hover:scale-110 group relative"
                   >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
                         <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CB2729]">{c.name}</p>
                         <p className="text-[7px] font-medium uppercase tracking-[0.1em] text-white/40 text-center">{sl.platform}</p>
                      </div>
                      <Heart size={16} className="transition-all group-hover:fill-[#CB2729]/20" />
                   </a>
                 )))
               ) : (
                 [1, 2, 3].map(i => (
                   <div key={i} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/20 bg-white/[0.02]">
                      <Heart size={16} className="opacity-40" />
                   </div>
                 ))
               )}
            </div>
          </div>

        </div>
      </div>

      {/* Persistent CTA Bar - Matches About/Portfolio design */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] w-[90%] md:w-auto">
         <div className="relative group cursor-pointer" onClick={() => { setIsModalOpen(true); (window as any).reportActivity?.('modal_open', 'Contact Modal', 'Clicked: Want to collab or hire me?'); }}>
            <button 
               className="relative flex items-center gap-4 px-8 md:px-10 py-3 md:py-3.5 rounded-full border border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl hover:bg-[#111] transition-all duration-300 shadow-xl"
            >
               <div className="w-1.5 h-1.5 rounded-full bg-[#CB2729] animate-pulse" />
               <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white transition-colors whitespace-nowrap font-inter">
                 Want to collab or hire me?
               </span>
            </button>
         </div>
      </div>



      {/* Clean & Professional Contact Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300 backdrop-blur-sm bg-black/40">
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
            
            <div className="relative w-full max-w-[400px] bg-[#0A0A0A] border border-white/5 rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
               <div className="p-6 sm:p-8">
                 <div className="flex justify-between items-start mb-8">
                    <div>
                       <h2 className="text-xl font-bold text-white tracking-tight font-inter">Contact</h2>
                       <p className="text-white/20 text-[11px] font-medium font-inter mt-0.5">Let's talk about your next project.</p>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(false)} 
                      className="p-1 text-white/20 hover:text-white transition-all"
                      disabled={submitting}
                    >
                      <X size={20} />
                    </button>
                 </div>

                 {submitted ? (
                    <div className="text-center py-8 space-y-3 animate-in fade-in duration-500">
                       <CheckCircle2 size={48} className="mx-auto text-[#CB2729]" />
                       <h3 className="text-base font-bold text-white">Message Sent</h3>
                       <p className="text-white/40 text-xs">I'll get back to you shortly.</p>
                    </div>
                 ) : (
                   <form onSubmit={handleSendEmail} className="space-y-5 font-inter">
                      <div className="space-y-1.5">
                         <label className="text-[11px] font-medium text-white/30 ml-1">Full Name</label>
                         <input 
                           type="text" 
                           required
                           value={formData.name}
                           onChange={e => setFormData({...formData, name: e.target.value})}
                           placeholder="Your name"
                           className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/10 focus:outline-none focus:border-[#CB2729]/50 transition-all"
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[11px] font-medium text-white/30 ml-1">Email Address</label>
                         <input 
                           type="email" 
                           required
                           value={formData.email}
                           onChange={e => setFormData({...formData, email: e.target.value})}
                           placeholder="your@email.com"
                           className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/10 focus:outline-none focus:border-[#CB2729]/50 transition-all"
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[11px] font-medium text-white/30 ml-1">Message</label>
                         <textarea 
                           rows={3}
                           required
                           value={formData.message}
                           onChange={e => setFormData({...formData, message: e.target.value})}
                           placeholder="How can I help you?"
                           className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/10 focus:outline-none focus:border-[#CB2729]/50 transition-all resize-none"
                         />
                      </div>

                      <div className="pt-4 flex items-center gap-3">
                         <button 
                           disabled={submitting}
                           className="flex-1 py-3 bg-[#CB2729] text-white font-bold text-[12px] uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                         >
                            {submitting ? <Loader2 className="animate-spin" size={16} /> : <>Send Message</>}
                         </button>
                         
                         <div className="flex gap-2.5">
                            <a 
                              href={`tel:${about?.phone}`}
                              className="w-10 h-10 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center text-white/20 hover:text-[#CB2729] transition-all"
                              title="Call"
                            >
                              <PhoneCall size={16} />
                            </a>
                            <a 
                              href={`https://wa.me/${about?.phone?.replace(/\+/g, '')}`}
                              target="_blank"
                              rel="noopener"
                              className="w-10 h-10 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center text-white/20 hover:text-[#25D366] transition-all"
                              title="WhatsApp"
                            >
                              <MessageSquare size={16} />
                            </a>
                         </div>
                      </div>
                   </form>
                 )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

const ContactItem = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="flex gap-4 items-start group/item">
    <div className="pt-1">{icon}</div>
    <div className="flex flex-col">
      <span className="block text-[12px] font-bold text-white uppercase tracking-[0.2em] font-poppins">{label}</span>
      <span className="block text-[15px] text-white font-light tracking-wide -mt-0.5">{value}</span>
    </div>
  </div>
);

export default Contact;
