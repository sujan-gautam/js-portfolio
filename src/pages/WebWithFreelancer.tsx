import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { 
  ArrowUpRight, 
  Lock, 
  Globe, 
  Users, 
  Briefcase, 
  CheckCircle, 
  GraduationCap, 
  Building, 
  FileText, 
  Layers, 
  ShoppingBag, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface ClientSite {
  id: string;
  name: string;
  category: string;
  url: string;
  displayUrl: string;
  description: string;
  type: 'ecommerce' | 'education' | 'business' | 'other';
  stats: string;
  tech: string[];
}

const clientSites: ClientSite[] = [
  {
    id: 'ricenepal',
    name: 'Rice Nepal',
    category: 'E-commerce Platform',
    url: 'https://ricenepal.com/',
    displayUrl: 'ricenepal.com',
    description: 'A custom, scalable e-commerce store optimized for local agriculture and bulk grain distribution. Developed with intuitive ordering workflows, fast-loading product catalogues, and responsive layouts to handle rural-to-urban supply chain networks.',
    type: 'ecommerce',
    stats: '1,200+ Products Catalogued',
    tech: ['HTML5', 'Tailwind CSS', 'React.js', 'Node.js', 'MongoDB']
  },
  {
    id: 'himalayan',
    name: 'Himalayan Spirit Academy',
    category: 'Education Portal',
    url: 'https://himalayanspiritacademy.edu.np/',
    displayUrl: 'himalayanspiritacademy.edu.np',
    description: 'An educational management and information website built for a prominent academy in Nepal. Features clean, structured pages for course programs, administration updates, admission forms, and dynamic announcements to bridge communication with students and parents.',
    type: 'education',
    stats: '1,500+ Active Students & Alumni',
    tech: ['React.js', 'Express', 'MySQL', 'Vanilla CSS', 'Responsive Grid']
  },
  {
    id: 'soundhealing',
    name: 'Sound Healing Nepal',
    category: 'Business & Wellness',
    url: 'https://soundhealingnepal.com/',
    displayUrl: 'soundhealingnepal.com',
    description: 'A professional business website showcasing wellness therapy, acoustic meditation services, and practitioner training courses. Incorporates serene layouts, booking enquiry funnels, and optimized media hosting to present premium therapy offerings.',
    type: 'business',
    stats: '92% Online Booking Conversion Increase',
    tech: ['HTML5/JS', 'Tailwind CSS', 'Vite', 'Formspree API']
  },
  {
    id: 'lasttransit',
    name: 'Last Transit',
    category: 'Business & Logistics',
    url: 'https://lasttransit.com/',
    displayUrl: 'lasttransit.com',
    description: 'A robust corporate portal for logistics, transport, and delivery operations. Designed to highlight fleet management services, secure contact channels, service portfolios, and track-and-trace inquiries with clean, modern enterprise aesthetics.',
    type: 'business',
    stats: 'Real-time corporate inquiries system',
    tech: ['React.js', 'Node.js', 'Tailwind CSS', 'REST API']
  }
];

const WebWithFreelancer = () => {
  const [activeSite, setActiveSite] = useState<string>('ricenepal');

  useEffect(() => {
    // Smooth scroll for anchor links
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const currentSite = clientSites.find(site => site.id === activeSite);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden selection:bg-[#CB2729] selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <SEO 
        title="WebWithFreelancer — Project Showcase | Sujan Gautam" 
        description="A student-led digital agency designing and deploying 24+ websites across Nepal for schools, businesses, and news companies."
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
          <li><a href="#case-study" className="font-mono text-[11px] tracking-[0.06em] text-white/50 uppercase hover:text-white transition-colors">Case Study</a></li>
          <li><a href="#previews" className="font-mono text-[11px] tracking-[0.06em] text-white/50 uppercase hover:text-white transition-colors">Live Previews</a></li>
          <li><a href="#features" className="font-mono text-[11px] tracking-[0.06em] text-white/50 uppercase hover:text-white transition-colors">Agency Operations</a></li>
          <li><a href="#stack" className="font-mono text-[11px] tracking-[0.06em] text-white/50 uppercase hover:text-white transition-colors">Stack</a></li>
        </ul>
        <Link to="/" className="md:hidden font-mono text-[11px] tracking-[0.06em] text-[#CB2729] hover:text-white uppercase transition-colors">Back</Link>
      </nav>

      <main className="relative z-10 pt-32 pb-24 md:pt-40 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto space-y-32">
        
        {/* Hero */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] text-[#CB2729] uppercase mb-8">
            <span className="w-6 h-px bg-[#CB2729]"></span>
            Student-Led Digital Agency
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-[80px] font-black leading-[0.95] tracking-tight mb-8 font-outfit">
            WebWith<br />
            <em className="not-italic text-transparent" style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.2)' }}>Freelancer</em>
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif" }} className="text-white/55 text-[15px] md:text-[17px] max-w-[550px] leading-[1.75] font-normal tracking-[0.01em]">
            A dynamic web development agency designed, launched, and managed during high school. Led a team of 5+ students to construct, deploy, and maintain 24+ client projects across Nepal with high client satisfaction.
          </p>
          
          <div className="flex flex-wrap items-center gap-6 mt-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-green-500/40 rounded text-green-500 font-mono text-[11px] tracking-[0.05em]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)] animate-pulse"></span>
              92% Service Renewal
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/20 rounded text-white/60 font-mono text-[11px] tracking-[0.05em]">
              24+ Projects Completed
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#CB2729]/40 rounded text-[#CB2729] font-mono text-[11px] tracking-[0.05em]">
              5+ Student Team
            </div>
          </div>
        </section>

        {/* Live Previews Section */}
        <section id="previews" className="scroll-mt-24 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-3">
                Live Previews
                <div className="h-px bg-white/20 w-20"></div>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight font-outfit">
                Client Deployments
              </h2>
            </div>
            <p className="text-[13px] text-white/40 max-w-[400px] leading-[1.6]" style={{ fontFamily: "'Inter', sans-serif" }}>
              Explore the live versions of selective e-commerce portals, educational platforms, and business systems designed and hosted under the agency banner.
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
            {clientSites.map((site) => (
              <button
                key={site.id}
                onClick={() => setActiveSite(site.id)}
                className={`px-4 py-2 rounded text-xs font-mono tracking-wider transition-all duration-300 ${
                  activeSite === site.id
                    ? 'bg-[#CB2729] text-white font-semibold'
                    : 'bg-[#111] text-white/60 hover:text-white hover:bg-white/5 border border-white/5'
                }`}
              >
                {site.name}
              </button>
            ))}
            <button
              onClick={() => setActiveSite('others')}
              className={`px-4 py-2 rounded text-xs font-mono tracking-wider transition-all duration-300 ${
                activeSite === 'others'
                  ? 'bg-white/20 text-white font-semibold'
                  : 'bg-[#111] text-white/60 hover:text-white hover:bg-white/5 border border-white/5'
              }`}
            >
              And 20+ More... (Etc.)
            </button>
          </div>

          {activeSite !== 'others' && currentSite ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Browser Iframe Preview */}
              <div className="lg:col-span-2 border border-white/20 rounded-lg overflow-hidden bg-[#0c0c0e] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_32px_80px_rgba(0,0,0,0.6),0_0_120px_rgba(203,39,41,0.05)]">
                <div className="flex items-center gap-3 px-4 py-3 bg-[#111] border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]"></div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center justify-between bg-black border border-white/10 rounded px-3 py-1.5 font-mono text-[11px] text-white/50 w-full max-w-[420px]">
                      <div className="flex items-center gap-2 overflow-hidden truncate">
                        <Lock size={10} className="text-green-500 flex-shrink-0" />
                        <span className="truncate">{currentSite.url}</span>
                      </div>
                      <a 
                        href={currentSite.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-white/40 hover:text-white transition-colors"
                      >
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="relative w-full aspect-video overflow-hidden bg-[#0a0a0a]">
                  <iframe 
                    src={currentSite.url} 
                    className="w-full h-full border-0 absolute inset-0 z-10"
                    title={`${currentSite.name} Live Preview`}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  />
                </div>
              </div>

              {/* Site Details Card */}
              <div className="bg-[#0f0f12] border border-white/10 rounded-lg p-6 lg:p-8 space-y-6">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-[#CB2729] uppercase">{currentSite.category}</span>
                  <h3 className="text-2xl font-bold tracking-tight mt-1 font-outfit">{currentSite.name}</h3>
                </div>

                <hr className="border-white/10" />

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-white/30">Description</span>
                    <p className="text-[13.5px] text-white/60 leading-[1.65]" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {currentSite.description}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-white/30">Impact / Stats</span>
                    <p className="text-[13.5px] text-white/80 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {currentSite.stats}
                    </p>
                  </div>
                </div>

                <hr className="border-white/10" />

                <div>
                  <span className="text-[10px] font-mono uppercase text-white/30 block mb-2">Technologies Used</span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentSite.tech.map((t, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-1 bg-black border border-white/10 rounded font-mono text-[10px] text-white/60"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <a 
                  href={currentSite.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#CB2729] hover:bg-[#a01c1e] text-white font-mono text-xs tracking-wider uppercase rounded transition-colors"
                >
                  Visit Live Project <ArrowUpRight size={13} />
                </a>
              </div>
            </div>
          ) : (
            /* Etc Fallback Grid for Other Sites */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
              <div className="bg-[#111] border border-white/10 rounded-lg p-8 hover:border-white/20 transition-all duration-300">
                <div className="w-10 h-10 border border-white/10 rounded-md flex items-center justify-center bg-black mb-6 text-[#CB2729]">
                  <Building size={18} />
                </div>
                <h4 className="text-lg font-bold tracking-tight mb-3 font-outfit">Local Industries & Factories</h4>
                <p className="text-[13px] text-white/50 leading-[1.6]" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Designed and configured customized portfolios for manufacturing companies, brick factories, and agro-industries across Nepal, showcasing machinery catalogs and contact routes.
                </p>
                <div className="mt-6 pt-4 border-t border-white/5 font-mono text-[10px] text-white/30">
                  6+ Projects Deployed
                </div>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-lg p-8 hover:border-white/20 transition-all duration-300">
                <div className="w-10 h-10 border border-white/10 rounded-md flex items-center justify-center bg-black mb-6 text-[#CB2729]">
                  <FileText size={18} />
                </div>
                <h4 className="text-lg font-bold tracking-tight mb-3 font-outfit">Local News & Media Portals</h4>
                <p className="text-[13px] text-white/50 leading-[1.6]" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Built fast-rendering news and media websites equipped with custom categorization systems, ad spaces, and content feeds optimized for rural connection speeds.
                </p>
                <div className="mt-6 pt-4 border-t border-white/5 font-mono text-[10px] text-white/30">
                  4+ Portals Deployed
                </div>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-lg p-8 hover:border-white/20 transition-all duration-300">
                <div className="w-10 h-10 border border-white/10 rounded-md flex items-center justify-center bg-black mb-6 text-[#CB2729]">
                  <GraduationCap size={18} />
                </div>
                <h4 className="text-lg font-bold tracking-tight mb-3 font-outfit">Schools & Training Facilities</h4>
                <p className="text-[13px] text-white/50 leading-[1.6]" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Constructed digital interfaces for community schools, boarding institutions, and language classes to facilitate announcements, syllabus downloads, and class schedules.
                </p>
                <div className="mt-6 pt-4 border-t border-white/5 font-mono text-[10px] text-white/30">
                  5+ Portals Deployed
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/20 border border-white/20 rounded-lg overflow-hidden">
          {[
            { num: '24', symbol: '+', label: 'Websites Deployed' },
            { num: '92', symbol: '%', label: 'Service Renewal Rate' },
            { num: '5', symbol: '+', label: 'Student Onboarded' },
            { num: '100', symbol: '%', label: 'On-Time Client Delivery' }
          ].map((stat, i) => (
            <div key={i} className="bg-[#111] p-8 text-center flex flex-col justify-center">
              <div className="text-4xl md:text-5xl font-black tracking-tight mb-2 font-outfit">
                {stat.num}
                {stat.symbol && <span className="text-[#CB2729]">{stat.symbol}</span>}
              </div>
              <div className="font-mono text-[10px] text-white/50 uppercase tracking-[0.1em]">
                {stat.label}
              </div>
            </div>
          ))}
        </section>

        {/* Case Study / Project Breakdown */}
        <section id="case-study">
          <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-12">
            Case Study
            <div className="h-px bg-white/20 w-20"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Breakdown */}
            <div className="bg-[#111] border border-white/10 rounded-lg p-8 hover:border-white/20 transition-colors">
              <h3 className="text-[17px] font-semibold tracking-tight mb-4 flex items-center gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                <span className="w-2 h-2 rounded-full bg-[#CB2729]"></span>
                Project Breakdown
              </h3>
              <p className="text-[13.5px] text-white/60 leading-[1.75] font-normal" style={{ fontFamily: "'Inter', sans-serif" }}>
                WebWithFreelancer was established during high school to bring professional web services to small businesses, schools, and local organizations. By building lightweight, robust web systems, the agency scaled to accommodate dozens of concurrent sites, growing into a structured team operation.
              </p>
            </div>

            {/* Problems */}
            <div className="bg-[#111] border border-white/10 rounded-lg p-8 hover:border-white/20 transition-colors">
              <h3 className="text-[17px] font-semibold tracking-tight mb-4 flex items-center gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                <span className="w-2 h-2 rounded-full bg-[#CB2729]"></span>
                Problems Faced
              </h3>
              <p className="text-[13.5px] text-white/60 leading-[1.75] font-normal" style={{ fontFamily: "'Inter', sans-serif" }}>
                Managing multiple, divergent client specifications as a student developer is extremely challenging. Balancing academic priorities with requirements gathering, deployment schedules, and maintenance requests made it necessary to scale beyond a single-person operation.
              </p>
            </div>

            {/* Solutions */}
            <div className="bg-[#111] border border-white/10 rounded-lg p-8 hover:border-white/20 transition-colors">
              <h3 className="text-[17px] font-semibold tracking-tight mb-4 flex items-center gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Solutions Delivered
              </h3>
              <p className="text-[13.5px] text-white/60 leading-[1.75] font-normal" style={{ fontFamily: "'Inter', sans-serif" }}>
                Created WebWithFreelancer, onboarding 5+ capable high school students. Designed a shared workflow for gathering requirements, distributing development blocks, reviewing code quality, and delivering hosting packages. This structured division of labor secured a 92% recurring renewal rate.
              </p>
            </div>
          </div>
        </section>

        {/* Features / Operations */}
        <section id="features">
          <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-12">
            Operations & Services
            <div className="h-px bg-white/20 w-20"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/10 border border-white/10 rounded-lg overflow-hidden">
            {[
              { id: '01', icon: <Users size={18} />, title: 'Student Team Coordination', desc: 'Onboarded and managed 5+ high school students, dividing development tasks based on individual strengths and ensuring alignment with quality guidelines.' },
              { id: '02', icon: <Globe size={18} />, title: 'Multi-Industry Deployment', desc: 'Delivered web architectures tailored for local businesses, schools, wellness centres, and news portals across Nepal.' },
              { id: '03', icon: <Briefcase size={18} />, title: 'Client Requirement Gathering', desc: 'Collaborated directly with organization owners to translate local constraints and business goals into technical specifications.' },
              { id: '04', icon: <CheckCircle size={18} />, title: 'Quality Assurance Control', desc: 'Conducted systematic manual testing and design review audits to ensure all projects were launched bug-free and performed well on local mobile speeds.' },
              { id: '05', icon: <Layers size={18} />, title: 'Concurrent Project Scoping', desc: 'Implemented agile scheduling and task boards to run several web builds in parallel, ensuring on-time launch delivery.' },
              { id: '06', icon: <Sparkles size={18} />, title: 'Post-Launch Retention & Support', desc: 'Managed server configuration, domain renewal setups, and ongoing code maintenance, cementing a 92% service renewal rate.' },
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
            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-4 font-outfit">
              Scalable Web<br />Delivery.
            </h2>
            <p className="text-[13.5px] text-white/50 leading-[1.75] font-normal max-w-[380px]" style={{ fontFamily: "'Inter', sans-serif" }}>
              To ensure on-time delivery across multiple client categories, we utilized lightweight frontend architectures, reliable server integrations, and clean code principles.
            </p>
          </div>
          
          <div className="flex flex-col gap-1.5">
            {[
              { name: 'HTML5 / CSS3 / Vanilla JS', cat: 'Core Web Layouts' },
              { name: 'React.js & Vite', cat: 'Modern Component Apps' },
              { name: 'Tailwind CSS', cat: 'Rapid Visual Styling' },
              { name: 'Node.js & Express', cat: 'Corporate APIs' },
              { name: 'MySQL & MongoDB', cat: 'Database Management' },
              { name: 'Shared Team Git Workflows', cat: 'Code Integration' },
              { name: 'Web Hosting & Domain DNS', cat: 'Launch Infrastructure' },
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
          © {new Date().getFullYear()} — WebWithFreelancer.
        </div>
        <div className="flex items-center gap-6">
          <Link to="/" className="font-mono text-[11px] text-white/50 hover:text-white transition-colors">
            ← Back to Portfolio
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default WebWithFreelancer;
