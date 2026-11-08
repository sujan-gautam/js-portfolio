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
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[8888] pl-[max(0.625rem,env(safe-area-inset-left,0px))] pr-[max(0.625rem,env(safe-area-inset-right,0px))] pb-[calc(0.5rem_+_env(safe-area-inset-bottom,0px))] font-poppins motion-safe:transition-[transform,opacity] motion-safe:duration-200 ${
        hidden ? "translate-y-full opacity-0 focus-within:translate-y-0 focus-within:opacity-100" : ""
      }`}
    >
      <div className="pointer-events-auto mx-auto grid w-full max-w-sm grid-cols-5 gap-0.5 rounded-[22px] border border-white/10 bg-nav/95 p-1 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-lg sm:flex sm:w-fit sm:max-w-none sm:gap-1 sm:rounded-full sm:p-1.5">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = activePath === path;

          return (
            <Link
              key={path}
              to={path}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1.5 rounded-[17px] px-0.5 text-center text-[clamp(0.625rem,3.1vw,0.6875rem)] font-medium leading-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:min-h-11 sm:flex-row sm:gap-2 sm:rounded-full sm:px-3.5 sm:text-xs ${
                active ? "bg-primary/[0.14] text-foreground ring-1 ring-inset ring-primary/20" : "text-nav-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon size={21} strokeWidth={active ? 2 : 1.75} aria-hidden="true" className={`shrink-0 sm:size-[18px] ${active ? "text-red-500" : ""}`} />
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
