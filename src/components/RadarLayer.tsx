"use client";

import React, { useEffect, useState } from "react";
import { Compass, Radio, Wind, AlertCircle } from "lucide-react";

export default function RadarLayer() {
  const [timeString, setTimeString] = useState("09:39 PST");

  useEffect(() => {
    // Keep time formatted authentically
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setTimeString(`${hours}:${minutes} PST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      data-testid="pagasa-doppler-radar"
      className="relative w-full h-full bg-[#051119] flex flex-col justify-between p-3 select-none overflow-hidden"
      role="region"
      aria-label="PAGASA Doppler Weather Radar Layer"
    >
      {/* 1. TOP TELEMETRY HUD BAR (Matches basis-hero.jpg) */}
      <div className="flex items-center justify-between z-20">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
          <span>Weather Radar</span>
          <span className="text-white/40">•</span>
          <span className="font-mono text-[10px] text-white/90">{timeString}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono border border-white/10 text-amber-300">
          <Wind className="w-3 h-3 text-[#FF9F0A]" />
          <span>Signal 2 • 85 km/h</span>
        </div>
      </div>

      {/* 2. RADAR VIEWPORT WITH CONCENTRIC RINGS & HURRICANE SPIRAL */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* SVG Atmospheric Grid & Concentric Range Rings */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            {/* Radar Sweep Gradient */}
            <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0A84FF" stopOpacity="0.15" />
              <stop offset="70%" stopColor="#0A84FF" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#051119" stopOpacity="0" />
            </radialGradient>

            {/* Sweep Beam Wedge */}
            <linearGradient id="sweepBeam" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#30D158" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#30D158" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#30D158" stopOpacity="0" />
            </linearGradient>

            {/* Hurricane Eyewall Echo Gradient */}
            <radialGradient id="eyeWallEcho" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#051119" stopOpacity="0" />
              <stop offset="25%" stopColor="#051119" stopOpacity="0.2" />
              <stop offset="35%" stopColor="#AF52DE" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#FF453A" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#FF9F0A" stopOpacity="0.85" />
              <stop offset="88%" stopColor="#30D158" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0A84FF" stopOpacity="0" />
            </radialGradient>

            {/* Outer Rainband Gradient */}
            <linearGradient id="rainbandCore" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF453A" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#FF9F0A" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#30D158" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0A84FF" stopOpacity="0.2" />
            </linearGradient>

            {/* Coastline Land Mask Contour */}
            <linearGradient id="landContour" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06391C" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#06391C" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Background Map Coastline Vectors (Luzon / Ilocos Norte coastline outline) */}
          <path
            d="M 280,0 Q 290,60 310,120 T 325,200 T 350,300 L 400,300 L 400,0 Z"
            fill="url(#landContour)"
            stroke="rgba(48, 209, 88, 0.25)"
            strokeWidth="0.8"
          />
          {/* Subtle Latitude/Longitude Grid Lines */}
          <line x1="0" y1="75" x2="400" y2="75" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1="0" y1="150" x2="400" y2="150" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" strokeDasharray="3,3" />
          <line x1="0" y1="225" x2="400" y2="225" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1="100" y1="0" x2="100" y2="300" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1="200" y1="0" x2="200" y2="300" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" strokeDasharray="3,3" />
          <line x1="300" y1="0" x2="300" y2="300" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" strokeDasharray="2,2" />

          {/* Radar Center at (200, 150) */}
          {/* Concentric Range Rings (50km, 100km, 150km, 200km) */}
          <circle cx="200" cy="150" r="35" fill="none" stroke="rgba(10, 132, 255, 0.3)" strokeWidth="0.8" strokeDasharray="2,2" />
          <circle cx="200" cy="150" r="70" fill="none" stroke="rgba(10, 132, 255, 0.35)" strokeWidth="0.8" />
          <circle cx="200" cy="150" r="105" fill="none" stroke="rgba(10, 132, 255, 0.25)" strokeWidth="0.8" strokeDasharray="3,3" />
          <circle cx="200" cy="150" r="140" fill="none" stroke="rgba(10, 132, 255, 0.2)" strokeWidth="0.8" />

          {/* Range Labels */}
          <text x="202" y="118" fill="rgba(255, 255, 255, 0.45)" fontSize="7" fontFamily="monospace">50km</text>
          <text x="202" y="83" fill="rgba(255, 255, 255, 0.45)" fontSize="7" fontFamily="monospace">100km</text>
          <text x="202" y="48" fill="rgba(255, 255, 255, 0.45)" fontSize="7" fontFamily="monospace">150km</text>
          <text x="202" y="14" fill="rgba(255, 255, 255, 0.45)" fontSize="7" fontFamily="monospace">200km</text>

          {/* Crosshairs */}
          <line x1="200" y1="10" x2="200" y2="290" stroke="rgba(10, 132, 255, 0.35)" strokeWidth="0.7" />
          <line x1="60" y1="150" x2="340" y2="150" stroke="rgba(10, 132, 255, 0.35)" strokeWidth="0.7" />

          {/* HIGH-FIDELITY DOPPLER HURRICANE SPIRAL (Authentic cyclonic precipitation arms) */}
          <g transform="translate(195, 145)" className="animate-spin" style={{ animationDuration: "36s", transformOrigin: "0 0" }}>
            {/* Diffuse outer convective storm mass */}
            <circle cx="0" cy="0" r="95" fill="url(#radarGlow)" />

            {/* Outer feeder rainband 1 */}
            <path
              d="M -15,10 C -45,35 -85,25 -95,-10 C -105,-45 -80,-85 -45,-90 C -20,-95 20,-85 55,-60"
              fill="none"
              stroke="#30D158"
              strokeWidth="18"
              strokeLinecap="round"
              opacity="0.45"
              filter="blur(3px)"
            />
            <path
              d="M -15,10 C -45,35 -85,25 -95,-10 C -105,-45 -80,-85 -45,-90 C -20,-95 20,-85 55,-60"
              fill="none"
              stroke="#FFD60A"
              strokeWidth="9"
              strokeLinecap="round"
              opacity="0.65"
            />
            <path
              d="M -15,10 C -45,35 -85,25 -95,-10 C -105,-45 -80,-85 -45,-90"
              fill="none"
              stroke="#FF453A"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.8"
            />

            {/* Inner intense spiral arm 2 */}
            <path
              d="M 12,-15 C 35,-35 70,-30 85,-5 C 100,20 85,60 55,80 C 25,100 -25,95 -60,70"
              fill="none"
              stroke="#30D158"
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.5"
              filter="blur(3px)"
            />
            <path
              d="M 12,-15 C 35,-35 70,-30 85,-5 C 100,20 85,60 55,80 C 25,100 -25,95 -60,70"
              fill="none"
              stroke="#FF9F0A"
              strokeWidth="11"
              strokeLinecap="round"
              opacity="0.75"
            />
            <path
              d="M 12,-15 C 35,-35 70,-30 85,-5 C 95,15 80,45 55,65"
              fill="none"
              stroke="#FF453A"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.85"
            />

            {/* Tight eyewall spiral wraps around storm eye */}
            <circle cx="0" cy="0" r="32" fill="url(#eyeWallEcho)" />
            <circle cx="0" cy="0" r="16" fill="#051119" stroke="#FF453A" strokeWidth="2.5" opacity="0.9" />
            <circle cx="0" cy="0" r="8" fill="#030A0F" />
          </g>

          {/* ROTATING RADAR SWEEP LINE & WEDGE */}
          <g transform="translate(200, 150)">
            <g className="animate-spin" style={{ animationDuration: "4s", animationTimingFunction: "linear" }}>
              {/* Phosphor trailing decay wedge */}
              <path
                d="M 0,0 L 138,-35 A 140,140 0 0,0 140,0 Z"
                fill="url(#sweepBeam)"
                opacity="0.5"
              />
              {/* Leading beam line */}
              <line
                x1="0"
                y1="0"
                x2="140"
                y2="0"
                stroke="#30D158"
                strokeWidth="1.8"
                filter="drop-shadow(0 0 4px #30D158)"
              />
            </g>
          </g>
        </svg>

        {/* 3. COMPASS INSTRUMENT OVERLAY (Matching basis-hero.jpg) */}
        <div className="absolute top-2 right-2 flex flex-col items-end z-20">
          <div className="relative w-14 h-14 rounded-full border border-white/20 bg-black/75 backdrop-blur-md flex items-center justify-center shadow-lg">
            {/* Cardinal Points */}
            <span className="absolute top-0.5 text-[8px] font-black text-[#FF453A]">N</span>
            <span className="absolute bottom-0.5 text-[8px] font-bold text-white">S</span>
            <span className="absolute left-1 text-[8px] font-bold text-white">W</span>
            <span className="absolute right-1 text-[8px] font-bold text-white">E</span>

            {/* Rotating Needle indicating wind/heading */}
            <div
              className="w-8 h-8 flex items-center justify-center transition-transform"
              style={{ transform: "rotate(315deg)" }}
              title="Storm track heading WNW (315°)"
            >
              <div className="w-0.5 h-6 bg-gradient-to-t from-transparent via-[#FF9F0A] to-[#FF453A] relative">
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#FF453A] rotate-45" />
              </div>
            </div>

            {/* Center Pivot */}
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
          </div>
          <span className="text-[8px] font-mono font-bold text-white mt-1 bg-black/80 px-1.5 py-0.5 rounded border border-white/10">
            Track 315° WNW
          </span>
        </div>
      </div>

      {/* 4. BOTTOM RADAR FOOTER HUD: REFLECTIVITY LEGEND & METAR READOUT */}
      <div className="z-20 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[9px] font-mono text-white bg-black/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/20">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-[#30D158] animate-pulse" />
            <span className="font-bold text-white">PAGASA Doppler Laoag</span>
          </div>
          <span className="text-[#30D158] font-bold">Echo: 55 dBZ Core</span>
        </div>

        {/* dBZ Reflectivity Scale Gradient Bar */}
        <div className="flex items-center justify-between gap-1.5 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 text-[8px] text-white">
          <span className="font-mono text-[7.5px] uppercase tracking-wider font-bold">dBZ:</span>
          <div className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-green-500 via-yellow-400 via-orange-500 to-red-600 shadow-inner" />
          <div className="flex items-center gap-2 font-mono text-[7.5px] font-bold">
            <span>15 (Light)</span>
            <span>35 (Mod)</span>
            <span className="text-[#FF453A] font-black">55+ (Severe)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
