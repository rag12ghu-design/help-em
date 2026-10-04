"use client";

import React from "react";
import { Users, MapPin, ChevronRight, Zap, Home, Droplets, HeartPulse, Bus } from "lucide-react";
import { AidStation } from "@/types/resources";
import { BARANGAY_RESOURCES } from "@/data/resources";

interface AidDirectoryProps {
  onConnectToStation: (station: AidStation) => void;
}

export default function AidDirectory({ onConnectToStation }: AidDirectoryProps) {
  const getCategoryIcon = (category: AidStation["category"]) => {
    switch (category) {
      case "power":
        return <Zap className="w-4 h-4 text-amber-500" />;
      case "shelter":
        return <Home className="w-4 h-4 text-blue-500" />;
      case "water":
        return <Droplets className="w-4 h-4 text-cyan-500" />;
      case "medical":
        return <HeartPulse className="w-4 h-4 text-red-500" />;
      case "transport":
        return <Bus className="w-4 h-4 text-emerald-500" />;
      default:
        return <MapPin className="w-4 h-4 text-[#06391C]" />;
    }
  };

  return (
    <section className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF5EE] text-[#06391C] text-xs font-black mb-2.5 border border-[#06391C]/25 shadow-xs">
            <Users className="w-4 h-4 text-[#06391C]" />
            <span>Community Resilience & Bayanihan</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#06391C] mb-3">
            Barangay Mutual Aid Network
          </h2>
          <p className="text-sm sm:text-base text-[#06391C] max-w-xl leading-relaxed font-semibold">
            Local emergency hubs operating inside Barangay Quiling, coordinated jointly by
            resident Purok leaders, Barangay officials, and community disaster responders.
          </p>
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {BARANGAY_RESOURCES.map((item) => (
          <div
            key={item.id}
            className="rounded-[24px] bg-white p-5 sm:p-6 border border-[#06391C]/20 shadow-sm hover:shadow-apple transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-9 h-9 rounded-full bg-[#06391C]/10 flex items-center justify-center border border-[#06391C]/20 shadow-xs">
                  {getCategoryIcon(item.category)}
                </div>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-[#EAF5EE] text-[#06391C] border border-[#06391C]/25 shadow-xs">
                  {item.capacity}
                </span>
              </div>

              <h3 className="font-black text-base sm:text-lg text-[#06391C] mb-2 leading-snug group-hover:text-[#0D522C] transition-colors">
                {item.title}
              </h3>

              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#06391C] font-extrabold mb-3">
                <MapPin className="w-4 h-4 text-[#B45309] shrink-0" />
                <span>{item.location}</span>
              </div>

              <p className="text-xs sm:text-sm text-[#06391C] leading-relaxed font-semibold">
                {item.details}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-[#06391C]/15 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#06391C] bg-[#30D158]/25 px-2.5 py-1 rounded-full border border-[#30D158]/60 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
                <span>{item.status}</span>
              </div>

              <button
                type="button"
                onClick={() => onConnectToStation(item)}
                className="min-h-[44px] min-w-[44px] px-3 py-2 -my-2 -mr-2 rounded-xl hover:bg-[#06391C]/5 text-xs sm:text-sm font-black text-[#06391C] hover:text-[#0D522C] flex items-center gap-1 transition-all group-hover:translate-x-0.5 cursor-pointer"
              >
                <span>Connect to Station</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
