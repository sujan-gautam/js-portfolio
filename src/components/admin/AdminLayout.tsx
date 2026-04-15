import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard, User, GraduationCap, Image, SlidersHorizontal,
  Briefcase, Gamepad2, Video, Wrench, BookOpen, MessageSquare,
  Megaphone, Mail, Eye, Users, Smartphone, Heart, Sparkles,
  Settings, Music, RefreshCw, ExternalLink, Menu, X, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "About Me", icon: User, path: "/admin/about" },
  { label: "Education", icon: GraduationCap, path: "/admin/education" },
  { label: "Image Feed", icon: Image, path: "/admin/feed" },
  { label: "Sliders", icon: SlidersHorizontal, path: "/admin/sliders" },
  { label: "Portfolio", icon: Briefcase, path: "/admin/portfolio" },
  { label: "Fun Work", icon: Gamepad2, path: "/admin/funwork" },
  { label: "Videos", icon: Video, path: "/admin/videos" },
  { label: "Services", icon: Wrench, path: "/admin/services" },
  { label: "Story", icon: BookOpen, path: "/admin/story" },
  { label: "Popups", icon: MessageSquare, path: "/admin/popups" },
  { label: "ADS", icon: Megaphone, path: "/admin/ads" },
  { label: "Contact", icon: Mail, path: "/admin/contact" },
  { label: "Visitors", icon: Eye, path: "/admin/visitors" },
  { label: "Users", icon: Users, path: "/admin/users" },
  { label: "Apps", icon: Smartphone, path: "/admin/apps" },
  { label: "Customers", icon: Heart, path: "/admin/customers" },
  { label: "What's New", icon: Sparkles, path: "/admin/whatsnew" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
  { label: "Add Music", icon: Music, path: "/admin/music" },
  { label: "Updates", icon: RefreshCw, path: "/admin/updates" },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "h-full flex flex-col border-r border-border bg-card transition-all duration-300 z-30",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
          {sidebarOpen && (
            <span className="text-lg font-bold text-accent truncate">Admin Panel</span>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={item.label}
              >
                <item.icon size={18} className="shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {sidebarOpen && active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* View Site */}
        <div className="border-t border-border p-3 shrink-0">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors px-2"
          >
            <ExternalLink size={16} />
            {sidebarOpen && <span>View Site</span>}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
