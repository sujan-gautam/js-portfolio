import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { ArrowUpRight, Lock, Wrench, Package, Receipt, Search, UserCheck, Cloud } from 'lucide-react';

const TechyPos = () => {
  useEffect(() => {
    // Smooth scroll for anchor links
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden selection:bg-[#CB2729] selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <SEO 
        title="Techy MS — Project Showcase | Sujan Gautam" 
        description="A full-stack repair management platform built for Techy franchise stores — handling job tracking, live stock, and technician accountability in one system."
      />
      
      {/* Noise Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
      />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-12 bg-black/80 backdrop-blur-md border-b border-white/10">
        <Link to="/" className="font-mono text-xs font-medium tracking-[0.08em] text-white/50 uppercase hover:text-white transition-colors">
          <span className="text-[#CB2729]">{'//'}</span> project showcase
        </Link>
        <ul className="hidden md:flex gap-8 list-none">
          <li><a href="#features" className="font-mono text-[11px] tracking-[0.06em] text-white/50 uppercase hover:text-white transition-colors">Features</a></li>
          <li><a href="#stack" className="font-mono text-[11px] tracking-[0.06em] text-white/50 uppercase hover:text-white transition-colors">Stack</a></li>
          <li><a href="#preview" className="font-mono text-[11px] tracking-[0.06em] text-white/50 uppercase hover:text-white transition-colors">Preview</a></li>
        </ul>
        <Link to="/" className="md:hidden font-mono text-[11px] tracking-[0.06em] text-[#CB2729] hover:text-white uppercase transition-colors">Back</Link>
      </nav>

      <main className="relative z-10 pt-32 pb-24 md:pt-40 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto space-y-32">
        
        {/* Hero */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] text-[#CB2729] uppercase mb-8">
            <span className="w-6 h-px bg-[#CB2729]"></span>
            Internal Platform · SaaS
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-[80px] font-black leading-[0.95] tracking-tight mb-8">
            Techy<br />
            <em className="not-italic text-transparent" style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.2)' }}>POS &amp;</em><br />
            Inventory
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif" }} className="text-white/55 text-[15px] md:text-[17px] max-w-[480px] leading-[1.75] font-normal tracking-[0.01em]">
            A full-stack repair management platform built for Techy franchise stores — handling job tracking, live stock, and technician accountability in one system.
          </p>
          
          <div className="flex flex-wrap items-center gap-6 mt-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-green-500/40 rounded text-green-500 font-mono text-[11px] tracking-[0.05em]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)] animate-pulse"></span>
              Production Live
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/20 rounded text-white/60 font-mono text-[11px] tracking-[0.05em]">
              2 Locations
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/20 rounded text-white/60 font-mono text-[11px] tracking-[0.05em]">
              2 Client Stores
            </div>
            <a 
              href="https://www.techyms.com/" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#CB2729] text-white font-mono text-[11px] font-semibold tracking-[0.08em] uppercase rounded hover:bg-[#a01c1e] transition-colors"
            >
              <ArrowUpRight size={14} /> Visit Live Site
            </a>
          </div>
        </section>

        {/* Browser Preview */}
        <section id="preview" className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="border border-white/20 rounded-lg overflow-hidden bg-[#0c0c0e] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_32px_80px_rgba(0,0,0,0.6),0_0_120px_rgba(203,39,41,0.05)]">
            <div className="flex items-center gap-3 px-4 py-3 bg-[#111] border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]"></div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 bg-black border border-white/10 rounded px-3 py-1.5 font-mono text-[11px] text-white/50 w-full max-w-[360px]">
                  <Lock size={10} className="text-green-500" />
                  www.techyms.com
                </div>
              </div>
            </div>
            <div className="relative w-full pt-[56.25%] overflow-hidden bg-[#0a0a0a]">
              <iframe
                src="https://www.techyms.com/"
                title="Techy MS Live Preview"
                loading="lazy"
                sandbox="allow-scripts allow-same-origin"
                className="absolute top-0 left-0 w-[150%] h-[150%] border-none pointer-events-none"
                style={{ transform: 'scale(0.667)', transformOrigin: 'top left' }}
              ></iframe>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black pointer-events-none opacity-60"></div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/20 border border-white/20 rounded-lg overflow-hidden">
          {[
            { num: '2', symbol: '+', label: 'Store Locations' },
            { symbol: '~', num: '0s', label: 'Inventory Sync Lag' },
            { num: '100', symbol: '%', label: 'Audit Coverage' },
            { num: '1', symbol: 'x', label: 'SaaS Deployment' }
          ].map((stat, i) => (
            <div key={i} className="bg-[#111] p-8 text-center flex flex-col justify-center">
              <div className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                {stat.symbol && stat.num.includes('s') === false && stat.symbol === '~' && <span className="text-[#CB2729]">{stat.symbol}</span>}
                {stat.num}
                {stat.symbol && stat.symbol !== '~' && <span className="text-[#CB2729]">{stat.symbol}</span>}
              </div>
              <div className="font-mono text-[10px] text-white/50 uppercase tracking-[0.1em]">
                {stat.label}
              </div>
            </div>
          ))}
        </section>

        {/* Case Study / Project Breakdown */}
        <section id="case-study" className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-12">
            Case Study
            <div className="h-px bg-white/20 w-20"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Breakdown */}
            <div className="bg-[#111] border border-white/10 rounded-lg p-8 hover:border-white/20 transition-colors">
              <h3 className="font-outfit text-xl font-bold tracking-tight mb-4 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#CB2729]"></span>
                Project Breakdown
              </h3>
              <p className="text-[13.5px] text-white/60 leading-[1.75] font-normal" style={{ fontFamily: "'Inter', sans-serif" }}>
                The Techy franchise needed a unified system to handle repair tickets, customer checkouts, and component inventory. We mapped their entire physical workflow into a digital SaaS product, effectively linking the front counter POS with the back-room technician desks.
              </p>
            </div>

            {/* Problems */}
            <div className="bg-[#111] border border-white/10 rounded-lg p-8 hover:border-white/20 transition-colors">
              <h3 className="font-outfit text-xl font-bold tracking-tight mb-4 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#CB2729]"></span>
                Problems Faced
              </h3>
              <p className="text-[13.5px] text-white/60 leading-[1.75] font-normal" style={{ fontFamily: "'Inter', sans-serif" }}>
                Staff were dealing with out-of-sync inventory numbers because parts used in repairs weren't immediately deducted from the POS system. Furthermore, lacking an audit trail meant it was nearly impossible to track misallocated parts or assign accountability across different shifts.
              </p>
            </div>

            {/* Solutions */}
            <div className="bg-[#111] border border-white/10 rounded-lg p-8 hover:border-white/20 transition-colors">
              <h3 className="font-outfit text-xl font-bold tracking-tight mb-4 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Solutions Delivered
              </h3>
              <p className="text-[13.5px] text-white/60 leading-[1.75] font-normal" style={{ fontFamily: "'Inter', sans-serif" }}>
                We engineered an atomic transaction pipeline connecting MongoDB (for flexible repair job states) and MySQL (for rigid inventory counts). Implementing WebSockets ensured live stock updates globally, while strict JWT-based role logging created a 100% auditable history of every part movement.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features">
          <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-12">
            Core Features
            <div className="h-px bg-white/20 w-20"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/10 border border-white/10 rounded-lg overflow-hidden">
            {[
              { id: '01', icon: <Wrench size={18} />, title: 'Repair Job Tracking', desc: 'End-to-end job lifecycle management — from customer intake to device-out. Technicians update job states in real time, keeping customers and staff always in sync.' },
              { id: '02', icon: <Package size={18} />, title: 'Live Inventory Management', desc: 'Stock levels update the moment parts are assigned to a job. No manual reconciliation — the system maintains consistency between physical parts and database records automatically.' },
              { id: '03', icon: <Receipt size={18} />, title: 'Point of Sale (POS)', desc: 'Integrated checkout tied directly to job records and inventory. Transactions close jobs, deduct parts, and generate receipts in one operation — no context switching.' },
              { id: '04', icon: <Search size={18} />, title: 'Full Audit Logging', desc: 'Every part movement, status change, and transaction is timestamped and attributed to a specific technician. Designed to prevent part misuse and build accountability into the workflow.' },
              { id: '05', icon: <UserCheck size={18} />, title: 'Technician Workflows', desc: 'Role-based views surface only what each tech needs — active jobs, part requests, and queue position. Reduces noise, speeds up resolution, and eliminates miscommunication between shifts.' },
              { id: '06', icon: <Cloud size={18} />, title: 'Multi-Store SaaS Deployment', desc: 'Deployed as a SaaS product serving 2 independent store locations. Each location operates on isolated data with shared infrastructure — built to scale to additional franchise branches.' },
            ].map((f, i) => (
              <div key={i} className="group relative bg-[#0f0f12] p-8 md:p-10 hover:bg-[#16161b] transition-colors">
                <div className="absolute top-0 left-0 w-0.5 h-0 bg-[#CB2729] transition-all duration-300 group-hover:h-full"></div>
                <div className="font-mono text-[10px] text-white/20 tracking-[0.1em] mb-5">{f.id}</div>
                <div className="w-10 h-10 border border-white/10 rounded-md flex items-center justify-center bg-black mb-6 text-white">
                  {f.icon}
                </div>
                <h3 className="text-[18px] font-semibold tracking-tight mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>{f.title}</h3>
                <p className="text-[13.5px] text-white/50 leading-[1.75] font-normal" style={{ fontFamily: "'Inter', sans-serif" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-t border-white/10 my-12 md:my-20" />

        {/* Stack */}
        <section id="stack" className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-4">
              Built to<br />last at<br />scale.
            </h2>
          <p className="text-[13.5px] text-white/50 leading-[1.75] font-normal max-w-[380px]" style={{ fontFamily: "'Inter', sans-serif" }}>
              The backend is designed around real-time state consistency — repair jobs and stock changes are atomic where they need to be, with a hybrid database approach that plays to each engine's strengths.
            </p>
          </div>
          
          <div className="flex flex-col gap-1.5">
            {[
              { name: 'Node.js', cat: 'Backend Runtime' },
              { name: 'Express.js', cat: 'API Framework' },
              { name: 'MongoDB', cat: 'Job & Audit Store' },
              { name: 'MySQL', cat: 'Inventory & POS Data' },
              { name: 'WebSockets', cat: 'Live Inventory Sync' },
              { name: 'JWT Auth', cat: 'Role-Based Access' },
              { name: 'React', cat: 'Frontend UI' },
              { name: 'SaaS Architecture', cat: 'Multi-Tenant Deployment' },
            ].map((tech, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3.5 border border-white/10 rounded bg-[#111] hover:border-white/30 transition-colors">
                <div className="flex items-center gap-3 font-mono text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CB2729]"></span>
                  {tech.name}
                </div>
                <div className="font-mono text-[10px] text-white/40 tracking-[0.06em] uppercase">
                  {tech.cat}
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-black">
        <div className="font-mono text-[11px] text-white/40">
          © {new Date().getFullYear()} — Techy MS Platform. Internal SaaS Product.
        </div>
        <div className="flex items-center gap-6">
          <Link to="/" className="font-mono text-[11px] text-white/50 hover:text-white transition-colors">
            ← Back to Portfolio
          </Link>
          <a href="https://www.techyms.com/" target="_blank" rel="noreferrer" className="font-mono text-[11px] text-[#CB2729] hover:underline tracking-[0.04em]">
            ↗ techyms.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default TechyPos;
