"use client";

import React from "react";
import { PurokNode } from "@/types/purok";
import { ShieldCheck, AlertTriangle, Home, Users, ArrowUpRight, Radio } from "lucide-react";

interface PurokInspectorHUDProps {
  activePurok: PurokNode;
  onQuickAction?: (purok: PurokNode) => void;
}

export default function PurokInspectorHUD({
  activePurok,
  onQuickAction,
}: PurokInspectorHUDProps) {
  const getStatusBadgeStyle = (status: PurokNode["status"]) => {
    switch (status) {
      case "safe":
        return "bg-[#30D158]/25 text-[#06391C] border-[#30D158]/70";
      case "alert":
        return "bg-[#FF9F0A]/25 text-[#5C2E00] border-[#FF9F0A]/70";
      case "shelter":
        return "bg-[#0A84FF]/25 text-[#003366] border-[#0A84FF]/70";
      case "evac":
        return "bg-[#FF453A]/25 text-[#8A0F07] border-[#FF453A]/70";
      default:
        return "bg-gray-100 text-gray-900 border-gray-300";
    }
  };

  const percentageSafe = Math.round((activePurok.safe / activePurok.total) * 100);

  return (
    <div
      data-testid="hud-inspector-card"
      className="apple-glass rounded-[24px] p-5 sm:p-6 border border-[#06391C]/20 shadow-apple transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-[#06391C]/15">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#06391C]">
              PUROK HUD INSPECTOR
            </span>
            <span className="w-2 h-2 rounded-full bg-[#30D158]" />
          </div>
          <h3
            data-testid="hud-purok-name"
            className="text-lg sm:text-xl font-black text-[#06391C] tracking-tight flex items-center gap-2.5"
          >
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: activePurok.color }}
            />
            <span>{activePurok.name}</span>
          </h3>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span
            data-testid="hud-status-badge"
            className={`px-3.5 py-1 rounded-full text-xs font-black border uppercase tracking-wider shadow-xs ${getStatusBadgeStyle(
              activePurok.status
            )}`}
          >
            {activePurok.statusText}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Safe count & progress bar */}
        <div className="sm:col-span-5 bg-white rounded-xl p-3.5 border border-[#06391C]/20 shadow-xs">
          <div className="flex items-center justify-between text-xs font-black text-[#06391C] mb-1.5">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#06391C]" />
              <span>Accounting</span>
            </span>
            <span data-testid="hud-safe-count" className="font-mono text-xs font-black text-[#06391C]">
              {activePurok.familiesSafe} Families Safe
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full h-2.5 rounded-full bg-[#06391C]/15 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${percentageSafe}%`,
                backgroundColor: activePurok.color,
              }}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-[#06391C] font-black mt-1.5 font-mono">
            <span>{activePurok.safe} safe</span>
            <span>{activePurok.total - activePurok.safe} pending</span>
            <span className="font-black">{percentageSafe}%</span>
          </div>
        </div>

        {/* Localized Hazard Advice */}
        <div className="sm:col-span-7 space-y-1">
          <span className="text-xs font-black text-[#06391C] uppercase tracking-wider block">
            Localized Hazard Advisory & Status
          </span>
          <p
            data-testid="hud-hazard-advice"
            className="text-xs sm:text-sm text-[#06391C] font-bold leading-relaxed bg-white p-3.5 rounded-xl border border-[#06391C]/20 shadow-xs"
          >
            {activePurok.hazards}
          </p>
        </div>
      </div>

      {onQuickAction && (
        <div className="mt-3.5 pt-3 border-t border-[#06391C]/15 flex justify-end">
          <button
            type="button"
            onClick={() => onQuickAction(activePurok)}
            className="min-h-[44px] min-w-[44px] px-3.5 py-2 -my-1 rounded-xl hover:bg-[#06391C]/5 text-xs sm:text-sm font-black text-[#06391C] hover:text-[#0D522C] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Dispatch / Report for {activePurok.name.split("•")[0]}</span>
            <ArrowUpRight className="w-4 h-4 text-[#06391C]" />
          </button>
        </div>
      )}
    </div>
  );
}
