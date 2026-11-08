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
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[8888] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] font-inter motion-safe:transition-[transform,opacity] motion-safe:duration-200 ${
        hidden ? "translate-y-full opacity-0 focus-within:translate-y-0 focus-within:opacity-100" : ""
      }`}
    >
      <div className="pointer-events-auto mx-auto grid w-full max-w-[38rem] grid-cols-5 border-t border-border bg-nav/95 px-2 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md sm:px-0">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = activePath === path;

          return (
            <Link
              key={path}
              to={path}
              aria-current={active ? "page" : undefined}
              className={`flex h-[55px] min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-center text-[11px] leading-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:h-[51px] sm:flex-row sm:gap-2 sm:text-xs ${
                active ? "text-foreground" : "text-nav-foreground hover:text-foreground"
              }`}
            >
              <Icon size={19} strokeWidth={1.65} aria-hidden="true" className={`shrink-0 sm:size-[18px] ${active ? "text-red-500" : ""}`} />
              <span className="relative whitespace-nowrap">
                {label}
                {active && (
                  <span aria-hidden="true" className="absolute -bottom-1.5 left-1/2 h-0.5 w-3.5 -translate-x-1/2 rounded-full bg-red-500" />
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
