import { Lock } from "lucide-react";
import { API_BASE } from "@/config";
import googleSignIn from "@/assets/google-sign-in-dark.png";

export function RestrictedPostPrompt() {
  const login = () => {
    localStorage.setItem("auth_return", window.location.pathname + window.location.search);
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <div className="relative isolate grid min-h-28 gap-3 overflow-hidden border-l-2 border-primary/80 bg-card px-4 py-3 font-inter sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-5">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 select-none opacity-35 blur-[5px]">
        <div className="absolute inset-y-0 right-0 w-2/5 bg-gradient-to-br from-white/20 to-white/5" />
        <div className="absolute left-6 top-4 h-2 w-2/5 rounded-full bg-white/20" />
        <div className="absolute left-6 top-9 h-2 w-1/3 rounded-full bg-white/15" />
        <div className="absolute bottom-6 left-6 h-2 w-1/4 rounded-full bg-white/10" />
      </div>
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lock size={15} aria-hidden="true" className="shrink-0 text-muted-foreground" />
          Log in to view
        </p>
        <p className="mt-1 text-sm text-muted-foreground">AI and bots are restricted.</p>
      </div>
      <button
        type="button"
        onClick={login}
        aria-label="Sign in with Google"
        className="inline-flex min-h-11 items-center justify-self-start rounded-md transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <img src={googleSignIn} alt="" className="h-10 w-auto" />
      </button>
    </div>
  );
}
