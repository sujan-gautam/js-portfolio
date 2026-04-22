import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { settingsDB } from "@/lib/adminData";
import {
  LayoutDashboard, User, GraduationCap, Image, SlidersHorizontal,
  Briefcase, Gamepad2, Video, Wrench, BookOpen, MessageSquare,
  Megaphone, Mail, Eye, Users, Smartphone, Heart, Sparkles,
  Settings, Music, RefreshCw, ExternalLink, Menu, X, ChevronRight, Code,
  Bell, Search, UserCircle, ShieldCheck, DollarSign, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { group: "Overview", items: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { label: "Visitors", icon: Eye, path: "/admin/visitors" },
  ]},
  { group: "Identity", items: [
    { label: "About Info", icon: User, path: "/admin/about" },
    { label: "Education", icon: GraduationCap, path: "/admin/education" },
    { label: "Global Skills", icon: Code, path: "/admin/skills" },
  ]},
  { group: "Project Hub", items: [
    { label: "Portfolio", icon: Briefcase, path: "/admin/portfolio" },
    { label: "Fun Archive", icon: Gamepad2, path: "/admin/funwork" },
  ]},
  { group: "Relay", items: [
    { label: "Public Feed", icon: Image, path: "/admin/feed" },
    { label: "Stories", icon: BookOpen, path: "/admin/story" },
    { label: "Enquiries", icon: Mail, path: "/admin/contact" },
  ]},
  { group: "System", items: [
    { label: "Settings", icon: Settings, path: "/admin/settings" },
    { label: "Music", icon: Music, path: "/admin/music" },
    { label: "Users", icon: Users, path: "/admin/users" },
  ]}
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminLogo, setAdminLogo] = useState<string | null>(null);
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Open sidebar by default on large screens
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setSidebarOpen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    settingsDB.get().then(s => {
      if (s?.adminLogo) {
        setAdminLogo(s.adminLogo);
      } else {
        setAdminLogo("/assets/logo.png");
      }
    });
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  // Close sidebar on mobile when navigating
  const handleNavClick = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#fafafa] text-slate-900 font-inter overflow-hidden admin-panel">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "h-full flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-30 overflow-y-auto scrollbar-none",
          // On mobile: fixed overlay sidebar
          "fixed lg:relative top-0 left-0",
          sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:w-0 lg:translate-x-0 lg:overflow-hidden"
        )}
      >
        <div className="flex items-center justify-between px-4 h-16 shrink-0 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {adminLogo ? (
              <img src={adminLogo} alt="Logo" className="h-7 w-auto object-contain" />
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-lg shadow-black/10 relative overflow-hidden group">
                  <div className="flex items-center justify-center h-full w-full">
                    <span className="text-white font-black italic text-lg -translate-x-[2px] -translate-y-[1px]">S</span>
                    <span className="text-[#CB2729] font-black italic text-lg translate-x-[2px] translate-y-[1px]">G</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900 tracking-tight">Sujan Admin</span>
              </div>
            )}
          </div>
          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-6">
          {navItems.map((group) => (
            <div key={group.group} className="space-y-1">
               <h3 className="px-3 text-xs font-semibold text-slate-500 mb-2">{group.group}</h3>
               {group.items.map((item) => {
                 const active = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path));
                 return (
                   <Link
                     key={item.label}
                     to={item.path}
                     onClick={handleNavClick}
                     className={cn(
                       "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mb-0.5",
                       active
                         ? "bg-slate-100 text-slate-900"
                         : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                     )}
                   >
                     <item.icon size={16} className={cn("shrink-0", active ? "text-slate-900" : "text-slate-500")} />
                     <span>{item.label}</span>
                   </Link>
                 );
               })}
            </div>
          ))}
        </nav>

        {/* Logout at bottom */}
        <div className="p-4 border-t border-slate-100 mt-auto">
           <button 
             onClick={handleLogout}
             className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors group"
           >
              <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
              <span>Log Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setSidebarOpen(!sidebarOpen)} 
               className="p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
             >
               <Menu size={20} />
             </button>
             
             <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />
             
             <Link to="/" target="_blank" className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md text-sm font-medium transition-colors group">
                <span>View Site</span>
                <ExternalLink size={14} className="text-slate-400 group-hover:text-slate-600" />
             </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-5">
             <div className="flex items-center gap-2 sm:gap-3 cursor-pointer p-1.5 rounded-md transition-colors hover:bg-slate-50">
                <div className="hidden sm:flex flex-col items-end">
                   <span className="text-sm font-medium text-slate-900 leading-none">sujan gautam</span>
                   <span className="text-xs text-slate-500 mt-1">Super Admin</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 text-xs font-semibold border border-slate-200">SG</div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-slate-200 scroll-smooth bg-[#fafafa]">
           <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
