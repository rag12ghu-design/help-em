"use client";

import React from "react";
import Image from "next/image";
import { Home, ShieldAlert } from "lucide-react";
import { useResilience } from "@/context/ResilienceContext";

interface NavigationProps {
  onOpenApp: () => void;
  onOpenCall?: () => void;
}

export default function Navigation({ onOpenApp, onOpenCall }: NavigationProps) {
  const { role, setRole, tickets } = useResilience();

  const pendingCount = tickets.filter(
    (t) => t.status === "pending" || t.status === "acknowledged"
  ).length;

  return (
    <header className="pt-6 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4 flex-wrap">
      {/* Top-Left Brand Logo & Community Label */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <Image
          src="/logo.png"
          alt="Help'Em Logo"
          width={36}
          height={36}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full shadow-sm border border-[#06391C]/15 shrink-0 object-cover"
          priority
        />
        <div className="flex flex-col">
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#06391C] leading-none">
            Help&apos;Em
          </span>
          <span className="text-[10px] font-black text-[#06391C]/80 tracking-wider uppercase mt-0.5">
            Barangay Quiling Network
          </span>
        </div>
      </div>

      {/* Floating Apple Dynamic Island Capsule (Matching basis-hero.jpg) */}
      <nav
        className="flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#06391C] text-white shadow-apple-lg border border-white/20 transition-all"
        aria-label="Community Mesh Navigation Capsule"
      >
        <div className="flex items-center gap-2 text-xs sm:text-sm font-black tracking-tight">
          <Image
            src="/logo.png"
            alt=""
            width={20}
            height={20}
            className="w-5 h-5 rounded-full ring-1 ring-white/30 shrink-0 object-cover"
          />
          <span>Help&apos;Em</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-white">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30D158] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#30D158]" />
          </span>
          <span className="hidden sm:inline font-bold">Community Mesh Active</span>
        </div>

        <button
          type="button"
          onClick={onOpenApp}
          className="px-3.5 sm:px-4 py-2 min-h-[44px] flex items-center justify-center rounded-full bg-white text-[#06391C] hover:bg-[#F4F9F5] text-xs font-black transition-all shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-white cursor-pointer"
        >
          Open App
        </button>
      </nav>

      {/* Top-Right: Apple Segmented Access Role Switcher */}
      <div className="flex items-center gap-2">
        <div
          role="group"
          aria-label="Portal Access Mode"
          className="flex items-center p-1 rounded-full bg-[#06391C]/10 border border-[#06391C]/20 shadow-xs backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setRole("citizen")}
            aria-pressed={role === "citizen"}
            className={`flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 min-h-[44px] rounded-full text-xs font-black transition-all cursor-pointer ${
              role === "citizen"
                ? "bg-[#06391C] text-white shadow-xs"
                : "text-[#06391C] hover:bg-black/5"
            }`}
            title="Switch to Community Resident view"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">Community Resident</span>
            <span className="md:hidden">Resident</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("responder")}
            aria-pressed={role === "responder"}
            className={`flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 min-h-[44px] rounded-full text-xs font-black transition-all cursor-pointer ${
              role === "responder"
                ? "bg-[#06391C] text-white shadow-xs"
                : "text-[#06391C] hover:bg-black/5"
            }`}
            title="Switch to Department Responders Operations Desk"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">Department Responders</span>
            <span className="md:hidden">Responders</span>
            {pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#FF453A] text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
