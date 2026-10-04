"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck, Clock } from "lucide-react";
import { DEBUNKER_ITEMS } from "@/data/debunkers";
import { useResilience } from "@/context/ResilienceContext";

export default function DebunkerSection() {
  const { debunkers } = useResilience();
  const items = debunkers && debunkers.length > 0 ? debunkers : DEBUNKER_ITEMS;
  return (
    <section className="py-16 md:py-24 bg-[#F4F9F5] border-y border-[#06391C]/15">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF5EE] text-[#06391C] text-xs font-black mb-3.5 border border-[#06391C]/25 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#30D158]" />
            <span>Anti-Rumor Verification Hub</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#06391C] mb-4">
            Ground Truth for Every Family
          </h2>
          <p className="text-sm sm:text-base text-[#06391C] font-semibold leading-relaxed">
            During disasters, social media chats fill with conflicting rumors. Help&apos;Em delivers
            first-hand, verified intelligence inspected on-site by barangay officials and community disaster responders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Chaotic Chat Rumors Column */}
          <div className="rounded-[28px] bg-white p-6 sm:p-7 border border-red-200/90 shadow-sm relative flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 pb-4 mb-4 border-b border-red-100">
                <div className="flex items-center gap-2 text-red-800 font-black text-sm sm:text-base">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Unverified Group Chat Rumors</span>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-900 font-black border border-red-300 shadow-xs">
                  Panic & Misinformation
                </span>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm">
                {items.map((item) => (
                  <div
                    key={`rumor-${item.id}`}
                    className="p-3.5 rounded-xl bg-red-50/60 border border-red-200/80 transition-opacity hover:opacity-100"
                  >
                    <p className="font-black text-gray-950 leading-snug">{item.rumor}</p>
                    <span className="text-xs text-red-900 font-black block mt-1.5 flex items-center gap-1.5 font-mono">
                      <span>●</span>
                      <span>{item.rumorImpact}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-red-200 text-xs text-red-900 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Do not forward unverified claims. Check Help&apos;Em verified feeds first.</span>
            </div>
          </div>

          {/* Help'Em Ground Truth Column */}
          <div className="rounded-[28px] bg-white p-6 sm:p-7 border border-[#06391C]/25 shadow-apple relative flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 pb-4 mb-4 border-b border-[#06391C]/15">
                <div className="flex items-center gap-2 text-[#06391C] font-black text-sm sm:text-base">
                  <CheckCircle2 className="w-4 h-4 text-[#30D158] shrink-0" />
                  <span>Help&apos;Em Verified Ground Truth</span>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-[#EAF5EE] text-[#06391C] font-black border border-[#06391C]/25 shadow-xs">
                  BDRRMC Official Verification
                </span>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm">
                {items.map((item) => (
                  <div
                    key={`verified-${item.id}`}
                    className="p-3.5 rounded-xl bg-[#EAF5EE]/75 border border-[#06391C]/20 transition-shadow hover:shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1 font-black text-[#06391C] mb-1.5">
                      <span className="text-xs sm:text-sm font-black">{item.verifiedTitle}</span>
                      <span className="text-xs font-mono font-black text-[#06391C] bg-white px-2.5 py-0.5 rounded-full border border-[#06391C]/25 shadow-xs">
                        {item.pstTime}
                      </span>
                    </div>
                    <p className="text-[#06391C] leading-relaxed font-bold text-xs sm:text-sm">
                      {item.verifiedText}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#06391C]/15 text-xs text-[#06391C] font-black flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#1B7340] shrink-0" />
                <span>Next physical inspection cycle: Every 30 minutes</span>
              </span>
              <span className="font-mono text-xs font-black text-[#06391C]">PST Synchronized</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
