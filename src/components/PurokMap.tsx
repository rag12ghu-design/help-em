"use client";

import React from "react";
import { MapPin, ShieldAlert, Waves, Zap, Home, Bus, Mountain } from "lucide-react";
import { PurokNode } from "@/types/purok";

interface PurokMapProps {
  puroks: PurokNode[];
  selectedPurokId: string;
  onSelectPurok: (id: string) => void;
  activePurok: PurokNode;
}

export default function PurokMap({
  puroks,
  selectedPurokId,
  onSelectPurok,
  activePurok,
}: PurokMapProps) {
  // Helper for status badge styling
  const getStatusBadgeStyle = (status: PurokNode["status"]) => {
    switch (status) {
      case "safe":
        return "bg-[#30D158]/20 text-[#30D158] border-[#30D158]/30";
      case "alert":
        return "bg-[#FF9F0A]/20 text-[#FF9F0A] border-[#FF9F0A]/30";
      case "shelter":
        return "bg-[#0A84FF]/20 text-[#0A84FF] border-[#0A84FF]/30";
      case "evac":
        return "bg-[#FF453A]/20 text-[#FF453A] border-[#FF453A]/30";
      default:
        return "bg-white/20 text-white border-white/20";
    }
  };

  const getNodeIcon = (purokNumber: number) => {
    switch (purokNumber) {
      case 1:
        return <Waves className="w-2.5 h-2.5" />;
      case 2:
        return <Zap className="w-2.5 h-2.5" />;
      case 3:
        return <Home className="w-2.5 h-2.5" />;
      case 4:
        return <Bus className="w-2.5 h-2.5" />;
      case 5:
        return <Mountain className="w-2.5 h-2.5" />;
      default:
        return <MapPin className="w-2.5 h-2.5" />;
    }
  };

  return (
    <div
      className="relative w-full h-full p-3 flex flex-col justify-between select-none bg-[#0B1510] overflow-hidden"
      role="region"
      aria-label="Interactive Barangay Quiling Purok Map"
    >
      {/* Top Map HUD Bar */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-[#30D158]" />
          <span>Brgy. Quiling Mesh</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md text-white text-[10px] font-mono font-bold border border-white/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-ping" />
          <span>Live • 5 Purok Nodes</span>
        </div>
      </div>

      {/* Stylized SVG Map Topography, River, and Roads */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-70"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="riverGradient" x1="0%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#0A84FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.4" />
          </linearGradient>
          <pattern id="contourGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(48, 209, 88, 0.08)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>

        {/* Background Coordinate Grid */}
        <rect width="100" height="100" fill="url(#contourGrid)" />

        {/* Topographic Contour Rings */}
        <circle cx="80" cy="70" r="18" fill="none" stroke="rgba(48, 209, 88, 0.07)" strokeWidth="0.6" strokeDasharray="1,1" />
        <circle cx="80" cy="70" r="10" fill="none" stroke="rgba(48, 209, 88, 0.09)" strokeWidth="0.6" />
        <circle cx="28" cy="65" r="14" fill="none" stroke="rgba(10, 132, 255, 0.07)" strokeWidth="0.6" strokeDasharray="1,1" />

        {/* Winding Bislak / Quiling River Curve */}
        <path
          d="M 12,98 Q 28,75 24,50 T 42,12 T 48,0"
          fill="none"
          stroke="url(#riverGradient)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* River Shimmer Effect */}
        <path
          d="M 12,98 Q 28,75 24,50 T 42,12 T 48,0"
          fill="none"
          stroke="#E0F7FA"
          strokeWidth="0.8"
          strokeDasharray="3,3"
          strokeOpacity="0.6"
        />

        {/* Main Barangay Road Network */}
        <path
          d="M 0,54 Q 48,46 100,52"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          strokeOpacity="0.35"
        />
        <path
          d="M 48,0 Q 48,50 62,100"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          strokeOpacity="0.35"
        />
        {/* Secondary access trails */}
        <path
          d="M 35,28 Q 48,36 72,35"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.8"
          strokeDasharray="2,2"
          strokeOpacity="0.25"
        />
        <path
          d="M 28,65 Q 48,46 80,70"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.8"
          strokeDasharray="2,2"
          strokeOpacity="0.25"
        />
      </svg>

      {/* Interactive Geo Pins for Purok 1 to 5 with 44×44 pt touch targets */}
      <div className="absolute inset-0 pointer-events-none">
        {puroks.map((node) => {
          const isSelected = selectedPurokId === node.id;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelectPurok(node.id)}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              aria-label={`Select ${node.name}. Status: ${node.statusText}. Families safe: ${node.familiesSafe}`}
              aria-pressed={isSelected}
              data-testid={`purok-pin-${node.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#30D158] focus:ring-offset-2 focus:ring-offset-black rounded-full group cursor-pointer transition-transform"
            >
              {/* Pulsing Beacon Animation */}
              <div className="relative flex items-center justify-center pointer-events-none">
                {/* Outer Ping Ring */}
                <span
                  className={`absolute rounded-full transition-all duration-300 ${
                    isSelected
                      ? "w-8 h-8 opacity-90 animate-ping"
                      : "w-6 h-6 opacity-60 animate-ping group-hover:opacity-80"
                  }`}
                  style={{ backgroundColor: node.color }}
                />

                {/* Secondary halo when selected */}
                {isSelected && (
                  <span
                    className="absolute w-7 h-7 rounded-full border border-white/60 animate-pulse"
                    style={{ backgroundColor: `${node.color}33` }}
                  />
                )}

                {/* Solid Core Beacon */}
                <span
                  className={`relative rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white transition-all duration-200 ${
                    isSelected ? "w-5 h-5 scale-110" : "w-4 h-4 group-hover:scale-110"
                  }`}
                  style={{ backgroundColor: node.color }}
                >
                  {getNodeIcon(node.purokNumber)}
                </span>
              </div>

              {/* Pin Label Pill */}
              <span
                className={`absolute left-1/2 -translate-x-1/2 top-9 px-1.5 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap shadow-md border transition-all pointer-events-none ${
                  isSelected
                    ? "bg-white text-[#06391C] border-white font-extrabold scale-105 z-30"
                    : "bg-black/85 backdrop-blur-md text-white border-white/15 opacity-90 group-hover:opacity-100 group-hover:scale-105"
                }`}
              >
                Purok {node.purokNumber}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Map HUD Inspector Card */}
      <div
        data-testid="map-hud-inspector"
        className="z-10 bg-black/85 backdrop-blur-xl rounded-xl p-2.5 border border-white/20 text-white shadow-apple transition-all"
      >
        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1.5 font-bold text-[11px] min-w-0">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: activePurok.color }}
            />
            <span className="font-extrabold text-white">{activePurok.name}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Status Badge */}
            <span
              data-testid="purok-status-badge"
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadgeStyle(
                activePurok.status
              )}`}
            >
              {activePurok.statusText}
            </span>
            <span className="text-[#30D158] font-mono font-bold text-[10px]">
              {activePurok.familiesSafe} Safe
            </span>
          </div>
        </div>

        <p className="text-white font-medium text-[9.5px] leading-tight line-clamp-2">
          {activePurok.hazards}
        </p>
      </div>
    </div>
  );
}
