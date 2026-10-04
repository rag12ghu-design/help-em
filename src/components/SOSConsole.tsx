"use client";

import React from "react";
import { Layers, AlertTriangle, PhoneCall } from "lucide-react";
import { PurokNode } from "@/types/purok";
import PurokMap from "./PurokMap";
import RadarLayer from "./RadarLayer";
import SafetyCheckIn from "./SafetyCheckIn";
import PurokInspectorHUD from "./PurokInspectorHUD";

interface SOSConsoleProps {
  puroks: PurokNode[];
  selectedPurokId: string;
  onSelectPurok: (id: string) => void;
  activePurok: PurokNode;
  mapLayer: "community" | "radar";
  onSetMapLayer: (layer: "community" | "radar") => void;
  isSafe: boolean;
  safeCount: number;
  totalHouseholds: number;
  onToggleSafe: () => void;
  onOpenModal: (mode: "sos" | "join" | "aid") => void;
  onOpenCall?: (stationId?: string) => void;
}

export default function SOSConsole({
  puroks,
  selectedPurokId,
  onSelectPurok,
  activePurok,
  mapLayer,
  onSetMapLayer,
  isSafe,
  safeCount,
  totalHouseholds,
  onToggleSafe,
  onOpenModal,
  onOpenCall,
}: SOSConsoleProps) {
  return (
    <div className="space-y-4">
      {/* Primary SOS Console Container */}
      <div
        data-testid="sos-console"
        className="rounded-[28px] bg-white/95 backdrop-blur-2xl p-4 sm:p-6 border border-[#30D158]/50 shadow-apple-lg relative overflow-hidden transition-all"
      >
        {/* Console Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-[#06391C]/15">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <h2 className="font-black text-base sm:text-lg text-[#06391C] tracking-tight">
              Emergency SOS console
            </h2>
            <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#EAF5EE] text-[#06391C] border border-[#06391C]/20 shadow-xs">
              Partner Barangay Live
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {/* Layer Switcher (Purok Map vs Typhoon Radar) */}
            <div
              data-testid="map-layer-switcher"
              className="flex items-center bg-[#06391C]/10 p-1 rounded-full text-xs font-bold border border-[#06391C]/20 shadow-inner"
              role="group"
              aria-label="Map Layer Switcher"
            >
              <button
                type="button"
                onClick={() => onSetMapLayer("community")}
                className={`px-3.5 py-1.5 min-h-[44px] flex items-center justify-center rounded-full transition-all cursor-pointer font-bold ${
                  mapLayer === "community"
                    ? "bg-[#06391C] text-white shadow-xs font-black"
                    : "text-[#06391C] hover:bg-white/80 font-black"
                }`}
                aria-pressed={mapLayer === "community"}
              >
                Purok Map
              </button>
              <button
                type="button"
                onClick={() => onSetMapLayer("radar")}
                className={`px-3.5 py-1.5 min-h-[44px] flex items-center justify-center rounded-full transition-all cursor-pointer font-bold ${
                  mapLayer === "radar"
                    ? "bg-[#06391C] text-white shadow-xs font-black"
                    : "text-[#06391C] hover:bg-white/80 font-black"
                }`}
                aria-pressed={mapLayer === "radar"}
              >
                Typhoon Radar
              </button>
            </div>

            {/* Quick Emergency Voice Call Trigger */}
            {onOpenCall && (
              <button
                type="button"
                onClick={() => onOpenCall("brgy-command")}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#30D158]/30 hover:bg-[#30D158]/45 flex items-center justify-center text-[#06391C] border border-[#30D158]/60 transition-colors focus:outline-none focus:ring-2 focus:ring-[#30D158] cursor-pointer shadow-xs"
                title="Call Barangay Command Post on Mesh Audio"
                aria-label="Emergency Audio Call trigger"
              >
                <PhoneCall className="w-5 h-5 text-[#06391C]" />
              </button>
            )}

            {/* Quick Emergency Dispatch Trigger */}
            <button
              type="button"
              onClick={() => onOpenModal("sos")}
              className="h-11 min-h-[44px] min-w-[44px] px-3.5 rounded-full bg-[#FF453A] hover:bg-red-600 flex items-center justify-center gap-1.5 text-white font-black transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF453A] cursor-pointer shadow-xs"
              title="Quick SOS emergency trigger"
              aria-label="Emergency SOS trigger"
            >
              <AlertTriangle className="w-4 h-4 text-white" />
              <span className="text-xs font-black tracking-wider uppercase">SOS</span>
            </button>
          </div>
        </div>

        {/* Console Body: Split Two-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-center">
          {/* Left Side: Map / Radar Viewport */}
          <div className="w-full min-w-0 h-[295px] sm:h-[315px] relative rounded-2xl overflow-hidden border border-[#06391C]/15 bg-[#0B1510] shadow-inner">
            {mapLayer === "community" ? (
              <PurokMap
                puroks={puroks}
                selectedPurokId={selectedPurokId}
                onSelectPurok={onSelectPurok}
                activePurok={activePurok}
              />
            ) : (
              <RadarLayer />
            )}
          </div>

          {/* Right Side: Safety Check-in Controls */}
          <div className="w-full min-w-0">
            <SafetyCheckIn
              isSafe={isSafe}
              safeCount={safeCount}
              totalHouseholds={totalHouseholds}
              onToggle={onToggleSafe}
              onOpenConnectModal={() => onOpenModal("join")}
              onOpenCall={onOpenCall ? () => onOpenCall("brgy-command") : undefined}
            />
          </div>
        </div>
      </div>

      {/* Expanded HUD Inspector Card for Selected Purok */}
      <PurokInspectorHUD
        activePurok={activePurok}
        onQuickAction={() => onOpenModal("sos")}
      />
    </div>
  );
}
