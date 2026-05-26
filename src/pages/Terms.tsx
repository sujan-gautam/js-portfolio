import { useEffect } from "react";
import { FileText } from "lucide-react";

const Terms = () => {
  useEffect(() => {
    // AnalyticsTracker component globally handles visitor tracking
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen text-white pb-[220px] font-poppins selection:bg-red-500/30 overflow-x-hidden scroll-smooth relative px-[9%]">
      {/* Header Section */}
      <div className="text-center pt-16 pb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600/10 mb-6 border border-red-600/20">
          <FileText className="text-[#CB2729]" size={32} />
        </div>
        <h1 className="text-[5.5vw] font-bold tracking-tight uppercase leading-tight font-poppins">
          TERMS & <span className="text-[#CB2729]">CONDITIONS</span>
        </h1>
        <p className="text-white/40 mt-4 uppercase tracking-[0.3em] text-[12px] font-medium">Last Updated: April 2026</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        <section className="bg-[#1a1a1a] p-8 md:p-12 rounded-3xl border border-white/5 hover:border-red-600/20 transition-all duration-500 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
            <span className="w-1 h-8 bg-[#CB2729] rounded-full" />
            1. Agreement to Terms
          </h2>
          <p className="text-white/60 leading-relaxed text-[17px] font-light">
            By accessing my website, you agree to be bound by these terms and conditions and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>
        </section>

        <section className="bg-[#1a1a1a] p-8 md:p-12 rounded-3xl border border-white/5 hover:border-red-600/20 transition-all duration-500 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
            <span className="w-1 h-8 bg-[#CB2729] rounded-full" />
            2. Intellectual Property
          </h2>
          <p className="text-white/60 leading-relaxed text-[17px] font-light mb-6">
            The content, original features, and functionality of this website are and will remain the exclusive property of Sujan Gautam. This includes, but is not limited to:
          </p>
          <ul className="space-y-4">
            {[
              "Source code and software architecture",
              "Design elements and UI/UX patterns",
              "Personal branding and logos",
              "Written content and project documentation"
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-4 text-white/50 bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#CB2729]" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-[#1a1a1a] p-8 md:p-12 rounded-3xl border border-white/5 hover:border-red-600/20 transition-all duration-500 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
            <span className="w-1 h-8 bg-[#CB2729] rounded-full" />
            3. Disclaimer
          </h2>
          <p className="text-white/60 leading-relaxed text-[17px] font-light">
            The materials on this website are provided on an 'as is' basis. I make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section className="bg-[#1a1a1a] p-8 md:p-12 rounded-3xl border border-white/5 hover:border-red-600/20 transition-all duration-500 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
            <span className="w-1 h-8 bg-[#CB2729] rounded-full" />
            4. Governing Law
          </h2>
          <p className="text-white/60 leading-relaxed text-[17px] font-light">
            These terms and conditions are governed by and construed in accordance with the laws of Nepal and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
