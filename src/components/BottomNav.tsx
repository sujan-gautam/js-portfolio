import { Home, User, LayoutGrid, Briefcase, Phone } from "lucide-react";
import { useState } from "react";

const navItems = [
  { icon: Home, label: "Home" },
  { icon: User, label: "About" },
  { icon: LayoutGrid, label: "Feed" },
  { icon: Briefcase, label: "Portfolio" },
  { icon: Phone, label: "Contact" },
];

const BottomNav = () => {
  const [active, setActive] = useState("Home");

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-nav border-t border-border z-50">
      <div className="flex items-center justify-around py-3 max-w-3xl mx-auto">
        {navItems.map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => setActive(label)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              active === label ? "text-nav-active" : "text-nav-foreground"
            }`}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
