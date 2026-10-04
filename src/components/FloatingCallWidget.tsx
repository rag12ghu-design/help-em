"use client";

import React from "react";
import { PhoneCall, Radio } from "lucide-react";

interface FloatingCallWidgetProps {
  onOpenCall: (stationId?: string) => void;
  isCallActive: boolean;
}

export default function FloatingCallWidget({
  onOpenCall,
  isCallActive,
}: FloatingCallWidgetProps) {
  if (isCallActive) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-40 animate-fade-in">
      <button
        type="button"
        onClick={() => onOpenCall("brgy-command")}
        className="group flex items-center gap-2.5 px-4 py-3 min-h-[44px] min-w-[44px] rounded-full bg-[#06391C] text-white shadow-apple-lg border border-[#30D158]/50 hover:bg-[#074020] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#30D158]"
        aria-label="Launch On-Site Emergency Call with Barangay Responders"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30D158] opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#30D158]" />
        </span>

        <PhoneCall className="w-4 h-4 text-[#30D158] group-hover:rotate-12 transition-transform" />

        <div className="flex flex-col text-left">
          <span className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
            Emergency Voice Line
          </span>
          <span className="text-xs text-white/90 font-mono font-bold hidden sm:inline">
            Barangay Quiling Mesh
          </span>
        </div>
      </button>
    </div>
  );
}
