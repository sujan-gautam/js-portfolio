import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "@/config";
import { Shield } from "lucide-react";

const Privacy = () => {
  useEffect(() => {
    // AnalyticsTracker component globally handles visitor tracking
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen text-white pb-[220px] font-poppins selection:bg-red-500/30 overflow-x-hidden scroll-smooth relative px-[9%]">
      {/* Header Section */}
      <div className="text-center pt-16 pb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600/10 mb-6 border border-red-600/20">
          <Shield className="text-[#CB2729]" size={32} />
        </div>
        <h1 className="text-[5.5vw] font-bold tracking-tight uppercase leading-tight font-poppins">
          PRIVACY <span className="text-[#CB2729]">POLICY</span>
        </h1>
        <p className="text-white/40 mt-4 uppercase tracking-[0.3em] text-[12px] font-medium">Last Updated: April 2026</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        <section className="bg-[#1a1a1a] p-8 md:p-12 rounded-3xl border border-white/5 hover:border-red-600/20 transition-all duration-500 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
            <span className="w-1 h-8 bg-[#CB2729] rounded-full" />
            Introduction
          </h2>
          <p className="text-white/60 leading-relaxed text-[17px] font-light">
            I respect your privacy and am committed to protecting your personal data. This privacy policy will inform you as to how I look after your personal data when you visit my website and tell you about your privacy rights and how the law protects you.
          </p>
        </section> section

        <section className="bg-[#1a1a1a] p-8 md:p-12 rounded-3xl border border-white/5 hover:border-red-600/20 transition-all duration-500 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
            <span className="w-1 h-8 bg-[#CB2729] rounded-full" />
            Information I Collect
          </h2>
          <div className="space-y-6">
            <p className="text-white/60 leading-relaxed text-[17px] font-light">
              I may collect, use, store and transfer different kinds of personal data about you which I have grouped together as follows:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Identity Data", desc: "Names, usernames, or similar identifiers." },
                { title: "Contact Data", desc: "Email addresses and telephone numbers." },
                { title: "Technical Data", desc: "IP address, browser type and version, time zone setting and location." },
                { title: "Usage Data", desc: "Information about how you use my website." }
              ].map((item, idx) => (
                <li key={idx} className="bg-black/20 p-6 rounded-2xl border border-white/5">
                  <h3 className="text-[#CB2729] font-bold mb-2 uppercase text-[14px] tracking-wider">{item.title}</h3>
                  <p className="text-white/40 text-[14px] leading-relaxed">{item.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-[#1a1a1a] p-8 md:p-12 rounded-3xl border border-white/5 hover:border-red-600/20 transition-all duration-500 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
            <span className="w-1 h-8 bg-[#CB2729] rounded-full" />
            How I Use Your Data
          </h2>
          <p className="text-white/60 leading-relaxed text-[17px] font-light">
            I will only use your personal data when the law allows me to. Most commonly, I will use your personal data to provide technical support, respond to your inquiries, and to improve the overall user experience of the website through analytics.
          </p>
        </section>

        <section className="bg-[#1a1a1a] p-8 md:p-12 rounded-3xl border border-white/5 hover:border-red-600/20 transition-all duration-500 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
            <span className="w-1 h-8 bg-[#CB2729] rounded-full" />
            Contact Me
          </h2>
          <p className="text-white/60 leading-relaxed text-[17px] font-light">
            If you have any questions about this privacy policy or my privacy practices, please contact me through the contact form on this website or directly via email.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
