import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { 
  ArrowUpRight, 
  TerminalSquare, 
  PlayCircle, 
  Video, 
  Activity, 
  Brain, 
  BookOpen, 
  CloudRain, 
  Database,
  Layout,
  Code2,
  FileCode2,
  Server,
  Network
} from 'lucide-react';

const Trace = () => {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden selection:bg-[#00F0FF] selection:text-black" style={{ fontFamily: "'Inter', sans-serif" }}>
      <SEO 
        title="Trace — Time-Travel Visual Debugger & AI Video Synthesizer" 
        description="An advanced interactive tool designed to revolutionize how developers debug, visualize, and share code execution."
      />
      
      {/* Noise Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.04] z-0 mix-blend-screen" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
      />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-12 bg-black/80 backdrop-blur-md border-b border-white/10">
        <Link to="/" className="font-mono text-xs font-medium tracking-[0.08em] text-white/50 uppercase hover:text-white transition-colors">
          <span className="text-[#00F0FF]">{'//'}</span> project showcase
        </Link>
        <ul className="hidden md:flex gap-8 list-none">
          <li><a href="#solves" className="font-mono text-[11px] tracking-[0.06em] text-white/50 uppercase hover:text-white transition-colors">What It Solves</a></li>
          <li><a href="#features" className="font-mono text-[11px] tracking-[0.06em] text-white/50 uppercase hover:text-white transition-colors">Features</a></li>
          <li><a href="#stack" className="font-mono text-[11px] tracking-[0.06em] text-white/50 uppercase hover:text-white transition-colors">Tech Stack</a></li>
          <li><a href="#architecture" className="font-mono text-[11px] tracking-[0.06em] text-white/50 uppercase hover:text-white transition-colors">Architecture</a></li>
        </ul>
        <Link to="/" className="md:hidden font-mono text-[11px] tracking-[0.06em] text-[#00F0FF] hover:text-white uppercase transition-colors">Back</Link>
      </nav>

      <main className="relative z-10 pt-32 pb-24 md:pt-40 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto space-y-32">
        
        {/* Hero */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] text-[#00F0FF] uppercase mb-8">
            <span className="w-6 h-px bg-[#00F0FF]"></span>
            System Showcase
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-[80px] font-black leading-[0.95] tracking-tight mb-8 font-outfit">
            Trace<br />
            <em className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#0080FF]">Time-Travel Debugger</em>
          </h1>
          <p className="text-white/60 text-[15px] md:text-[17px] max-w-[650px] leading-[1.75] font-normal tracking-[0.01em]">
            Trace is an advanced interactive tool designed to revolutionize how developers debug, visualize, and share code execution. By combining abstract syntax tree (AST) source code instrumentation with generative AI, Trace transforms dry code execution runs into step-by-step interactive time-travel simulations and exports them as animated, narrated educational videos.
          </p>
          
          <div className="flex flex-wrap items-center gap-6 mt-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#00F0FF]/40 rounded text-[#00F0FF] font-mono text-[11px] tracking-[0.05em]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_6px_rgba(0,240,255,0.8)] animate-pulse"></span>
              Serverless Edge Optimized
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/20 rounded text-white/60 font-mono text-[11px] tracking-[0.05em]">
              AST Code Instrumentation
            </div>
          </div>
        </section>

        {/* What It Solves */}
        <section id="solves" className="scroll-mt-24 space-y-12">
          <div>
            <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-3">
              Problem Space
              <div className="h-px bg-white/20 w-20"></div>
            </div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight font-outfit">
              What It Solves
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111] border border-white/10 p-8 rounded-xl hover:border-white/20 transition-colors">
              <Brain className="w-8 h-8 text-[#00F0FF] mb-6" />
              <h3 className="text-lg font-bold mb-3 font-outfit">High Cognitive Load of Traditional Debugging</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                Traditional debuggers require developers to hold complex, dynamic program states in their heads. Trace automates this by recording every state transition and allowing developers to scrub backward and forward through time.
              </p>
            </div>
            <div className="bg-[#111] border border-white/10 p-8 rounded-xl hover:border-white/20 transition-colors">
              <BookOpen className="w-8 h-8 text-[#00F0FF] mb-6" />
              <h3 className="text-lg font-bold mb-3 font-outfit">The Educational Explanation Gap</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                Explaining how an algorithm works requires drawing diagrams and walking through code verbally. Trace automates this entire pipeline by generating customized video walkthroughs of the exact execution path with voice narration.
              </p>
            </div>
            <div className="bg-[#111] border border-white/10 p-8 rounded-xl hover:border-white/20 transition-colors">
              <CloudRain className="w-8 h-8 text-[#00F0FF] mb-6" />
              <h3 className="text-lg font-bold mb-3 font-outfit">Serverless Observability & Telemetry</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                Tracing behavior in serverless environments is difficult due to ephemeral container lifetimes. Trace integrates a comprehensive telemetry suite (Control Tower) that gathers API logs and gracefully falls back to HTTP polling.
              </p>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section id="features" className="scroll-mt-24 space-y-12">
          <div>
            <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-3">
              Capabilities
              <div className="h-px bg-white/20 w-20"></div>
            </div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight font-outfit">
              Key Features
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group flex gap-6 p-6 md:p-8 bg-gradient-to-br from-[#111] to-black border border-white/5 rounded-2xl hover:border-white/20 transition-all duration-300">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 text-white/80 group-hover:bg-[#00F0FF]/10 group-hover:text-[#00F0FF] transition-colors shrink-0">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 font-outfit">Time-Travel Execution Engine</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Compiles and runs user-provided JavaScript in a client-side sandbox while instrumenting it on-the-fly to capture a deterministic chronological log of every assignment, loop, function call, and branch check.
                </p>
              </div>
            </div>

            <div className="group flex gap-6 p-6 md:p-8 bg-gradient-to-br from-[#111] to-black border border-white/5 rounded-2xl hover:border-white/20 transition-all duration-300">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 text-white/80 group-hover:bg-[#00F0FF]/10 group-hover:text-[#00F0FF] transition-colors shrink-0">
                <TerminalSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 font-outfit">Sleek Interactive Sandbox</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  An IDE-like interface featuring code-line highlighting, an active variable inspector, call stack visualizers, and playback controls (play, pause, step backward/forward, speed regulation).
                </p>
              </div>
            </div>

            <div className="group flex gap-6 p-6 md:p-8 bg-gradient-to-br from-[#111] to-black border border-white/5 rounded-2xl hover:border-white/20 transition-all duration-300">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 text-white/80 group-hover:bg-[#00F0FF]/10 group-hover:text-[#00F0FF] transition-colors shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 font-outfit">AI Video Studio & Renderer</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Translates step-by-step execution into a structured video script using Google Gemini. Synthesizes voice narration, fetches generative visual backgrounds, and renders standard (16:9) or Shorts (9:16) WebM videos in the browser using WebCodecs.
                </p>
              </div>
            </div>

            <div className="group flex gap-6 p-6 md:p-8 bg-gradient-to-br from-[#111] to-black border border-white/5 rounded-2xl hover:border-white/20 transition-all duration-300">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 text-white/80 group-hover:bg-[#00F0FF]/10 group-hover:text-[#00F0FF] transition-colors shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 font-outfit">Operations Control Tower</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  A full-featured administration layout for tracking system diagnostics, user sessions, active feature flags, database health, API rate metrics, billing states, and audit trails.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section id="stack" className="scroll-mt-24 space-y-8">
          <div>
            <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-3">
              Ecosystem
              <div className="h-px bg-white/20 w-20"></div>
            </div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight font-outfit">
              Technology Stack
            </h2>
            <p className="text-white/50 text-[15px] mt-4 max-w-[600px]">
              Engineered as a full-stack JavaScript/TypeScript monorepo optimized for serverless edge execution on Vercel.
            </p>
          </div>

          <div className="overflow-x-auto pb-4">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr>
                  <th className="py-4 px-6 border-b border-white/10 font-mono text-xs uppercase tracking-wider text-white/40">Layer</th>
                  <th className="py-4 px-6 border-b border-white/10 font-mono text-xs uppercase tracking-wider text-white/40">Technologies & Libraries</th>
                  <th className="py-4 px-6 border-b border-white/10 font-mono text-xs uppercase tracking-wider text-white/40">Purpose</th>
                </tr>
              </thead>
              <tbody className="text-[14px]">
                <tr className="hover:bg-white/5 transition-colors border-b border-white/5">
                  <td className="py-4 px-6 text-white/80 font-medium">Frontend Core</td>
                  <td className="py-4 px-6 text-[#00F0FF]">React (v18), Vite, TypeScript</td>
                  <td className="py-4 px-6 text-white/50">Modern, high-performance UI and component lifecycle</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors border-b border-white/5">
                  <td className="py-4 px-6 text-white/80 font-medium">Styling</td>
                  <td className="py-4 px-6 text-[#00F0FF]">Vanilla CSS, Tailwind CSS</td>
                  <td className="py-4 px-6 text-white/50">Curated dark mode theme and glassmorphic aesthetic</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors border-b border-white/5">
                  <td className="py-4 px-6 text-white/80 font-medium">Compiler & Sandbox</td>
                  <td className="py-4 px-6 text-[#00F0FF]">@babel/standalone</td>
                  <td className="py-4 px-6 text-white/50">Dynamic client-side code instrumentation & compilation</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors border-b border-white/5">
                  <td className="py-4 px-6 text-white/80 font-medium">Animation Engines</td>
                  <td className="py-4 px-6 text-[#00F0FF]">GSAP, Anime.js</td>
                  <td className="py-4 px-6 text-white/50">Precise timeline-driven transitions and micro-animations</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors border-b border-white/5">
                  <td className="py-4 px-6 text-white/80 font-medium">State & Router</td>
                  <td className="py-4 px-6 text-[#00F0FF]">TanStack Query, React Router</td>
                  <td className="py-4 px-6 text-white/50">Clean routing and cache-first query management</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors border-b border-white/5">
                  <td className="py-4 px-6 text-white/80 font-medium">Backend Core & DB</td>
                  <td className="py-4 px-6 text-[#00F0FF]">Node.js, Express, MongoDB</td>
                  <td className="py-4 px-6 text-white/50">REST endpoints, persistent storage of traces/logs</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors border-b border-white/5">
                  <td className="py-4 px-6 text-white/80 font-medium">Real-time Telemetry</td>
                  <td className="py-4 px-6 text-[#00F0FF]">Socket.io</td>
                  <td className="py-4 px-6 text-white/50">Live dashboard streaming (with HTTP Polling fallback)</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors border-b border-white/5">
                  <td className="py-4 px-6 text-white/80 font-medium">AI & Video Generation</td>
                  <td className="py-4 px-6 text-[#00F0FF]">Gemini API, WebCodecs, TTS</td>
                  <td className="py-4 px-6 text-white/50">Script generation, browser rendering, and voice synthesis</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Architecture & How It Works */}
        <section id="architecture" className="scroll-mt-24 space-y-16">
          <div className="space-y-12">
            <div>
              <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-3">
                Deep Dive
                <div className="h-px bg-white/20 w-20"></div>
              </div>
              <h2 className="text-2xl md:text-4xl font-black tracking-tight font-outfit mb-6">
                How It Works (Under the Hood)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
              <div className="space-y-6">
                <div className="bg-[#111] border border-white/5 p-6 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Code2 className="w-24 h-24" />
                  </div>
                  <h3 className="text-xl font-bold font-outfit mb-4 text-[#00F0FF]">1. AST Instrumentation</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-4">
                    The compiler utilizes <code className="text-[#00F0FF] bg-[#00F0FF]/10 px-1.5 py-0.5 rounded text-xs">@babel/standalone</code> to analyze and instrument code before execution:
                  </p>
                  <ul className="text-sm text-white/50 space-y-3 list-disc pl-4 marker:text-[#00F0FF]">
                    <li><strong className="text-white/80">Variables & Updates:</strong> Wraps assignments to capture pre- and post-values in a timeline log.</li>
                    <li><strong className="text-white/80">Function Boundaries:</strong> Injects <code className="font-mono text-xs text-white/70">__enter</code> and <code className="font-mono text-xs text-white/70">__exit</code> markers.</li>
                    <li><strong className="text-white/80">Control Flow:</strong> Injects trackers for conditions to explain loop steps dynamically.</li>
                  </ul>
                  <div className="mt-6 bg-black border border-white/10 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs font-mono text-white/70 leading-relaxed">
{`export function getStateAtStep(timeline, step) {
  const state = {};
  for (const entry of timeline) {
    if (entry.step > step) break;
    if (entry.type === 'variable') {
      state[entry.name] = entry.value;
    }
  }
  return state;
}`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-[#111] border border-white/5 p-6 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Layout className="w-24 h-24" />
                  </div>
                  <h3 className="text-xl font-bold font-outfit mb-4 text-[#00F0FF]">2. High-Fidelity Rendering</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-4">
                    The video renderer leverages a canvas layout representing memory and code simultaneously:
                  </p>
                  <ul className="text-sm text-white/50 space-y-3 list-disc pl-4 marker:text-[#00F0FF]">
                    <li><strong className="text-white/80">Deterministic Canvas:</strong> FrameRecorder runs deterministically at precise increments (e.g. 30 FPS).</li>
                    <li><strong className="text-white/80">Cinematic Movements:</strong> GSAP and Anime.js animations dynamically keyed to the narration duration.</li>
                    <li><strong className="text-white/80">Client-side Muxing:</strong> WebCodecs encodes frames into video, merged with synthetic audio into a <code className="font-mono text-xs text-white/70">.webm</code>.</li>
                  </ul>
                </div>

                <div className="bg-[#111] border border-white/5 p-6 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Network className="w-24 h-24" />
                  </div>
                  <h3 className="text-xl font-bold font-outfit mb-4 text-[#00F0FF]">3. Serverless Resilience</h3>
                  <ul className="text-sm text-white/50 space-y-3 list-disc pl-4 marker:text-[#00F0FF]">
                    <li><strong className="text-white/80">Database Pooling:</strong> MongoDB clients cached to prevent exhaustively opening connections during Vercel cold starts.</li>
                    <li><strong className="text-white/80">Socket.io Fail-Safe:</strong> Skips sockets on Vercel, falling back to HTTP polling.</li>
                    <li><strong className="text-white/80">Smart API Fallbacks:</strong> Failovers for Gemini API limits and TTS engine availability.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Workspace Map */}
        <section className="space-y-8">
          <div>
            <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-3">
              Repository
              <div className="h-px bg-white/20 w-20"></div>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight font-outfit">
              Workspace Structure
            </h2>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 md:p-8 font-mono text-sm overflow-x-auto">
            <div className="flex flex-col gap-1 text-white/60 min-w-max">
              <div className="text-[#00F0FF] font-bold">time-rewind-dev/</div>
              <div className="flex items-center gap-2 pl-4"><span className="text-white/30">├──</span> <span className="text-white">api/</span> <span className="text-white/40 ml-4 hidden md:inline"># Vercel Serverless Handler</span></div>
              <div className="flex items-center gap-2 pl-4"><span className="text-white/30">├──</span> <span className="text-white">config/</span> <span className="text-white/40 ml-4 hidden md:inline"># DB & Environment Configuration</span></div>
              <div className="flex items-center gap-2 pl-4"><span className="text-white/30">├──</span> <span className="text-white">controllers/</span> <span className="text-white/40 ml-4 hidden md:inline"># REST API Endpoint Controllers</span></div>
              <div className="flex items-center gap-2 pl-4"><span className="text-white/30">├──</span> <span className="text-white">models/</span> <span className="text-white/40 ml-4 hidden md:inline"># MongoDB DB Mongoose Schemas</span></div>
              <div className="flex items-center gap-2 pl-4"><span className="text-white/30">├──</span> <span className="text-white">routes/</span> <span className="text-white/40 ml-4 hidden md:inline"># Express API Route Registries</span></div>
              <div className="flex items-center gap-2 pl-4"><span className="text-white/30">├──</span> <span className="text-white">services/</span> <span className="text-white/40 ml-4 hidden md:inline"># Pure Logic Service Layer (Gemini integrations)</span></div>
              <div className="flex items-center gap-2 pl-4"><span className="text-white/30">├──</span> <span className="text-white">src/</span> <span className="text-[#00F0FF] ml-4 hidden md:inline"># React Frontend App</span></div>
              <div className="flex items-center gap-2 pl-12"><span className="text-white/30">├──</span> <span className="text-white">components/</span> <span className="text-white/40 ml-4 hidden md:inline"># Frontend Reusable Components</span></div>
              <div className="flex items-center gap-2 pl-12"><span className="text-white/30">├──</span> <span className="text-white">hooks/</span> <span className="text-white/40 ml-4 hidden md:inline"># Custom Hooks</span></div>
              <div className="flex items-center gap-2 pl-12"><span className="text-white/30">├──</span> <span className="text-white">lib/</span> <span className="text-white/40 ml-4 hidden md:inline"># Client-side Core Logic (timeTravel, videoRenderer)</span></div>
              <div className="flex items-center gap-2 pl-12"><span className="text-white/30">└──</span> <span className="text-white">pages/</span> <span className="text-white/40 ml-4 hidden md:inline"># App Pages (Main Index, Admin Control Center)</span></div>
              <div className="flex items-center gap-2 pl-4"><span className="text-white/30">├──</span> <span className="text-white">vercel.json</span> <span className="text-white/40 ml-4 hidden md:inline"># Vercel routing & rewrite rules</span></div>
              <div className="flex items-center gap-2 pl-4"><span className="text-white/30">└──</span> <span className="text-white">package.json</span> <span className="text-white/40 ml-4 hidden md:inline"># Monorepo dependencies</span></div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Trace;
