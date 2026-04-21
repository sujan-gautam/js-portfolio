import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { portfolioDB, PortfolioItem, aboutDB, AboutData } from "@/lib/adminData";
import { API_BASE } from "@/config";
import { ExternalLink, Globe, X, ShieldCheck, Terminal, Pin, Maximize2, Sparkles, Send, Bot } from "lucide-react";
import { SmartText } from "@/components/ui/SmartText";
import { Skeleton } from "@/components/ui/skeleton";

const Portfolio = () => {
  const [projects, setProjects] = useState<PortfolioItem[]>([]);
  const [about, setAbout] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  // AI States
  const [bubble, setBubble] = useState<{ text: string; options: string[] } | null>(null);
  const [aiAnswer, setAiAnswer] = useState<{ text: string; typing: boolean } | null>(null);
  const [followUpQ, setFollowUpQ] = useState("");
  const [chatHistory, setChatHistory] = useState<{ q: string; a: string }[]>([]);
  const chatEndRef = useRef<any>(null);
  const activeProjectRef = useRef<PortfolioItem | null>(null);
  const hoverTimer = useRef<any>(null);

  // Preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(true);

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    Promise.all([portfolioDB.getAll(), aboutDB.get()]).then(([pData, aData]) => {
      setProjects(pData.filter(item => item.status !== false));
      setAbout(aData);
      setLoading(false);
    });
  }, []);

  // Handle global dismissal (scroll or click outside)
  useEffect(() => {
    const dismiss = (e: any) => {
      if (!bubble) return;
      if (e.type === 'click' && e.target.closest('.group\\/bubble')) return;
      setBubble(null);
    };

    if (bubble) {
      window.addEventListener("scroll", dismiss, true);
      window.addEventListener("click", dismiss, true);
    }
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("click", dismiss, true);
    };
  }, [bubble]);


  const categories = ["All", ...new Set(projects.map(p => p.category))].filter(Boolean);
  const filteredProjects = filter === "All" ? projects : projects.filter(p => p.category === filter);

  const openAIPanel = (project: PortfolioItem) => {
    activeProjectRef.current = project;
    setChatHistory([]);
    setAiAnswer(null);
    setBubble({
      text: project.title,
      options: [
        `What tech does ${project.title} use?`,
        `What problem does ${project.title} solve?`,
        `Tell me about ${project.title}.`
      ]
    });
  };

  const askAI = async (question: string) => {
    const project = activeProjectRef.current;
    if (!project) return;
    setChatHistory(prev => [...prev, { q: question, a: "..." }]);
    setAiAnswer({ text: "", typing: true });
    setBubble(null);

    const prompt = `You are Sujan Gautam, talking to a visitor about your portfolio project.
PROJECT DETAILS:
- Title: ${project.title}
- Description: ${project.description}
- Category: ${project.category}
- Demo Link: ${project.demoUrl || "Not available"}
- My Background: ${about?.bio || "Full-stack developer."}

QUESTION: "${question}"

INSTRUCTIONS: 
1. If the question is NOT about this specific project, politely redirect by saying "I can only chat about ${project.title} right now!"
2. Speak exactly like a friendly, humble human being. Do NOT sound like an AI robot.
3. Keep it extremely simple, clear, and easy to understand. Avoid technical jargon unless asked.
4. Use a casual, conversational tone (e.g., "I built this to...", "It was a fun challenge").
5. Keep the response very short (1 to 2 sentences maximum).`;

    try {
      const res = await axios.post(`${API_BASE}/ai/ask`, { prompt });
      txt = res.data.answer || txt;
    } catch (err: any) {
      console.error("Internal AI Proxy Error:", err);
      txt = "My mind is a bit foggy... but I loved building this project!";
    }

    setChatHistory(prev => { const u = [...prev]; u[u.length - 1] = { q: question, a: txt }; return u; });
    setAiAnswer({ text: txt, typing: false });
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const openPreview = (url: string) => {
    let u = url || "";
    if (u && !u.startsWith("http")) u = `https://${u}`;
    setPreviewUrl(u);
    setIframeLoading(true);
  };

  return (
    <div className="min-h-screen text-white pb-40 selection:bg-red-500/30 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Gochi+Hand&family=Fira+Code&display=swap');
        .font-hand { font-family: 'Gochi Hand', cursive; }
      `}</style>

      {/* ── Header ─────────────────────────────────── */}
      <div className="pt-20 pb-8 text-center relative">
        <div className="relative h-24 mb-6">
          <span className="absolute inset-0 flex items-center justify-center text-[14vw] font-black opacity-[0.03] uppercase tracking-tighter select-none pointer-events-none">
            PORTFOLIO
          </span>
          <h2 className="absolute inset-0 flex items-center justify-center text-4xl md:text-6xl font-black uppercase tracking-[0.15em]">
            MY <span className="text-[#CB2729] ml-4">WORK</span>
          </h2>
        </div>
        <div className="w-12 h-[3px] bg-[#CB2729] mx-auto rounded-full mb-10 shadow-[0_0_20px_#CB2729]" />

        {/* Filter pills — only shown when there are multiple categories */}
        {categories.length > 2 && (
        <div className="inline-flex bg-white/[0.03] border border-white/[0.06] p-1.5 rounded-full gap-1">
          {categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] transition-all ${
                filter === cat ? "bg-[#CB2729] text-white shadow-[0_0_12px_rgba(203,39,41,0.4)]" : "text-white/40 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        )}
      </div>

      {/* ── Bento Grid ─────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <Skeleton className="h-64 w-full rounded-2xl opacity-10" />
                <div className="space-y-2 px-2">
                  <Skeleton className="h-4 w-2/3 opacity-20" />
                  <Skeleton className="h-3 w-full opacity-10" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-40 text-center">
            <Globe size={48} className="mx-auto text-white/10 mb-4" />
            <p className="text-white/30 uppercase tracking-[0.3em] text-sm">No projects found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project, idx) => {
              // Last project gets wide span if odd total
              const isWide = idx === filteredProjects.length - 1 && filteredProjects.length % 3 !== 0 && filteredProjects.length > 2;
              return (
                <Reveal key={project.id} delay={idx * 80}>
                  <div className={isWide ? "lg:col-span-3" : ""}>
                    <Card
                      project={project}
                      index={idx}
                      isWide={isWide}
                      onView={openPreview}
                      onAsk={() => openAIPanel(project)}
                    />
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Whisper Bar ────────────────────────────── */}
      <div className="hidden md:flex fixed bottom-20 left-1/2 -translate-x-1/2 z-[1000] px-6 py-2.5 bg-[#111]/90 backdrop-blur-xl border border-white/[0.06] rounded-full items-center gap-3 shadow-xl">
        <div className="w-1.5 h-1.5 bg-[#CB2729] rounded-full animate-pulse" />
        <span className="text-[11px] text-white/30 uppercase tracking-[0.2em] whitespace-nowrap">
          Hover 3s or double-click to probe AI
        </span>
      </div>

      {/* ── AI Suggestion Bubble ────────────────────── */}
      {bubble && (
        <div className="fixed inset-0 z-[10001] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setBubble(null)} />
          <div className="relative w-auto max-w-[85vw] md:max-w-sm bg-[#050505] border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 group/bubble">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#CB2729]/20 flex items-center justify-center">
                  <Bot size={12} className="text-[#CB2729]" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-white mb-0.5">{bubble.text}</p>
                  <p className="text-[9px] text-white/20 uppercase tracking-widest">AI Insight</p>
                </div>
              </div>
              <button onClick={() => setBubble(null)} className="text-white/20 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="p-2 space-y-1">
              {bubble.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => askAI(opt)}
                  className="w-full text-left px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/[0.03] text-[12px] text-white/40 hover:text-white transition-all flex items-center justify-between group"
                >
                  <span>{opt}</span>
                  <Send size={10} className="text-white/10 group-hover:text-[#CB2729] transition-colors ml-2 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── AI Chat Drawer ──────────────────────────── */}
      {(aiAnswer !== null || chatHistory.length > 0) && (
        <div className="fixed inset-0 z-[10002] flex justify-end items-end md:items-stretch">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setAiAnswer(null); setChatHistory([]); }} />
          <div className="relative w-full md:max-w-sm bg-[#0f0f0f] md:border-l border-t md:border-t-0 border-white/[0.07] flex flex-col h-[85vh] md:h-full md:rounded-none rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-right duration-500">
            {/* Header */}
            <div className="shrink-0">
              {activeProjectRef.current?.image && (
                <div className="h-24 overflow-hidden relative">
                  <img src={activeProjectRef.current.image} className="w-full h-full object-cover opacity-30" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f0f0f]" />
                </div>
              )}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-[#CB2729]/20 flex items-center justify-center">
                    <Bot size={14} className="text-[#CB2729]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white">{activeProjectRef.current?.title}</p>
                    <p className="text-[9px] text-[#CB2729]/60 uppercase tracking-widest">Shree ai</p>
                  </div>
                </div>
                <button onClick={() => { setAiAnswer(null); setChatHistory([]); }} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#CB2729] transition-all group">
                  <X size={14} className="text-white/40 group-hover:text-white" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {chatHistory.length === 0 && (
                <div className="flex gap-2.5 items-start">
                  <div className="w-6 h-6 rounded-full bg-[#CB2729]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={12} className="text-[#CB2729] animate-pulse" />
                  </div>
                  <div className="bg-white/[0.04] rounded-2xl rounded-tl-none px-4 py-3">
                    <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: `${i*120}ms` }} />)}</div>
                  </div>
                </div>
              )}
              {chatHistory.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-end">
                    <div className="bg-[#CB2729]/15 border border-[#CB2729]/20 rounded-2xl rounded-br-none px-4 py-2.5 max-w-[82%]">
                      <p className="text-[12px] text-white/90 leading-relaxed">{item.q}</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <div className="w-6 h-6 rounded-full bg-[#CB2729]/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={12} className="text-[#CB2729]" />
                    </div>
                    <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-none px-4 py-2.5 max-w-[82%]">
                      {item.a === "..." ? (
                        <div className="flex gap-1.5">{[0,1,2].map(j => <div key={j} className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: `${j*120}ms` }} />)}</div>
                      ) : (
                        <p className="text-[12px] text-white/70 leading-relaxed">{item.a}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 px-4 py-4 border-t border-white/[0.06]">
              <form
                onSubmit={e => { e.preventDefault(); if (followUpQ.trim()) { askAI(followUpQ.trim()); setFollowUpQ(""); } }}
                className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] focus-within:border-[#CB2729]/40 rounded-2xl px-4 py-2.5 transition-all"
              >
                <input
                  autoFocus
                  type="text"
                  value={followUpQ}
                  onChange={e => setFollowUpQ(e.target.value)}
                  placeholder={`Ask about ${activeProjectRef.current?.title}...`}
                  className="flex-1 bg-transparent text-[12px] text-white placeholder-white/20 outline-none"
                />
                <button
                  type="submit"
                  disabled={!followUpQ.trim()}
                  className="w-7 h-7 rounded-xl bg-[#CB2729] disabled:bg-white/5 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0"
                >
                  <Send size={11} className="text-white" />
                </button>
              </form>
              <p className="text-[9px] text-white/15 text-center mt-2 uppercase tracking-[0.2em]">Only answers about this project</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Project Preview Browser ─────────────────── */}
      {previewUrl && (
        <div className="fixed inset-0 z-[10003] bg-black flex flex-col">
          <div className="h-12 bg-[#111] border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
            {/* Traffic lights */}
            <div className="flex gap-1.5 shrink-0 group/dots">
              <button onClick={() => setPreviewUrl(null)} title="Close" className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-400 transition-colors flex items-center justify-center">
                <X size={6} className="text-red-900 opacity-0 group-hover/dots:opacity-100 transition-opacity" />
              </button>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" title="Open in New Tab" className="w-3 h-3 bg-yellow-400 rounded-full hover:bg-yellow-300 transition-colors flex items-center justify-center">
                <ExternalLink size={6} className="text-yellow-900 opacity-0 group-hover/dots:opacity-100 transition-opacity" />
              </a>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" title="Full Screen" className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-400 transition-colors flex items-center justify-center">
                <Maximize2 size={6} className="text-green-900 opacity-0 group-hover/dots:opacity-100 transition-opacity" />
              </a>
            </div>
            {/* Address bar */}
            <div className="flex-1 bg-black/60 h-8 rounded-lg border border-white/[0.06] flex items-center px-3 gap-2 min-w-0">
              <ShieldCheck size={11} className="text-green-500/50 shrink-0" />
              <span className="text-[11px] text-white/30 truncate">{previewUrl}</span>
            </div>
            {/* Close button */}
            <button
              onClick={() => setPreviewUrl(null)}
              className="shrink-0 flex items-center gap-1.5 bg-[#CB2729] hover:bg-red-500 active:scale-95 transition-all px-3 py-1.5 rounded-lg"
            >
              <X size={13} className="text-white" />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">Close</span>
            </button>
          </div>
          <div className="flex-1 bg-white relative overflow-hidden">
            <iframe
              src={previewUrl}
              className={`w-full h-full border-none transition-opacity duration-500 ${iframeLoading ? "opacity-0" : "opacity-100"}`}
              onLoad={() => setIframeLoading(false)}
            />
            {iframeLoading && (
              <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-2 border-[#CB2729]/30 border-t-[#CB2729] rounded-full animate-spin" />
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/20">Loading preview...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Card Component ────────────────────────────────────────
const Card = ({ project, index, isWide, onView, onAsk }: {
  project: PortfolioItem;
  index: number;
  isWide: boolean;
  onView: (url: string) => void;
  onAsk: () => void;
}) => {
  const hoverTimer = useRef<any>(null);
  const t = index % 4;

  const startHover = () => { 
    const delay = window.innerWidth < 768 ? 1200 : 3000;
    hoverTimer.current = setTimeout(onAsk, delay); 
  }; 
  const endHover = () => clearTimeout(hoverTimer.current);

  const shared = {
    onMouseEnter: startHover,
    onMouseLeave: endHover,
    onDoubleClick: onAsk,
  };

  // Wide featured card
  if (isWide) {
    return (
      <div {...shared} className="relative group bg-[#151515] border border-white/[0.07] rounded-3xl overflow-hidden flex flex-col md:flex-row gap-0 cursor-help transition-all duration-500 hover:border-[#CB2729]/30 hover:shadow-[0_0_40px_rgba(203,39,41,0.1)]">
        <div className="md:w-1/2 h-56 md:h-auto relative overflow-hidden">
          <img src={project.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={project.title} />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#151515] opacity-0 md:opacity-80" />
          <div className="absolute top-5 left-5">
            <span className="bg-[#CB2729] text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-full text-white">Featured</span>
          </div>
        </div>
        <div className="md:w-1/2 p-8 flex flex-col justify-center gap-4">
          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">{project.title}</h3>
          <p className="text-white/50 text-[14px] leading-relaxed">{project.description}</p>
          <div className="flex gap-2 flex-wrap">
            {(project.category || "").split(",").map((t, i) => (
              <span key={i} className="bg-white/5 border border-white/[0.08] text-white/40 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">{t.trim()}</span>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <button onClick={() => onView(project.demoUrl)} className="inline-flex items-center gap-2 text-[#CB2729] text-[12px] font-bold uppercase tracking-[0.2em] hover:gap-3 transition-all">
              View Project <ExternalLink size={13} />
            </button>
            <button onClick={onAsk} className="inline-flex items-center gap-1.5 text-white/30 text-[11px] hover:text-white transition-colors">
              <Sparkles size={12} /> Ask AI
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sticker card (dark with image thumbnail)
  if (t === 0) {
    return (
      <div {...shared} className="group bg-[#141414] border border-white/[0.07] rounded-3xl overflow-hidden cursor-help transition-all duration-500 hover:border-[#CB2729]/30 hover:shadow-[0_0_30px_rgba(203,39,41,0.1)] hover:-translate-y-1">
        <div className="relative h-44 overflow-hidden">
          <img src={project.image} alt={project.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent" />
          <div className="absolute top-4 left-4">
            <span className="bg-[#CB2729] text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full text-white">{project.category || "Project"}</span>
          </div>
        </div>
        <div className="p-5 pt-3">
          <h3 className="text-[18px] font-bold text-white mb-2 tracking-tight" title={project.title}>{project.title}</h3>
          <p className="text-white/40 text-[12px] leading-relaxed mb-5">
            <ReadMore text={project.description} limit={80} dark />
          </p>
          <div className="flex items-center justify-between">
            <button onClick={() => onView(project.demoUrl)} className="text-[#CB2729] text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 hover:gap-2.5 transition-all">
              View Project <ExternalLink size={13} />
            </button>
            <button onClick={onAsk} className="text-white/20 hover:text-white/60 transition-colors">
              <Sparkles size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Polaroid card
  if (t === 1) {
    return (
      <div {...shared} className="group relative cursor-help">
        <div className="bg-[#f5f1e8] p-4 pb-8 shadow-2xl transition-all duration-500 hover:rotate-1 hover:-translate-y-1 rounded-sm">
          <div className="h-44 overflow-hidden mb-4 bg-black rounded-sm relative">
            <img src={project.image} alt={project.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
          </div>
          <p className="font-hand text-red-600 text-[22px] leading-none mb-1">{project.title}</p>
          <p className="text-black/60 font-hand text-[16px] leading-snug mb-3">
            <ReadMore text={project.description} limit={75} />
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => onView(project.demoUrl)} className="text-red-600 font-black text-[11px] uppercase tracking-widest flex items-center gap-1">
              OPEN <ExternalLink size={11} />
            </button>
            <button onClick={onAsk} className="ml-auto text-black/30 hover:text-black/60 transition-colors">
              <Sparkles size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Clean minimal card (replaces terminal)
  if (t === 2) {
    return (
      <div {...shared} className="group bg-[#111] border border-white/[0.06] rounded-3xl overflow-hidden cursor-help transition-all duration-500 hover:border-[#CB2729]/30 hover:shadow-[0_0_30px_rgba(203,39,41,0.08)] hover:-translate-y-1">
        <div className="relative h-52 overflow-hidden">
          <img src={project.image} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/40 to-transparent" />
          <div className="absolute top-4 left-4">
            <span className="bg-white/10 backdrop-blur-md border border-white/10 text-white/70 text-[9px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full">
              {project.category || "Project"}
            </span>
          </div>
        </div>
        <div className="p-5">
          <h3 className="text-[17px] font-bold text-white mb-2 tracking-tight" title={project.title}>{project.title}</h3>
          <p className="text-white/40 text-[12px] leading-relaxed mb-5">
            <ReadMore text={project.description} limit={80} dark />
          </p>
          <div className="flex items-center justify-between">
            <button onClick={() => onView(project.demoUrl)} className="text-[#CB2729] text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 hover:gap-2.5 transition-all">
              View Live <ExternalLink size={13} />
            </button>
            <button onClick={onAsk} className="text-white/20 hover:text-white/60 transition-colors">
              <Sparkles size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sticky note card
  return (
    <div {...shared} className="group relative cursor-help">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-3 h-3 bg-[#CB2729] rounded-full shadow-[0_0_10px_rgba(203,39,41,0.5)] z-10" />
      <div className="bg-[#fff9c4] p-6 shadow-xl transition-all duration-500 hover:-rotate-1 hover:-translate-y-1 rounded-sm">
        <h3 className="font-hand text-[28px] text-[#CB2729] mb-3 leading-none border-b-2 border-dashed border-black/10 pb-2">{project.title} ♥</h3>
        <div className="flex gap-1.5 mb-3">
          <div className="w-5 h-5 rounded-full bg-red-500 shadow-sm" />
          <div className="w-5 h-5 rounded-full bg-yellow-500 shadow-sm" />
          <div className="w-5 h-5 rounded-full bg-cyan-500 shadow-sm" />
          <div className="w-5 h-5 rounded-full bg-slate-800 shadow-sm" />
        </div>
        <p className="text-black/70 font-hand text-[18px] leading-snug mb-5">
          <ReadMore text={project.description} limit={85} />
        </p>
        <div className="flex items-center justify-between">
          <button onClick={() => onView(project.demoUrl)} className="font-hand text-[18px] text-black/70 underline underline-offset-2 decoration-dotted hover:text-black transition-colors flex items-center gap-1">
            open <ExternalLink size={14} />
          </button>
          <button onClick={onAsk} className="text-black/30 hover:text-black/60 transition-colors">
            <Sparkles size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── ReadMore Component ───────────────────────────────────
const ReadMore = ({
  text, limit = 90, className = "", dark = false
}: { text: string; limit?: number; className?: string; dark?: boolean }) => {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const isLong = text.length > limit;
  return (
    <span className={className}>
      {isLong && !open ? (
        text.slice(0, limit).trimEnd() + "…"
      ) : (
        <SmartText text={text} />
      )}
      {isLong && (
        <button
          onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
          className={`ml-1.5 text-[10px] font-bold uppercase tracking-wider underline underline-offset-2 transition-opacity hover:opacity-100 opacity-60 ${
            dark ? "text-white" : "text-black"
          }`}
        >
          {open ? "less" : "more"}
        </button>
      )}
    </span>
  );
};

// ── Reveal Wrapper ────────────────────────────────────────
const Reveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const [vis, setVis] = useState(false);
  const ref = useRef<any>(null);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setTimeout(() => setVis(true), delay); }, { threshold: 0.05 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      {children}
    </div>
  );
};

export default Portfolio;

