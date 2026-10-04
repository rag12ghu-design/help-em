"use client";

import React, { useState } from "react";
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  ChevronDown,
  ChevronUp,
  X,
  Truck,
  HeartPulse,
} from "lucide-react";
import { useResilience } from "@/context/ResilienceContext";
import { EmergencyTicket, TicketStatus } from "@/types/responder";

interface CitizenCaseTrackerProps {
  onOpenCall?: (stationId: string) => void;
}

export default function CitizenCaseTracker({ onOpenCall }: CitizenCaseTrackerProps) {
  const { tickets, citizenTicketIds } = useResilience();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Find active tickets created by this citizen session (or most recent 2)
  const myTickets = tickets.filter(
    (t) => citizenTicketIds.includes(t.id) || t.id === "tkt-001"
  );

  if (dismissed || myTickets.length === 0) return null;

  const activeTicket = myTickets[0];

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "pending":
        return {
          label: "Queued at Operations Desk",
          sublabel: "Awaiting responder dispatch",
          bgColor: "bg-[#FF9F0A]/15 text-[#B26A00] border-[#FF9F0A]/30",
          dotColor: "bg-[#FF9F0A] animate-ping",
          icon: Clock,
        };
      case "acknowledged":
        return {
          label: "Department Acknowledged",
          sublabel: "Assessing protocol & mobilizing unit",
          bgColor: "bg-[#0A84FF]/15 text-[#0055B3] border-[#0A84FF]/30",
          dotColor: "bg-[#0A84FF] animate-pulse",
          icon: ShieldCheck,
        };
      case "dispatched":
        return {
          label: "Emergency Unit Dispatched",
          sublabel: activeTicket.assignedTeamName ? `${activeTicket.assignedTeamName} En Route` : "Barangay emergency response unit in transit",
          bgColor: "bg-[#30D158]/15 text-[#06391C] border-[#30D158]/40",
          dotColor: "bg-[#30D158] animate-ping",
          icon: Truck,
        };
      case "resolved":
        return {
          label: "Assistance Completed",
          sublabel: "Resolved on site by Barangay emergency responders",
          bgColor: "bg-[#06391C]/15 text-[#06391C] border-[#06391C]/30",
          dotColor: "bg-[#06391C]",
          icon: CheckCircle2,
        };
    }
  };

  const statusInfo = getStatusBadge(activeTicket.status);
  const StatusIcon = statusInfo.icon;

  return (
    <aside
      aria-label="Citizen Active Case Tracker"
      className="fixed bottom-6 left-4 sm:left-8 z-40 max-w-sm w-[calc(100vw-32px)] sm:w-96 rounded-2xl bg-white/95 backdrop-blur-md border border-[#06391C]/15 shadow-apple-lg transition-all duration-300 overflow-hidden"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#06391C] text-white">
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <div className="w-2 h-2 rounded-full bg-[#30D158] animate-ping shrink-0" />
          <span className="text-xs font-black tracking-wide truncate">
            Your Active Emergency Request
          </span>
          <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full shrink-0">
            {activeTicket.ticketNumber}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-8 h-8 min-h-[44px] min-w-[44px] rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/80 hover:text-white cursor-pointer"
            aria-label={isCollapsed ? "Expand case details" : "Collapse case details"}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-8 h-8 min-h-[44px] min-w-[44px] rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/80 hover:text-white cursor-pointer"
            aria-label="Dismiss case tracker banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="p-4 flex flex-col gap-3">
          {/* Target Department Badge */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold">Assigned Department:</span>
            <span className="font-black text-[#06391C] text-right truncate max-w-[210px]">
              {activeTicket.departmentName || "Rescue, Evacuation & Flood Operations"}
            </span>
          </div>

          {/* Status Pill */}
          <div
            className={`flex items-start gap-2.5 p-3 rounded-xl border ${statusInfo.bgColor}`}
          >
            <StatusIcon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black leading-tight">{statusInfo.label}</p>
              <p className="text-[11px] font-bold opacity-90 mt-0.5 leading-snug">
                {statusInfo.sublabel}
              </p>
            </div>
          </div>

          {/* Situation Summary */}
          <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold mb-1">
              <span>{activeTicket.purokName}</span>
              <span>{activeTicket.timestamp}</span>
            </div>
            <p className="font-bold text-[#06391C] line-clamp-2">
              {activeTicket.category}: {activeTicket.description}
            </p>
            {activeTicket.responderNotes && (
              <p className="text-[11px] font-semibold text-emerald-800 mt-1.5 pt-1.5 border-t border-slate-200">
                💬 <span className="font-bold">Responder Note:</span> {activeTicket.responderNotes}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {onOpenCall && (
              <button
                type="button"
                onClick={() => onOpenCall("brgy-command")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 min-h-[44px] rounded-xl bg-[#06391C] hover:bg-[#0B4A26] text-white text-xs font-black transition-colors cursor-pointer shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#30D158]" />
                <span>Call Assigned Desk</span>
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
