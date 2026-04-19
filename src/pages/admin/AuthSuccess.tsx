import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      login(token);
      setTimeout(() => {
        navigate("/admin");
      }, 500);
    } else {
      navigate("/admin/login");
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 space-y-6">
      <div className="relative">
         <div className="w-16 h-16 border-2 border-[#CB2729]/20 rounded-full animate-ping absolute inset-0" />
         <div className="w-16 h-16 border-2 border-[#CB2729] rounded-full flex items-center justify-center bg-[#0A0A0A] relative">
            <Loader2 className="text-[#CB2729] animate-spin" size={32} />
         </div>
      </div>
      <div className="text-center space-y-2">
         <h2 className="text-white font-bold uppercase tracking-[0.3em] text-[12px]">Establishing Secure Session</h2>
         <p className="text-white/20 text-[10px] uppercase font-medium">Verifying encrypted certificates...</p>
      </div>
    </div>
  );
};

export default AuthSuccess;
