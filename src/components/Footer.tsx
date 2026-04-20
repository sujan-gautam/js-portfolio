import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-8 mt-auto border-t border-white/5 bg-transparent relative z-[10]">
      <div className="max-w-7xl mx-auto px-6 h-full flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-white/20 text-[11px] font-medium tracking-[0.2em] uppercase">
          &copy; {currentYear} SUJAN GAUTAM. ALL RIGHTS RESERVED.
        </div>
        
        <div className="flex items-center gap-8">
          <Link 
            to="/privacy/" 
            className="text-white/20 hover:text-[#CB2729] text-[11px] font-bold tracking-[0.2em] uppercase transition-all"
          >
            Privacy Policy
          </Link>
          <Link 
            to="/terms/" 
            className="text-white/20 hover:text-[#CB2729] text-[11px] font-bold tracking-[0.2em] uppercase transition-all"
          >
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
