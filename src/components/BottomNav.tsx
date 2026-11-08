import { BriefcaseBusiness, House, LayoutGrid, Mail, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { icon: House, label: "Home", path: "/" },
  { icon: UserRound, label: "About", path: "/about/" },
  { icon: BriefcaseBusiness, label: "Portfolio", path: "/portfolio/" },
  { icon: LayoutGrid, label: "Feed", path: "/feed/" },
  { icon: Mail, label: "Contact", path: "/contact/" },
];

const BottomNav = () => {
  const { pathname } = useLocation();
  const isPostPage = pathname.startsWith("/post/") || pathname.startsWith("/feed/post/");
  const activePath = isPostPage ? "/feed/" : `${pathname.replace(/\/+$/, "")}/`;
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    if (!isPostPage) return;

    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 0 && Math.abs(scrollY - lastScrollY) <= 5) return;
      setIsVisible(scrollY <= 0 || scrollY < lastScrollY);
      lastScrollY = scrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isPostPage, pathname]);

  const hidden = isPostPage && !isVisible;

  return (
    <nav
      aria-label="Main navigation"
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[8888] px-3 pb-[calc(0.5rem_+_env(safe-area-inset-bottom,0px))] font-poppins motion-safe:transition-[transform,opacity] motion-safe:duration-200 ${
        hidden ? "translate-y-full opacity-0 focus-within:translate-y-0 focus-within:opacity-100" : ""
      }`}
    >
      <div className="pointer-events-auto mx-auto grid w-full max-w-[31rem] grid-cols-5 gap-1 rounded-[20px] border border-white/10 bg-nav/95 p-1 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-lg">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = activePath === path;

          return (
            <Link
              key={path}
              to={path}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-[15px] px-1 text-center text-[11px] font-medium leading-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${
                active ? "bg-primary/[0.12] text-foreground" : "text-nav-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon size={21} strokeWidth={active ? 2 : 1.75} aria-hidden="true" className={active ? "text-red-500" : undefined} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
