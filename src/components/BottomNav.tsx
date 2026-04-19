import { Home, User, LayoutGrid, Briefcase, Phone } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: User, label: "About", path: "/about/" },
  { icon: LayoutGrid, label: "Feed", path: "/feed/" },
  { icon: Briefcase, label: "Portfolio", path: "/portfolio/" },
  { icon: Phone, label: "Contact", path: "/contact/" },
];

const BottomNav = () => {
  const location = useLocation();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    // Capture scroll events from both window and internal scroll containers (like Feed's snapping container)
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      let currentScrollY = 0;
      
      if (target === document) {
        currentScrollY = window.scrollY;
      } else if (target.scrollTop !== undefined) {
        // Ignore small scroll containers (like the comments section)
        if (target.clientHeight < window.innerHeight * 0.5) return;
        currentScrollY = target.scrollTop;
      } else {
        return;
      }

      // 5px threshold to avoid jitter
      if (location.pathname === "/feed/") {
        if (currentScrollY > lastScrollY.current + 5) {
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY.current - 5) {
          setIsVisible(true);
        }
      } else {
         setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, true);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [location.pathname]);

  // Ensure it resets to visible when path changes
  useEffect(() => {
    if (location.pathname !== "/feed/") setIsVisible(true);
  }, [location.pathname]);

  return (
    <>
      {/* Living Cursor (Global Fixed Dot) */}
      <div 
        className={`fixed pointer-events-none transition-opacity duration-500 ease-out z-[99999] ${isNavHovered ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          left: hoveredRect ? (hoveredRect.left + hoveredRect.width / 2) : mousePos.x,
          top: hoveredRect ? (hoveredRect.top + hoveredRect.height / 2) : mousePos.y,
          transform: 'translate(-50%, -50%)',
          transition: 'left 0.4s cubic-bezier(0.19, 1, 0.22, 1), top 0.4s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.5s'
        }}
      >
        {/* The Aura Glow */}
        <div className={`rounded-full bg-red-600/20 blur-3xl transition-all duration-700 ${hoveredRect ? 'w-[180px] h-[180px] opacity-60' : 'w-[80px] h-[80px] opacity-30'}`} />
        
        {/* The Pulsing Core Dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-600 rounded-full shadow-[0_0_20px_#CB2729] animate-pulse" />
      </div>

      <nav 
        onMouseEnter={() => setIsNavHovered(true)}
        onMouseLeave={() => { setIsNavHovered(false); setHoveredRect(null); }}
        className={`fixed bottom-0 left-0 right-0 h-20 bg-[#0a0a0a]/90 backdrop-blur-2xl border-t border-white/10 z-[8888] font-poppins transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-[120%] opacity-0"
        }`}
      >
        <div className="flex items-center justify-around h-full max-w-4xl mx-auto px-6 relative">
          {navItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;

            return (
              <Link
                key={label}
                to={path}
                onMouseEnter={(e) => setHoveredRect(e.currentTarget.getBoundingClientRect())}
                onMouseLeave={() => setHoveredRect(null)}
                className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative group ${
                  isActive ? "text-red-500 scale-110" : "text-white/40 hover:text-white"
                }`}
              >
                <div className="relative z-20">
                  <Icon 
                      size={20} 
                      className={`transition-all duration-300 ${isActive ? "drop-shadow-[0_0_12px_rgba(203,39,41,0.9)]" : ""}`} 
                  />
                </div>
                <span className={`text-[10px] font-medium uppercase tracking-[0.1em] z-20 transition-colors duration-300 ${isActive ? "text-red-500" : "text-white/40"}`}>
                  {label}
                </span>

                {/* Vertical Beam on Hover (Synchronized with aura snap) */}
                <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-[1px] h-8 bg-gradient-to-t from-red-600/40 to-transparent transition-opacity duration-300 ${hoveredRect && isActive ? 'opacity-100' : 'opacity-0'}`} />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
