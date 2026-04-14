import { Home, User, LayoutGrid, Briefcase, Phone } from "lucide-react";
import { useLocation, Link } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: User, label: "About", path: "/about" },
  { icon: LayoutGrid, label: "Feed", path: "/feed" },
  { icon: Briefcase, label: "Portfolio", path: "/portfolio" },
  { icon: Phone, label: "Contact", path: "/contact" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-nav border-t border-border z-50">
      <div className="flex items-center justify-around py-3 max-w-3xl mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => (
          <Link
            key={label}
            to={path}
            className={`flex flex-col items-center gap-1 transition-colors ${
              location.pathname === path ? "text-nav-active" : "text-nav-foreground"
            }`}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
