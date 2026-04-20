import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { settingsDB } from "@/lib/adminData";
import axios from "axios";
import { API_BASE, API_URL } from "@/config";
import { Loader2, Mail, Lock, ShieldCheck } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminLogo, setAdminLogo] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    settingsDB.get().then(s => {
      // Priority: settings.adminLogo > Generated S Logo > CSS Abstraction
      if (s?.adminLogo) {
        setAdminLogo(s.adminLogo);
      } else {
        // Default to our cool new S logo in public assets
        setAdminLogo("/assets/logo.png");
      }
    });
  }, []);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
      login(data.token);
      navigate("/admin");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-inter selection:bg-[#CB2729]/30">
      <div className="w-full max-w-[380px] space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Superior Header */}
        <div className="space-y-3">
          {adminLogo ? (
            <div className="mb-6">
              <img src={adminLogo} alt="Admin Logo" className="h-12 w-auto object-contain rounded-xl" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-2xl shadow-white/10 relative overflow-hidden group">
               <div className="w-5 h-1 bg-[#CB2729] rounded-full translate-y-[-2px] -rotate-12" />
               <div className="w-5 h-1 bg-black rounded-full translate-y-[2px] -rotate-12 absolute" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <span className="text-black font-black italic text-xl -translate-x-[2px] -translate-y-[1px]">S</span>
                 <span className="text-[#CB2729] font-black italic text-xl translate-x-[2px] translate-y-[1px]">G</span>
               </div>
            </div>
          )}
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin login</h1>
          <p className="text-white/40 text-[13px] leading-relaxed">
            Welcome back, Sujan. Enter your secure credentials to manage your portfolio.
          </p>
        </div>

        {/* Action Center */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[12px] p-3.5 rounded-lg text-center font-medium animate-in zoom-in-95 duration-300">
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-white/50 ml-0.5">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#CB2729]/20 focus:border-[#CB2729]/50 transition-all text-[14px]"
                placeholder="name@company.com"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-0.5">
                <label className="text-[12px] font-medium text-white/50">Password</label>
                <button type="button" className="text-[12px] font-medium text-[#CB2729] hover:text-red-400 transition-colors">Forgot?</button>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#CB2729]/20 focus:border-[#CB2729]/50 transition-all text-[14px]"
                placeholder="••••••••••••"
              />
            </div>

            <button 
              disabled={isLoading}
              className="w-full bg-[#CB2729] text-white py-3 rounded-lg font-semibold text-[14px] hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Continue"}
            </button>
          </form>

          <div className="relative py-4 flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-white/5"></div>
            <span className="text-[11px] font-medium text-white/20 uppercase tracking-widest">or</span>
            <div className="h-[1px] flex-1 bg-white/5"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white/[0.03] border border-white/10 text-white py-3 rounded-lg font-medium text-[14px] hover:bg-white/5 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
        </div>

        <div className="flex justify-center gap-6 pt-10 border-t border-white/5">
           <a href="/privacy/" className="text-[11px] text-white/20 hover:text-white transition-colors">Privacy</a>
           <a href="/terms/" className="text-[11px] text-white/20 hover:text-white transition-colors">Terms</a>
           <a href="/contact/" className="text-[11px] text-white/20 hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
