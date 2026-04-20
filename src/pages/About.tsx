import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Download, GraduationCap, X, ExternalLink, Sparkles, Bot } from "lucide-react";
import { aboutDB, skillsDB, educationDB, AboutData, SkillItem, EducationItem } from "@/lib/adminData";
import { Skeleton } from "@/components/ui/skeleton";

const About = () => {
  const [personalData, setPersonalData] = useState<any>(null);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inView, setInView] = useState(false);
  const statsSectionRef = useRef<HTMLDivElement>(null);

  // Living Interaction State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredEl, setHoveredEl] = useState<{ id: string; rect: DOMRect; context: string } | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [bubble, setBubble] = useState<{ x: number; y: number; text: string; options: string[] } | null>(null);
  const [aiAnswer, setAiAnswer] = useState<{ text: string; typing: boolean } | null>(null);
  const [whisper, setWhisper] = useState("Tap/Click items for context");
  const [cvModalOpen, setCvModalOpen] = useState(false);
  
  const pressTimer = useRef<any>(null);
  const hoverTimer = useRef<any>(null);

  const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const MODEL = "gemini-3-flash-preview";

  const askAI = async (question: string, context: string) => {
    setAiAnswer({ text: "", typing: true });
    try {
      // Build a detailed knowledge base from REAL backend data
      const bio = data.bio || data.description || "Passionate developer building the future of the web.";
      const skillsList = skills.map(s => s.name).join(", ");
      const eduList = education.map(e => `${e.degree} at ${e.institution} (${e.year}) - GPA: ${e.gpa || 'N/A'}. Details: ${e.description || 'N/A'}`).join(" | ");
      const contactInfo = `Email: ${data.email}, Phone: ${data.phone}, Location: ${data.address}`;
      
      const prompt = `You are Sujan Gautam, replying to a visitor on your portfolio website.
      FACTS ABOUT YOU: 
      - Name: Sujan Gautam
      - Bio: ${bio}
      - Skills: ${skillsList}
      - Education: ${eduList}
      - Freelance: ${data.freelanceStatus || 'Open for projects'}
      - Contact: ${contactInfo}
      - Current Context: The user is looking at ${context}

      QUESTION: "${question}"
      
      INSTRUCTIONS FOR RESPONSE:
      1. Speak exactly like a friendly, humble human being. Do NOT sound like an AI robot.
      2. Keep it extremely simple, clear, and easy to understand. Avoid corporate jargon.
      3. Use a casual, conversational tone (e.g., "I loved studying there", "My main focus was...").
      4. Keep the response short (1 to 2 sentences maximum).
      5. Only use the facts provided above. If you don't know something, just be casual and say "Let's chat about that over email!"`;

      const BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:5000";
      const res = await axios.post(`${BASE_URL}/api/ai/ask`, { prompt });
      const responseText = res.data.answer || "My mind is a bit foggy... but I can tell you I love building great UIs!";
      
      // Typing effect
      let i = 0;
      const interval = setInterval(() => {
        setAiAnswer(prev => ({ text: responseText.slice(0, i + 1), typing: true }));
        i++;
        if (i >= responseText.length) {
          clearInterval(interval);
          setAiAnswer({ text: responseText, typing: false });
        }
      }, 30);
    } catch (err) {
      console.error("AI Error:", err);
      setAiAnswer({ text: "System overload... too many memories at once. Ask me something simpler!", typing: false });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleInteractionTrigger = (e: any, context: string, immediate = false) => {
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);
    
    const trigger = () => {
      setBubble({
        x: Math.min(window.innerWidth - 240, Math.max(20, x)), 
        y: Math.max(20, y - 200),
        text: "Thinking...",
        options: getSuggestedQuestions(context)
      });
    };

    if (immediate) {
      trigger();
    } else {
      // Long press / Long hover timer
      hoverTimer.current = setTimeout(trigger, 3000); // 3-second hover as requested
    }
  };

  const handleInteractionEnd = () => {
    setIsPressing(false);
    clearTimeout(pressTimer.current);
    clearTimeout(hoverTimer.current);
  };

  const cancelInteraction = () => {
    clearTimeout(hoverTimer.current);
  };

  const getSuggestedQuestions = (context: string) => {
    const ctx = context.toLowerCase();
    if (ctx.includes("name")) return ["What's the story behind the name Sujan?", "Tell me about yourself in 3 words."];
    if (ctx.includes("skill")) {
        const skillName = context.split(": ")[1] || "this skill";
        return [`How long have you been using ${skillName}?`, `What's your most complex project with ${skillName}?` ];
    }
    if (ctx.includes("education")) {
        const eduTitle = context.split(": ")[1] || "this institution";
        return [`What was the highlight of your time at ${eduTitle}?`, "How did this education shape your work today?"];
    }
    if (ctx.includes("experience")) return ["What was your most challenging project yet?", "Why the jump to 2.3 years specifically?"];
    if (ctx.includes("freelance")) return ["What kind of projects are you looking for?", "How can we start a collaboration?"];
    return ["What drives your passion for code?", "Are you currently looking for new opportunities?"];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aboutRes, skillsRes, eduRes] = await Promise.all([
          aboutDB.get(),
          skillsDB.getAll(),
          educationDB.getAll()
        ]);
        setPersonalData(aboutRes);
        setSkills(skillsRes || []);
        setEducation(eduRes || []);
      } catch (error) {
        console.error("Error fetching about page data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.1 }
    );
    if (statsSectionRef.current) observer.observe(statsSectionRef.current);
    return () => { if (statsSectionRef.current) observer.unobserve(statsSectionRef.current); };
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 md:p-12 space-y-12">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="w-full md:w-1/3 aspect-square rounded-3xl relative overflow-hidden bg-[#1a1a1a]">
              <Skeleton className="w-full h-full opacity-20" />
            </div>
            <div className="flex-1 space-y-6">
              <Skeleton className="h-12 w-48 opacity-20" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full opacity-10" />
                <Skeleton className="h-4 w-full opacity-10" />
                <Skeleton className="h-4 w-2/3 opacity-10" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-8">
                {[1,2,3,4].map(i => (
                  <Skeleton key={i} className="h-20 w-full opacity-10 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-12">
            <Skeleton className="h-16 w-64 mx-auto opacity-20" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <Skeleton key={i} className="h-32 w-full opacity-10 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Final fallback if backend has NO record at all
  const data = personalData || {};

  return (
    <div 
      className="min-h-screen text-white pb-[220px] font-poppins selection:bg-red-500/30 overflow-x-hidden scroll-smooth relative"
      onMouseUp={handleInteractionEnd}
      onTouchEnd={handleInteractionEnd}
    >
      {/* Living Cursor Aura */}
      <div 
        className="fixed pointer-events-none z-[9999] transition-transform duration-75 ease-out"
        style={{ transform: `translate(${mousePos.x - 30}px, ${mousePos.y - 30}px)` }}
      >
        <div className={`w-[60px] h-[60px] rounded-full bg-red-600/20 blur-[30px] transition-all duration-300 ${hoveredEl ? 'scale-[2.5] bg-red-600/40' : 'scale-100'}`} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-600 rounded-full shadow-[0_0_15px_#CB2729]" />
      </div>

      {/* Shimmering Line */}
      {hoveredEl && (
        <svg className="fixed top-0 left-0 w-full h-full pointer-events-none z-[9000]">
          <line 
            x1={mousePos.x} y1={mousePos.y} 
            x2={hoveredEl.rect.left + hoveredEl.rect.width / 2} 
            y2={hoveredEl.rect.top + hoveredEl.rect.height / 2} 
            className="stroke-[#CB2729]/20 stroke-1"
            style={{ strokeDasharray: '4,4', animation: 'shimmer 1.2s linear infinite' }} 
          />
        </svg>
      )}

      {/* Thought Bubble */}
      {bubble && (
        <div 
          className="fixed z-[10000] bg-[#121212]/95 border border-white/10 p-7 rounded-3xl shadow-[0_20px_60px_rgba(203,39,41,0.2)] backdrop-blur-2xl animate-in zoom-in duration-300"
          style={{ left: bubble.x, top: bubble.y }}
          onMouseLeave={() => setBubble(null)}
        >
          <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-5 h-5 bg-[#121212] border-r border-b border-white/10 rotate-45" />
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
            <h4 className="text-[10px] uppercase text-white/40 tracking-[0.4em] font-bold">AI THOUGHTS</h4>
          </div>
          <div className="space-y-4">
            {bubble.options.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => { askAI(opt, "Contextual probe"); setBubble(null); }}
                className="block w-full text-left text-[14px] text-white/70 hover:text-red-500 transition-all py-1.5 border-b border-white/5 last:border-0 hover:translate-x-1"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Answer Overlay */}
      {aiAnswer && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] md:w-[640px] z-[9500] animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-[#0a0a0a]/95 border border-white/10 px-8 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl rounded-xl">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-red-600 to-red-400 flex items-center justify-center">
                <Bot size={14} className="text-white" />
              </div>
              <span className="text-[12px] font-medium text-white/50 uppercase tracking-widest font-mono">
                Shree ai
              </span>
              <button 
                onClick={() => setAiAnswer(null)} 
                className="ml-auto text-white/30 hover:text-white transition-colors"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-[15px] leading-[1.8] text-white/90 font-light selection:bg-red-500/30 font-inter">
              {aiAnswer.text}
              {aiAnswer.typing && <span className="inline-block w-2 h-4 bg-red-500 ml-1.5 align-middle animate-pulse" />}
            </div>


          </div>
        </div>
      )}

      {/* Whisper Bar - Positioned above footer nav */}
      {!aiAnswer && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[10000] w-[90%] md:w-auto px-10 py-3 bg-[#111]/80 backdrop-blur-lg border border-white/5 rounded-full shadow-2xl transition-all duration-500">
          <div className="flex items-center gap-5">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_#red]" />
            <span className="text-[14px] text-white/60 font-light lowercase tracking-[0.15em] whitespace-nowrap overflow-hidden">
              {whisper}
            </span>
          </div>
        </div>
      )}

      {/* Red accent line top */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />

      {/* Header Section */}
      <Reveal>
        <div className="text-center pt-16 pb-6">
          <h1 className="text-[5.5vw] font-bold tracking-tight uppercase leading-tight font-poppins">
            ABOUT <span className="text-[#CB2729]">ME</span>
          </h1>
        </div>
      </Reveal>

      <div className="w-full px-[9%]">
        {/* Profile Info & Stats */}
        <Reveal delay={100}>
          <div ref={statsSectionRef} className="flex flex-col xl:flex-row gap-24 items-stretch mb-20">
            {/* Left: Personal Info */}
            <div className="flex-[1.4] w-full flex flex-col justify-between">
              <div 
                onClick={(e) => handleInteractionTrigger(e, "Personal Info Body", true)}
              >
                <h2 className="text-[30px] font-bold uppercase mb-8">
                  Personal Info
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 mb-6">
                  <div className="space-y-4 text-left">
                    <LivingInfo label="Name" value={data.name || ""} onHover={(v, e) => {setWhisper(`Interactive: Learn more about ${v.id}`); setHoveredEl(v); handleInteractionTrigger(e, v.context);}} onLeave={() => {setWhisper("Tap/Click for AI insights"); setHoveredEl(null); cancelInteraction();}} />
                    <LivingInfo label="Age" value={data.age || data.dob || ""} onHover={(v, e) => {setWhisper(`Interactive: Why I started my journey at ${v.id}`); setHoveredEl(v); handleInteractionTrigger(e, v.context);}} onLeave={() => {setWhisper("Tap/Click for AI insights"); setHoveredEl(null); cancelInteraction();}} />
                    <LivingInfo label="Freelance" value={data.freelanceStatus || "Available"} className="text-[#CB2729]" onHover={(v, e) => {setWhisper(`Interactive: My current work availability`); setHoveredEl(v); handleInteractionTrigger(e, v.context);}} onLeave={() => {setWhisper("Tap/Click for AI insights"); setHoveredEl(null); cancelInteraction();}} />
                  </div>
                  <div className="space-y-4 text-left">
                    <LivingInfo label="Address" value={data.address || ""} onHover={(v, e) => {setWhisper(`Interactive: Based in ${v.id}`); setHoveredEl(v); handleInteractionTrigger(e, v.context);}} onLeave={() => {setWhisper("Tap/Click for AI insights"); setHoveredEl(null); cancelInteraction();}} />
                    <LivingInfo label="Phone" value={data.phone || ""} onHover={(v, e) => {setWhisper(`Interactive: Direct contact line`); setHoveredEl(v); handleInteractionTrigger(e, v.context);}} onLeave={() => {setWhisper("Tap/Click for AI insights"); setHoveredEl(null); cancelInteraction();}} />
                    <LivingInfo label="Email" value={data.email || ""} className="lowercase" onHover={(v, e) => {setWhisper(`Interactive: Professional inquiries to ${v.id}`); setHoveredEl(v); handleInteractionTrigger(e, v.context);}} onLeave={() => {setWhisper("Tap/Click for AI insights"); setHoveredEl(null); cancelInteraction();}} />
                    <LivingInfo label="Language" value={data.languages || data.language || ""} onHover={(v, e) => {setWhisper(`Interactive: Multi-lingual proficiency`); setHoveredEl(v); handleInteractionTrigger(e, v.context);}} onLeave={() => {setWhisper("Tap/Click for AI insights"); setHoveredEl(null); cancelInteraction();}} />
                  </div>
                </div>
              </div>

              {/* Download CV */}
              {data.cvUrl ? (
                <div className="mt-auto pt-8">
                  <button 
                    onClick={() => setCvModalOpen(true)}
                    className="inline-flex items-center gap-4 bg-[#CB2729] text-white pl-8 pr-3 py-3 rounded-full font-medium text-[17px] hover:scale-105 transition-all active:scale-95 group shadow-lg"
                  >
                    View CV
                    <span className="w-10 h-10 rounded-full bg-white text-[#CB2729] flex items-center justify-center group-hover:ml-4 transition-all">
                      <ExternalLink size={18} />
                    </span>
                  </button>
                </div>
              ) : null}
            </div>

            {/* Right: Stats Grid (3 on top, 1 at bottom) */}
            <div className="flex-1 w-full flex flex-col gap-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
                <LivingStat value={data.yearsOfExperience || "0"} label="Years Of Experience" trigger={inView} onHover={(v, e) => {setWhisper(`Perspective: ${v.id} years of evolution`); setHoveredEl(v); handleInteractionTrigger(e, v.context);}} onLeave={() => {setWhisper("Tap/Click for AI insights"); setHoveredEl(null); cancelInteraction();}} />
                <LivingStat value={data.happyClients || "0"} label="Happy Clients" trigger={inView} onHover={(v, e) => {setWhisper(`Perspective: Impacting ${v.id} partners`); setHoveredEl(v); handleInteractionTrigger(e, v.context);}} onLeave={() => {setWhisper("Tap/Click for AI insights"); setHoveredEl(null); cancelInteraction();}} />
                <LivingStat value={data.projectCompleted || "0"} label="Project Completed" className="col-span-2 md:col-span-1" trigger={inView} onHover={(v, e) => {setWhisper(`Perspective: Successfully shipped ${v.id} deployments`); setHoveredEl(v); handleInteractionTrigger(e, v.context);}} onLeave={() => {setWhisper("Tap/Click for AI insights"); setHoveredEl(null); cancelInteraction();}} />
              </div>
              <div className="flex-1">
                <LivingStat value={data.awardsWon || "0"} label="Awards Won" className="h-full" trigger={inView} onHover={(v, e) => {setWhisper(`Perspective: ${v.id} industrial Recognitions`); setHoveredEl(v); handleInteractionTrigger(e, v.context);}} onLeave={() => {setWhisper("Tap/Click for AI insights"); setHoveredEl(null); cancelInteraction();}} />
              </div>
            </div>
          </div>
        </Reveal>

        {/* My Skills Section */}
        <Reveal delay={200}>
          <div className="mb-24 text-center">
            <h2 className="text-[5.5vw] font-bold uppercase mb-12 leading-tight font-poppins">
              MY <span className="text-[#CB2729]">SKILLS</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {skills.map((skill, idx) => (
                <Reveal key={skill.id} delay={idx * 50}>
                  <div 
                    className="bg-[#1a1a1a] shadow-xl p-8 rounded-lg flex flex-col items-center justify-center gap-4 group hover:bg-white transition-all duration-300 relative cursor-help"
                    onMouseEnter={(e) => {setWhisper(`Mastery: Deep dive into ${skill.name} logic`); setHoveredEl({ id: skill.id, rect: e.currentTarget.getBoundingClientRect(), context: `Skill: ${skill.name}` }); handleInteractionTrigger(e, `Skill: ${skill.name}`);}}
                    onMouseLeave={() => {setWhisper("Tap/Click for AI insights"); setHoveredEl(null); cancelInteraction();}}
                    onClick={(e) => handleInteractionTrigger(e, `Skill: ${skill.name}`, true)}
                  >
                    <div className="w-20 h-20 mb-4 transition-transform group-hover:scale-110">
                      <img src={skill.image} alt={skill.name} className="w-full h-full object-contain" />
                    </div>
                    <h3 className="text-[17px] font-normal uppercase text-white group-hover:text-[#0d0d0d] transition-colors">
                      {skill.name}
                    </h3>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>

        {/* My Education Section */}
        <Reveal delay={300}>
          <div className="mb-10">
            <h2 className="text-[5.5vw] font-bold text-center uppercase mb-20 leading-tight font-poppins">
              MY <span className="text-[#CB2729]">EDUCATION</span>
            </h2>
          
          <div className="relative">
            {/* Center Line for Desktop */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/10 -translate-x-1/2" />
            
            <div className="space-y-12 lg:space-y-0">
              {education
                .sort((a, b) => {
                  const getHighestYear = (y: string) => {
                    const parts = y.split("-").map(p => parseInt(p.trim()));
                    return Math.max(...parts.filter(p => !isNaN(p)));
                  };
                  return getHighestYear(b.year) - getHighestYear(a.year);
                })
                .map((edu, index) => (
                  <Reveal key={edu.id} delay={index * 100}>
                    <div className={`flex flex-col lg:flex-row items-center gap-6 lg:gap-0 ${index % 2 === 0 ? "lg:flex-row-reverse" : ""}`}>
                        {/* Content Block */}
                        <div className="flex-1 w-full lg:w-1/2">
                          <div 
                            className={`relative bg-[#1a1a1a] p-8 rounded-lg shadow-2xl border border-white/5 hover:border-red-600/30 transition-all duration-300 group cursor-help ${index % 2 === 0 ? "lg:ml-12" : "lg:mr-12"}`}
                            onMouseEnter={(e) => {setWhisper(`Education: Chapter at ${edu.institution}`); setHoveredEl({ id: edu.id, rect: e.currentTarget.getBoundingClientRect(), context: `Education: ${edu.institution}` }); handleInteractionTrigger(e, `Education: ${edu.institution}`);}}
                            onMouseLeave={() => {setWhisper("Tap/Click for AI insights"); setHoveredEl(null); cancelInteraction();}}
                            onClick={(e) => handleInteractionTrigger(e, `Education: ${edu.institution}`, true)}
                          >
                            {/* Direction Arrow */}
                            <div className={`hidden lg:block absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#1a1a1a] border-t border-l border-white/5 rotate-45 ${index % 2 === 0 ? "-left-2 border-t-0 border-l-0 border-r border-b" : "-right-2"}`} />
                            
                            <div className="flex items-start gap-4 mb-4">
                              {edu.image && (
                                <div className="w-12 h-12 rounded-lg bg-white p-1 shrink-0 overflow-hidden">
                                  <img src={edu.image} alt={edu.institution} className="w-full h-full object-contain" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="text-[12px] font-medium text-[#CB2729] uppercase tracking-[0.2em] block mb-1">
                                  {edu.year}
                                </span>
                                <h3 className="text-[18px] md:text-[20px] font-bold uppercase text-white group-hover:text-red-500 transition-colors truncate">
                                  {edu.institution}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                  <p className="text-[14px] text-white/70 font-medium">
                                    {edu.degree}
                                  </p>
                                  {edu.gpa && (
                                    <span className="px-2 py-0.5 bg-red-600/10 text-red-500 text-[11px] font-bold rounded border border-red-600/20">
                                      GPA: {edu.gpa}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-[15px] text-[#aaa] leading-relaxed font-light">
                              {edu.description}
                            </p>
                          </div>
                        </div>

                    {/* Timeline Spine Node */}
                    <div className="relative z-10 flex items-center justify-center w-12 h-20 lg:h-auto">
                      {/* Vertical line segments */}
                      {index !== 0 && <div className="absolute top-0 w-[2px] h-1/2 bg-gradient-to-t from-[#CB2729] to-transparent lg:bg-white/10" />}
                      {index !== education.length - 1 && <div className="absolute bottom-0 w-[2px] h-1/2 bg-gradient-to-b from-[#CB2729] to-transparent lg:bg-white/10" />}
                      
                      <div className="w-10 h-10 bg-[#0d0d0d] border-2 border-[#CB2729] rounded-full flex items-center justify-center text-[#CB2729] shadow-[0_0_15px_rgba(203,39,41,0.3)] transition-transform group-hover:scale-110">
                        <GraduationCap size={18} />
                      </div>
                    </div>

                    {/* Spacer */}
                    <div className="hidden lg:block flex-1 w-1/2" />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
      {/* CV Internal Browser Modal */}
      {cvModalOpen && data.cvUrl && createPortal(
        <div className="fixed inset-0 z-[100000] flex flex-col bg-black/60 backdrop-blur-sm animate-in fade-in duration-500 overflow-hidden">
           {/* MacBook Pro style Browser Shell */}
           <div className="flex-1 flex flex-col w-full h-full md:w-[92vw] md:h-[90vh] md:m-auto md:rounded-2xl md:border md:border-white/10 bg-[#0d0d0d] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-500">
              
              {/* Premium Header */}
              <div className="h-14 flex items-center justify-between px-5 bg-[#121212]/80 backdrop-blur-xl border-b border-white/5 shrink-0 select-none">
                 <div className="flex items-center gap-6">
                    {/* Window Controls */}
                    <div className="hidden md:flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                       <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                       <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                    </div>
                    
                    <div className="flex items-center gap-2.5">
                       <GraduationCap size={14} className="text-white/40" />
                       <span className="text-[11px] text-white/40 font-bold uppercase tracking-[0.1em] font-inter">Curriculum Vitae</span>
                    </div>
                 </div>

                 {/* Center Address Field Aesthetic */}
                 <div className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/5 px-10 py-1.5 rounded-lg w-[400px] justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-white/30 truncate font-inter">https://sujangautam.com/vault/cv_secure_view</span>
                 </div>

                 <div className="flex items-center gap-3">
                    <a 
                      href={data.cvUrl} 
                      download 
                      className="flex items-center gap-2 px-5 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-[#CB2729] hover:text-white transition-all transform active:scale-95 font-inter"
                    >
                      <Download size={14} />
                      <span className="hidden sm:inline">Save PDF</span>
                    </a>
                    <button 
                      onClick={() => setCvModalOpen(false)}
                      className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <X size={20} />
                    </button>
                 </div>
              </div>

              {/* Sub-Header for Mobile Download */}
              <div className="md:hidden px-5 py-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                 <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Document Viewer</p>
                 <a href={data.cvUrl} download className="text-[10px] text-[#CB2729] font-black uppercase tracking-widest underline decoration-2 underline-offset-4">Direct Link</a>
              </div>

              {/* The Browser Content Container */}
              <div className="flex-1 w-full bg-[#111] relative group">
                {/* Custom Loading State */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0d0d0d] z-0">
                    <div className="w-12 h-12 border-2 border-white/10 border-t-[#CB2729] rounded-full animate-spin" />
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">Decrypting Document...</p>
                </div>

                <iframe 
                  src={`${data.cvUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                  className="relative z-10 w-full h-full border-none opacity-0 animate-in fade-in duration-1000 fill-mode-forwards"
                  title="CV Viewer"
                  onLoad={(e) => (e.currentTarget as any).style.opacity = '1'}
                />
              </div>
           </div>
        </div>,
        document.body
      )}

    </div>
  </div>
);
};

const Counter = ({ target, trigger }: { target: string; trigger: boolean }) => {
  const [count, setCount] = useState(0);
  const targetNum = parseFloat(target);
  const isDecimal = target.includes(".");

  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const end = targetNum;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuad = progress * (2 - progress);
      const current = easeOutQuad * end;
      
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [trigger, targetNum]);

  return (
    <span>
      {isDecimal ? count.toFixed(1) : Math.floor(count)}
      +
    </span>
  );
};

const LivingInfo = ({ label, value, className = "", onHover, onLeave }: { label: string; value: string; className?: string, onHover: (v: any, e: any) => void, onLeave: () => void }) => (
  <div 
    className="text-[17px] font-normal text-white flex gap-2 leading-relaxed cursor-help group/info"
    onMouseEnter={(e) => onHover({ id: label, rect: e.currentTarget.getBoundingClientRect(), context: `${label}: ${value}` }, e)}
    onMouseLeave={onLeave}
  >
    <span className="shrink-0 w-[95px] text-white font-medium group-hover/info:text-red-500 transition-colors">{label}:</span>
    <span className={`text-[#aaa] font-light ${className}`}>{value}</span>
  </div>
);

const LivingStat = ({ value, label, className = "", trigger, onHover, onLeave }: { value: string; label: string; className?: string; trigger: boolean, onHover: (v: any, e: any) => void, onLeave: () => void }) => (
  <div 
    className={`bg-[#1a1a1a] shadow-2xl rounded-lg p-8 hover:scale-[1.02] transition-all cursor-help border border-transparent hover:border-red-600/30 ${className}`}
    onMouseEnter={(e) => onHover({ id: label, rect: e.currentTarget.getBoundingClientRect(), context: `${label}: ${value}` }, e)}
    onMouseLeave={onLeave}
    onClick={(e) => onHover({ id: label, rect: e.currentTarget.getBoundingClientRect(), context: `${label}: ${value}` }, e)}
  >
    <h3 className="text-[38px] font-bold text-[#CB2729] flex items-center">
      <Counter target={value} trigger={trigger} />
    </h3>
    <p className="text-[14px] text-[#aaa] leading-tight mt-2 uppercase font-light">
      {label}
    </p>
  </div>
);

const InfoItem = ({ label, value, className = "" }: { label: string; value: string; className?: string }) => (
  <div className="text-[17px] font-normal text-white flex gap-2 leading-relaxed">
    <span className="shrink-0 w-[95px] text-white font-medium">{label}:</span>
    <span className={`text-[#aaa] font-light ${className}`}>{value}</span>
  </div>
);

const StatCard = ({ value, label, className = "", trigger }: { value: string; label: string; className?: string; trigger: boolean }) => (
  <div className={`bg-[#1a1a1a] shadow-2xl rounded-lg p-8 hover:scale-[1.02] transition-transform ${className}`}>
    <h3 className="text-[38px] font-bold text-[#CB2729] flex items-center">
      <Counter target={value} trigger={trigger} />
    </h3>
    <p className="text-[14px] text-[#aaa] leading-tight mt-2 uppercase font-light">
      {label}
    </p>
  </div>
);

export default About;

const shimmerStyle = `
  @keyframes shimmer {
    0% { stroke-dashoffset: 8; opacity: 0.1; }
    50% { opacity: 0.5; }
    100% { stroke-dashoffset: 0; opacity: 0.1; }
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = shimmerStyle;
  document.head.appendChild(style);
}

const Reveal = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [delay]);

  return (
    <div 
      ref={ref}
      className={`${className} transition-all duration-1000 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      {children}
    </div>
  );
};
