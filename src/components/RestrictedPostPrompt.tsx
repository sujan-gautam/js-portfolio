import { Lock } from "lucide-react";
import { API_BASE } from "@/config";
import googleSignIn from "@/assets/google-sign-in-dark.png";

export function RestrictedPostPrompt() {
  const login = () => {
    localStorage.setItem("auth_return", window.location.pathname);
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <div className="grid gap-3 border-l-2 border-primary/80 bg-card px-4 py-3 font-inter sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-5">
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
