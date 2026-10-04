"use client";

import React from "react";
import { CheckCircle2, ShieldCheck, ArrowRight, ShieldAlert, PhoneCall } from "lucide-react";

interface SafetyCheckInProps {
  isSafe: boolean;
  safeCount: number;
  totalHouseholds: number;
  onToggle: () => void;
  onOpenConnectModal: () => void;
  onOpenCall?: () => void;
}

export default function SafetyCheckIn({
  isSafe,
  safeCount,
  totalHouseholds,
  onToggle,
  onOpenConnectModal,
  onOpenCall,
}: SafetyCheckInProps) {
  return (
    <div className="flex flex-col justify-between space-y-3.5 h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-[#06391C] whitespace-nowrap">
            Community Safety
          </span>

          {/* Status Badge Pill */}
          <div
            data-testid="safety-status-badge"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border transition-all duration-200 shrink-0 ${
              isSafe
                ? "bg-[#30D158]/25 border-[#30D158]/70 text-[#06391C] shadow-xs"
                : "bg-[#06391C]/10 border-[#06391C]/25 text-[#06391C]"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                isSafe ? "bg-[#30D158] animate-pulse" : "bg-[#06391C]/40"
              }`}
            />
            <span>{isSafe ? "Safe" : "Unchecked"}</span>
          </div>
        </div>

        {/* Toggle Switch Row */}
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <label
            htmlFor="safety-checkin-switch"
            className="font-black text-base sm:text-lg text-[#06391C] leading-tight cursor-pointer select-none"
          >
            Community Safety Check-in
          </label>
          <div className="relative inline-flex items-center justify-center p-2 -mr-2">
            <button
              id="safety-checkin-switch"
              type="button"
              role="switch"
              aria-checked={isSafe}
              aria-label="Toggle household community safety status"
              onClick={onToggle}
              className={`relative inline-flex items-center h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#30D158] focus:ring-offset-2 before:absolute before:-inset-2.5 before:content-[''] before:min-h-[44px] before:min-w-[44px] ${
                isSafe ? "bg-[#30D158]" : "bg-[#D1D1D6] hover:bg-[#C7C7CC]"
              }`}
            >
              <span className="sr-only">Toggle household safety</span>
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] ring-0 transition duration-200 ease-in-out ${
                  isSafe ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#06391C] mt-2 leading-relaxed font-semibold">
          {isSafe ? (
            <span className="text-[#06391C] font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#30D158] inline shrink-0" />
              Your household is recorded as safe. Barangay responders will prioritize vulnerable neighbors.
            </span>
          ) : (
            <span>
              Toggle on to record your family as safe on the live community mesh. Unchecked households remain on the priority welfare check list.
            </span>
          )}
        </p>
      </div>

      {/* Accounting Counter */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-bold text-[#06391C] pt-2 border-t border-[#06391C]/15">
        <div className="flex items-center gap-2">
          <CheckCircle2
            className={`w-4 h-4 transition-colors ${
              isSafe ? "text-[#30D158]" : "text-[#06391C]/80"
            }`}
          />
          <span className="font-black tracking-tight text-[#06391C]">
            {safeCount} of {totalHouseholds} Families Safe
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-[#06391C]/80 bg-[#EAF5EE] px-2.5 py-0.5 rounded-full border border-[#06391C]/20 shadow-xs flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#30D158]" />
            <span>BDRRMC Verified</span>
          </span>
          <span className="text-xs font-mono font-black text-[#06391C] bg-[#06391C]/10 px-2.5 py-0.5 rounded-full border border-[#06391C]/25 shadow-xs">
            {Math.round((safeCount / totalHouseholds) * 100)}% Verified
          </span>
        </div>
      </div>

      {/* Primary Connect Button */}
      <button
        type="button"
        onClick={onOpenConnectModal}
        className="w-full py-3.5 px-6 rounded-full bg-[#06391C] hover:bg-[#074020] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-apple-pill transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#06391C] focus:ring-offset-2 cursor-pointer"
      >
        <span>Connect Your Household</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* On-Site Emergency Call Button */}
      {onOpenCall && (
        <button
          type="button"
          onClick={onOpenCall}
          className="w-full min-h-[44px] min-w-[44px] py-3.5 px-4 rounded-full bg-[#30D158] hover:bg-[#28B84D] text-[#06391C] font-black text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#30D158] shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <PhoneCall className="w-4 h-4 text-[#06391C]" />
          <span>Live Dispatch Audio Line</span>
        </button>
      )}
    </div>
  );
}
