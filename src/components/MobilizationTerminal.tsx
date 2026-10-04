"use client";

import React, { useState } from "react";
import { Radio, ArrowRight, ShieldCheck } from "lucide-react";

interface MobilizationTerminalProps {
  onEnroll: (input: string) => void;
}

export default function MobilizationTerminal({ onEnroll }: MobilizationTerminalProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEnroll(inputValue);
  };

  return (
    <section className="py-16 md:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-[32px] bg-[#06391C] text-white p-8 sm:p-12 md:p-14 shadow-apple-lg relative overflow-hidden text-center flex flex-col items-center justify-center">
        {/* Glow ambient background elements */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#30D158]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-brand-gold/15 blur-3xl pointer-events-none" />

        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-white text-xs font-black mb-4 border border-white/25">
          <Radio className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
          <span>Barangay Quiling Community Resilience Network</span>
        </span>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4 max-w-2xl leading-tight text-white">
          Register your household before the next storm warning.
        </h2>

        <p className="text-sm sm:text-base text-white max-w-lg mb-8 leading-relaxed font-semibold">
          Ensure your family receives priority checks, evacuation transport, and relief
          supplies from community volunteers and barangay responders.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter Mobile Number (09XXXXXXXXX)"
            className="px-5 py-3.5 rounded-full bg-white text-[#06391C] placeholder-[#06391C]/65 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold flex-1 shadow-sm font-semibold"
          />
          <button
            type="submit"
            className="px-6 py-3.5 rounded-full bg-brand-gold hover:bg-brand-gold-dark text-[#06391C] font-black text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Enroll Family</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </section>
  );
}
