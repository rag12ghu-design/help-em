"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  HeartPulse,
  Droplets,
  Zap,
  Radio,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building2,
  FileText,
  Send,
  PhoneCall,
  Search,
  Filter,
  Check,
  ChevronRight,
  TrendingUp,
  MapPin,
  Flame,
  ArrowUpRight,
  UserCheck,
  Layers,
  Sparkles,
} from "lucide-react";
import { useResilience } from "@/context/ResilienceContext";
import {
  DepartmentType,
  TicketStatus,
  TicketPriority,
  EmergencyTicket,
  NSTPVolunteerTeam,
} from "@/types/responder";
import { RESCUE_DEPARTMENTS, getDepartmentInfo } from "@/data/departments";
import { PUROK_NODES } from "@/data/puroks";

interface ResponderOperationsDeskProps {
  onOpenCall?: (stationId: string) => void;
}

export default function ResponderOperationsDesk({
  onOpenCall,
}: ResponderOperationsDeskProps) {
  const {
    selectedDepartment,
    setSelectedDepartment,
    tickets,
    updateTicketStatus,
    volunteerTeams,
    vulnerableHouseholds,
    toggleVulnerableSafe,
    addDebunker,
    addAnnouncement,
    announcements,
    safeCount,
    totalHouseholds,
  } = useResilience();

  // Active workspace tab: "triage" | "roster" | "teams" | "cms"
  const [activeTab, setActiveTab] = useState<"triage" | "roster" | "teams" | "cms">("triage");

  // Secondary status filter for triage queue
  const [statusFilter, setStatusFilter] = useState<"all" | TicketStatus>("all");

  // Search keyword in triage
  const [searchQuery, setSearchQuery] = useState("");

  // PST Live Clock
  const [pstClock, setPstClock] = useState("");

  // Assign team modal / inline state: ticketId -> teamId
  const [assignTeamMap, setAssignTeamMap] = useState<Record<string, string>>({});
  const [resolutionNotesMap, setResolutionNotesMap] = useState<Record<string, string>>({});

  // CMS Form States - Advisory
  const [advisoryTitle, setAdvisoryTitle] = useState("");
  const [advisoryMessage, setAdvisoryMessage] = useState("");
  const [advisorySeverity, setAdvisorySeverity] = useState<"urgent" | "warning" | "advisory">("urgent");
  const [advisoryDept, setAdvisoryDept] = useState<DepartmentType>("rescue_evac");
  const [advisoryPurok, setAdvisoryPurok] = useState("Barangay Quiling Wide");

  // CMS Form States - Fact-Check
  const [rumorText, setRumorText] = useState("");
  const [rumorImpact, setRumorImpact] = useState("");
  const [factTitle, setFactTitle] = useState("");
  const [factText, setFactText] = useState("");
  const [factPst, setFactPst] = useState("");

  // CMS Feedback Toast
  const [cmsFeedback, setCmsFeedback] = useState<string | null>(null);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const mins = now.getMinutes().toString().padStart(2, "0");
      const secs = now.getSeconds().toString().padStart(2, "0");
      setPstClock(`${hours}:${mins}:${secs} PST`);
      if (!factPst) {
        setFactPst(`${hours}:${mins} PST`);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [factPst]);

  // Department Filters: All + 4 rescue departments + public info
  const departmentTabs: { id: DepartmentType; label: string; icon: React.ElementType }[] = [
    { id: "all", label: "All Departments", icon: Layers },
    { id: "rescue_evac", label: "Rescue & Evacuation", icon: ShieldAlert },
    { id: "health_medical", label: "Medical & Health", icon: HeartPulse },
    { id: "relief_supplies", label: "Food & Water Relief", icon: Droplets },
    { id: "power_utilities", label: "Power & Utilities", icon: Zap },
  ];

  // Filtered tickets
  const deptFilteredTickets =
    selectedDepartment === "all"
      ? tickets
      : tickets.filter((t) => t.targetDepartment === selectedDepartment);

  const displayedTickets = deptFilteredTickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${t.ticketNumber} ${t.contactName} ${t.phone} ${t.purokName} ${t.category} ${t.description}`.toLowerCase();
      return matchText.includes(q);
    }
    return true;
  });

  // Calculate live metrics
  const activeTicketsCount = tickets.filter((t) => t.status !== "resolved").length;
  const deployedTeamsCount = volunteerTeams.filter((tm) => tm.status === "deployed").length;
  const totalFamilies = totalHouseholds || 240;
  const safeFamilies = safeCount;

  // Department count helper
  const getDeptTicketCount = (deptId: DepartmentType) => {
    if (deptId === "all") return tickets.length;
    return tickets.filter((t) => t.targetDepartment === deptId).length;
  };

  // Handlers for ticket lifecycle
  const handleAcknowledge = (ticketId: string) => {
    updateTicketStatus(ticketId, "acknowledged", undefined, "Acknowledged by operations officer on duty.");
  };

  const handleDispatch = (ticketId: string) => {
    const chosenTeam = assignTeamMap[ticketId] || "team-alpha";
    const teamObj = volunteerTeams.find((tm) => tm.id === chosenTeam);
    const notes = teamObj ? `${teamObj.name} deployed to location.` : "Emergency response unit mobilized.";
    updateTicketStatus(ticketId, "dispatched", chosenTeam, notes);
  };

  const handleResolve = (ticketId: string) => {
    const notes = resolutionNotesMap[ticketId] || "Assistance successfully completed on site.";
    updateTicketStatus(ticketId, "resolved", undefined, notes);
  };

  // CMS Handlers
  const handlePublishAdvisory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisoryTitle.trim() || !advisoryMessage.trim()) return;

    addAnnouncement({
      title: advisoryTitle.trim(),
      message: advisoryMessage.trim(),
      severity: advisorySeverity,
      author: "Barangay Quiling BDRRMC Operations Desk",
      department: advisoryDept,
      purokTag: advisoryPurok,
    });

    setAdvisoryTitle("");
    setAdvisoryMessage("");
    setCmsFeedback("Official Community Advisory published and broadcasted across citizen portal!");
    setTimeout(() => setCmsFeedback(null), 5000);
  };

  const handlePublishDebunker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rumorText.trim() || !factTitle.trim() || !factText.trim()) return;

    const timestamp = factPst.trim() || pstClock.slice(0, 5) + " PST";

    addDebunker({
      rumor: rumorText.trim(),
      rumorImpact: rumorImpact.trim() || "Unverified Social Media Chat Claim",
      verifiedTitle: factTitle.trim(),
      verifiedText: factText.trim(),
      pstTime: timestamp,
      purok: "Barangay Quiling Wide",
      badgeText: "BDRRMC Official Verification",
    });

    setRumorText("");
    setRumorImpact("");
    setFactTitle("");
    setFactText("");
    setCmsFeedback("Verified Anti-Rumor Fact-Check published to citizen Ground Truth section!");
    setTimeout(() => setCmsFeedback(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#F4F9F5] text-[#06391C]">
      {/* 1. OPERATIONS DESK HERO HEADER */}
      <section className="bg-gradient-to-b from-[#06391C] to-[#0A4D27] text-white pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b border-[#06391C]/30 shadow-apple-lg">
        <div className="max-w-7xl mx-auto">
          {/* Top Row: Title, Status Beacon & PST Clock */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/15">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/40">
                  <span className="w-2 h-2 rounded-full bg-[#30D158] animate-ping" />
                  <span>Operations Desk Live</span>
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white/10 text-white/90 border border-white/15">
                  {pstClock || "Philippine Standard Time"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Barangay Quiling Emergency Operations Desk
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1">
                Barangay Quiling Disaster Risk Reduction & Department Emergency Operations Desk
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("cms")}
                className="min-h-[44px] px-4 py-2.5 rounded-full bg-[#FBBF24] hover:bg-[#F59E0B] text-[#06391C] font-extrabold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>+ Publish Bulletin / Fact-Check CMS</span>
              </button>

              {onOpenCall && (
                <button
                  type="button"
                  onClick={() => onOpenCall("brgy-command")}
                  className="min-h-[44px] px-4 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-extrabold text-xs flex items-center gap-2 border border-white/20 transition-all active:scale-95 cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-[#30D158]" />
                  <span>VHF Mesh Radio Link</span>
                </button>
              )}
            </div>
          </div>

          {/* Metrics Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
                Active Distress Tickets
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black">{activeTicketsCount}</span>
                <span className="text-xs text-emerald-300 font-bold">
                  ({tickets.filter((t) => t.status === "pending").length} Queued)
                </span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
                Emergency Response Units
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black">{deployedTeamsCount} / 4</span>
                <span className="text-xs text-emerald-300 font-bold">Units Deployed</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
                Household Safety Roster
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black">{safeFamilies} / {totalFamilies}</span>
                <span className="text-xs text-emerald-300 font-bold">Families Safe</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
                Official Bulletins Live
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black">{announcements.length}</span>
                <span className="text-xs text-emerald-300 font-bold">Active Advisories</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN OPERATIONS CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* CMS Success Banner */}
        {cmsFeedback && (
          <div className="p-4 rounded-2xl bg-[#EAF5EE] border border-[#30D158]/50 text-[#06391C] font-bold text-xs flex items-center justify-between shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#30D158] shrink-0" />
              <span>{cmsFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setCmsFeedback(null)}
              className="text-[#06391C]/70 hover:text-[#06391C] text-xs font-black min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 3. SEGMENTED DEPARTMENT FILTER TOOLBAR */}
        <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-[#06391C]/15 shadow-apple-sm">
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Department Filter Tabs">
            {departmentTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = selectedDepartment === tab.id;
              const count = getDeptTicketCount(tab.id);

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedDepartment(tab.id)}
                  className={`min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#06391C] text-white shadow-sm"
                      : "bg-[#F4F9F5] text-[#06391C] hover:bg-[#EAF5EE] border border-[#06391C]/10"
                  }`}
                >
                  <TabIcon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-[#06391C]/10 text-[#06391C]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. WORKSPACE VIEW SWITCHER TABS */}
        <div className="flex items-center border-b border-[#06391C]/15 pb-2 gap-2 sm:gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("triage")}
            className={`min-h-[44px] px-4 py-2 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "triage"
                ? "border-[#06391C] text-[#06391C]"
                : "border-transparent text-[#06391C]/80 hover:text-[#06391C]"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Live Triage Queue</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#06391C]/10 text-[#06391C]">
              {deptFilteredTickets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("roster")}
            className={`min-h-[44px] px-4 py-2 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "roster"
                ? "border-[#06391C] text-[#06391C]"
                : "border-transparent text-[#06391C]/80 hover:text-[#06391C]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Household Safety Accounting Roster</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#30D158]/20 text-[#06391C] font-black">
              {safeFamilies} / {totalFamilies} Safe
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("teams")}
            className={`min-h-[44px] px-4 py-2 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "teams"
                ? "border-[#06391C] text-[#06391C]"
                : "border-transparent text-[#06391C]/80 hover:text-[#06391C]"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Emergency Response Units Deployment</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#06391C]/10 text-[#06391C]">
              {volunteerTeams.length} Teams
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cms")}
            className={`min-h-[44px] px-4 py-2 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "cms"
                ? "border-[#06391C] text-[#06391C]"
                : "border-transparent text-[#06391C]/80 hover:text-[#06391C]"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Official Bulletin & Fact-Check CMS</span>
          </button>
        </div>

        {/* 5. TAB 1: LIVE TRIAGE QUEUE */}
        {activeTab === "triage" && (
          <div className="space-y-4">
            {/* Triage Search & Sub-Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#06391C]/15">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#06391C]/50" />
                <input
                  type="text"
                  placeholder="Filter tickets by contact, Purok, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 min-h-[44px] rounded-xl bg-[#F4F9F5] border border-[#06391C]/15 text-xs font-semibold text-[#06391C] placeholder-[#06391C]/50 focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                />
              </div>

              {/* Status pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(["all", "pending", "acknowledged", "dispatched", "resolved"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                      statusFilter === st
                        ? "bg-[#06391C] text-white shadow-xs"
                        : "bg-[#F4F9F5] text-[#06391C]/70 hover:text-[#06391C] border border-[#06391C]/10"
                    }`}
                  >
                    {st === "all" ? "All Status" : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket Cards Stream */}
            {displayedTickets.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#06391C]/15 shadow-sm space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#30D158] mx-auto" />
                <h3 className="text-xl font-extrabold text-[#06391C]">No Matching Tickets in Triage</h3>
                <p className="text-xs text-[#06391C]/70 max-w-sm mx-auto font-medium">
                  All distress calls in this filter have been acknowledged or resolved. Monitoring incoming mesh reports.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedTickets.map((ticket) => {
                  const dept = getDepartmentInfo(ticket.targetDepartment || "rescue_evac");
                  const isAssigned = Boolean(ticket.assignedTeamId);

                  return (
                    <article
                      key={ticket.id}
                      className="bg-white rounded-2xl p-5 sm:p-6 border border-[#06391C]/15 shadow-apple-sm transition-all hover:border-[#06391C]/30 space-y-4"
                    >
                      {/* Card Header: Ticket No, Priority, Department, Status Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#06391C]/10">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-[#06391C] bg-[#F4F9F5] px-2.5 py-1 rounded-lg border border-[#06391C]/15">
                            {ticket.ticketNumber}
                          </span>

                          {/* Priority Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              ticket.priority === "critical"
                                ? "bg-[#FF453A]/15 text-[#D70015] border border-[#FF453A]/30"
                                : ticket.priority === "high"
                                ? "bg-[#FF9F0A]/15 text-[#B26A00] border border-[#FF9F0A]/30"
                                : ticket.priority === "medium"
                                ? "bg-[#0A84FF]/15 text-[#0066CC] border border-[#0A84FF]/30"
                                : "bg-[#30D158]/15 text-[#06391C] border border-[#30D158]/30"
                            }`}
                          >
                            {ticket.priority === "critical" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF453A] animate-ping" />
                            )}
                            <span>{ticket.priority} Priority</span>
                          </span>

                          {/* Department Pill */}
                          <span className="text-[11px] font-bold text-[#06391C] bg-[#EAF5EE] px-2.5 py-1 rounded-full border border-[#06391C]/15">
                            {dept.shortName}
                          </span>
                        </div>

                        {/* Status Badge & Timestamp */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-[#06391C]/70">
                            {ticket.timestamp}
                          </span>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black capitalize ${
                              ticket.status === "pending"
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : ticket.status === "acknowledged"
                                ? "bg-blue-100 text-blue-900 border border-blue-300"
                                : ticket.status === "dispatched"
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                : "bg-slate-100 text-slate-800 border border-slate-300"
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </div>
                      </div>

                      {/* Card Content Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Reporter & Location */}
                        <div className="space-y-1 text-xs">
                          <span className="text-[#06391C]/80 font-bold uppercase tracking-wider text-[10px] block">
                            Reporter & Contact
                          </span>
                          <p className="font-extrabold text-[#06391C] text-sm">{ticket.contactName}</p>
                          <p className="font-mono text-[#06391C]/80 font-bold">{ticket.phone}</p>
                          <div className="flex items-center gap-1.5 text-[#06391C] font-bold pt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#30D158]" />
                            <span>{ticket.purokName}</span>
                          </div>
                        </div>

                        {/* Emergency Category & Situation Description */}
                        <div className="space-y-1.5 text-xs md:col-span-2">
                          <span className="text-[#06391C]/80 font-bold uppercase tracking-wider text-[10px] block">
                            Situation & Urgent Needs
                          </span>
                          <p className="font-black text-[#06391C] text-sm">
                            {ticket.category}
                          </p>
                          <p className="text-xs text-[#06391C] font-semibold leading-relaxed bg-[#F4F9F5] p-3 rounded-xl border border-[#06391C]/10">
                            {ticket.description}
                          </p>

                          {/* Urgent needs tags */}
                          {ticket.urgentNeeds && ticket.urgentNeeds.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {ticket.urgentNeeds.map((need, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-800 border border-red-200"
                                >
                                  {need}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Responder notes */}
                          {ticket.responderNotes && (
                            <div className="text-[11px] text-[#06391C] bg-[#EAF5EE] p-2 rounded-lg border border-[#06391C]/15 font-semibold">
                              <span className="font-extrabold">Responder Log:</span> {ticket.responderNotes}
                              {ticket.resolvedAt && (
                                <span className="block text-[10px] text-[#06391C]/70 mt-0.5 font-mono">
                                  Resolved at {ticket.resolvedAt}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Action Toolbar (44pt compliant buttons) */}
                      <div className="pt-3 border-t border-[#06391C]/10 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {ticket.assignedTeamName ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#06391C] bg-[#30D158]/15 px-3 py-1.5 rounded-full border border-[#30D158]/30">
                              <UserCheck className="w-3.5 h-3.5 text-[#30D158]" />
                              <span>Assigned: {ticket.assignedTeamName}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-[#06391C]/80 font-semibold italic">
                              Awaiting unit dispatch
                            </span>
                          )}
                        </div>

                        {/* Interactive Action Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* 1-Click Acknowledge */}
                          {ticket.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => handleAcknowledge(ticket.id)}
                              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0066CC] text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                            >
                              Acknowledge Ticket
                            </button>
                          )}

                          {/* Team assignment dropdown & dispatch */}
                          {ticket.status !== "resolved" && (
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                              <select
                                value={assignTeamMap[ticket.id] || ticket.assignedTeamId || "team-alpha"}
                                onChange={(e) =>
                                  setAssignTeamMap({ ...assignTeamMap, [ticket.id]: e.target.value })
                                }
                                aria-label="Select Emergency Response Team"
                                className="min-h-[44px] px-3 py-2 text-xs font-bold rounded-xl border border-[#06391C]/20 bg-white text-[#06391C] focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                              >
                                {volunteerTeams.map((team) => (
                                  <option key={team.id} value={team.id}>
                                    {team.name} ({team.status})
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => handleDispatch(ticket.id)}
                                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#06391C] hover:bg-[#074020] text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                              >
                                {ticket.status === "dispatched" ? "Reassign Unit" : "Dispatch Unit"}
                              </button>
                            </div>
                          )}

                          {/* Mark Resolved */}
                          {ticket.status !== "resolved" && (
                            <button
                              type="button"
                              onClick={() => handleResolve(ticket.id)}
                              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#30D158] hover:bg-[#28B84D] text-[#06391C] font-extrabold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                            >
                              Resolve Ticket
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 6. TAB 2: HOUSEHOLD SAFETY ACCOUNTING ROSTER */}
        {activeTab === "roster" && (
          <div className="space-y-6">
            {/* Safe Families Big Summary Counter */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#06391C]/15 shadow-apple-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#06391C]/10">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#06391C] bg-[#30D158]/15 px-3 py-1 rounded-full border border-[#30D158]/30">
                    Community Accounting Matrix
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#06391C] mt-2">
                    {safeFamilies} of {totalFamilies} Families Safe
                  </h2>
                  <p className="text-xs sm:text-sm text-[#06391C]/80 font-medium mt-1">
                    Barangay Quiling Purok 1 through Purok 5 Verified Accounting
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-3xl sm:text-4xl font-black text-[#06391C]">
                    {Math.round((safeFamilies / totalFamilies) * 100)}%
                  </span>
                  <span className="text-xs text-[#06391C]/70 block font-bold">Total Safety Index</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-[#EAF5EE] rounded-full overflow-hidden mt-6">
                <div
                  className="h-full bg-gradient-to-r from-[#1B7340] to-[#30D158] rounded-full transition-all duration-500"
                  style={{ width: `${(safeFamilies / totalFamilies) * 100}%` }}
                />
              </div>

              {/* 5 Purok Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
                {PUROK_NODES.map((node) => {
                  const pct = Math.round((node.safe / node.total) * 100);

                  return (
                    <div
                      key={node.id}
                      className="bg-[#F4F9F5] rounded-2xl p-4 border border-[#06391C]/10 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-[#06391C]/70 mb-1">
                          <span>Purok {node.purokNumber}</span>
                          <span className="font-mono text-[11px]">{node.familiesSafe}</span>
                        </div>
                        <h4 className="font-extrabold text-[#06391C] text-sm">{node.area}</h4>
                        <span className="inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-[#06391C] border border-[#06391C]/15">
                          {node.statusText}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#06391C] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#06391C]/70 mt-1 block text-right">
                          {pct}% Safe
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Flagged Priority Vulnerable Households */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#06391C]/15 shadow-apple-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#06391C]/10">
                <div>
                  <h3 className="text-xl font-extrabold text-[#06391C]">
                    Priority Vulnerable Households Accounting
                  </h3>
                  <p className="text-xs text-[#06391C]/70 font-medium mt-0.5">
                    Senior citizens, infants, PWDs, and bedridden residents flagged for proactive verification
                  </p>
                </div>
                <span className="text-xs font-bold text-[#06391C] bg-[#F4F9F5] px-3 py-1.5 rounded-full border border-[#06391C]/15">
                  {vulnerableHouseholds.length} Households Flagged
                </span>
              </div>

              {/* Vulnerable Households List */}
              <div className="divide-y divide-[#06391C]/10 mt-2">
                {vulnerableHouseholds.map((vh) => (
                  <div
                    key={vh.id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-[#06391C]">{vh.headOfFamily}</h4>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            vh.priorityLevel === "Critical"
                              ? "bg-red-100 text-red-900 border border-red-300"
                              : "bg-amber-100 text-amber-900 border border-amber-300"
                          }`}
                        >
                          {vh.priorityLevel}
                        </span>
                        <span className="text-[10px] font-bold text-[#06391C] bg-[#EAF5EE] px-2 py-0.5 rounded-full border border-[#06391C]/15">
                          {vh.vulnerabilityType}
                        </span>
                      </div>

                      <p className="text-xs text-[#06391C]/80 font-medium">
                        <span className="font-bold">{vh.purokName}</span> • {vh.membersCount} family members • Contact: <span className="font-mono">{vh.contactNumber}</span>
                      </p>
                      <p className="text-xs text-[#06391C]/70 italic">{vh.notes}</p>
                    </div>

                    {/* Toggle Safe Button (44pt compliant) */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                          vh.isSafe
                            ? "bg-[#30D158]/15 text-[#06391C] border border-[#30D158]/30 font-extrabold"
                            : "bg-[#FF453A]/15 text-[#D70015] border border-[#FF453A]/30 font-extrabold"
                        }`}
                      >
                        {vh.isSafe ? "✓ Verified Safe" : "⚠ At-Risk / Unverified"}
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleVulnerableSafe(vh.id)}
                        className={`min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 ${
                          vh.isSafe
                            ? "bg-[#F4F9F5] text-[#06391C] hover:bg-[#EAF5EE] border border-[#06391C]/20"
                            : "bg-[#06391C] text-white hover:bg-[#074020]"
                        }`}
                      >
                        {vh.isSafe ? "Mark At-Risk" : "Mark Verified Safe"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 7. TAB 3: EMERGENCY RESPONSE UNITS DEPLOYMENT */}
        {activeTab === "teams" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#06391C]/15 shadow-apple-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#06391C]/10">
                <div>
                  <h3 className="text-2xl font-extrabold text-[#06391C]">
                    Barangay Quiling Emergency Response Units
                  </h3>
                  <p className="text-xs sm:text-sm text-[#06391C]/70 font-medium mt-1">
                    Specialized response divisions assigned to Barangay Quiling disaster operations
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold bg-[#EAF5EE] text-[#06391C] px-3.5 py-1.5 rounded-full border border-[#06391C]/15">
                    {deployedTeamsCount} Active Field Deployments
                  </span>
                </div>
              </div>

              {/* Teams Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {volunteerTeams.map((team) => (
                  <div
                    key={team.id}
                    className="rounded-2xl p-6 bg-[#F4F9F5] border border-[#06391C]/15 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#06391C]/10">
                        <h4 className="font-extrabold text-base text-[#06391C]">{team.name}</h4>
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            team.status === "deployed"
                              ? "bg-[#30D158]/20 text-[#06391C] border border-[#30D158]/40"
                              : "bg-blue-100 text-blue-900 border border-blue-200"
                          }`}
                        >
                          {team.status}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2 text-xs text-[#06391C]">
                        <p className="text-[11px] text-[#06391C]/70 font-bold uppercase tracking-wider">
                          {team.college}
                        </p>
                        <p className="font-semibold bg-white p-2.5 rounded-xl border border-[#06391C]/10">
                          <span className="font-extrabold">Primary Focus:</span> {team.focus}
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-1 font-semibold">
                          <div>
                            <span className="text-[10px] text-[#06391C]/80 block font-bold">Team Leader</span>
                            <span>{team.leader}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#06391C]/80 block font-bold">Hotline</span>
                            <span className="font-mono">{team.contactNumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#06391C]/10 flex items-center justify-between text-xs font-bold">
                      <span className="text-[#06391C]/70">
                        Active Tickets: <span className="text-[#06391C] font-extrabold">{team.assignedTicketsCount}</span>
                      </span>
                      {onOpenCall && (
                        <button
                          type="button"
                          onClick={() => onOpenCall("brgy-command")}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-[#EAF5EE] text-[#06391C] border border-[#06391C]/20 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-[#30D158]" />
                          <span>Radio Unit</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 8. TAB 4: OFFICIAL BULLETIN & FACT-CHECK CMS */}
        {activeTab === "cms" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form 1: Official Weather & Evacuation Advisory Publisher */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#06391C]/15 shadow-apple-sm space-y-5">
              <div className="flex items-center gap-2 pb-4 border-b border-[#06391C]/10">
                <div className="w-8 h-8 rounded-full bg-[#06391C]/10 flex items-center justify-center text-[#06391C]">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#06391C]">
                    Publish Community Advisory
                  </h3>
                  <p className="text-xs text-[#06391C]/70 font-medium">
                    Broadcast weather alerts and evacuation notices directly to the citizen portal
                  </p>
                </div>
              </div>

              <form onSubmit={handlePublishAdvisory} className="space-y-4 text-xs font-semibold">
                <div>
                  <label htmlFor="adv-title" className="block text-[#06391C] font-extrabold mb-1">
                    Advisory Headline *
                  </label>
                  <input
                    id="adv-title"
                    type="text"
                    required
                    value={advisoryTitle}
                    onChange={(e) => setAdvisoryTitle(e.target.value)}
                    placeholder="e.g. Signal No. 2 Weather Escalation: Lowland River Watch Active"
                    className="w-full px-4 py-3 min-h-[44px] rounded-xl border border-[#06391C]/20 bg-[#F4F9F5] text-[#06391C] placeholder-[#06391C]/50 focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="adv-sev" className="block text-[#06391C] font-extrabold mb-1">
                      Severity Level
                    </label>
                    <select
                      id="adv-sev"
                      value={advisorySeverity}
                      onChange={(e) => setAdvisorySeverity(e.target.value as any)}
                      className="w-full px-3 py-3 min-h-[44px] rounded-xl border border-[#06391C]/20 bg-[#F4F9F5] text-[#06391C] focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                    >
                      <option value="urgent">Urgent Warning</option>
                      <option value="warning">Precautionary Warning</option>
                      <option value="advisory">General Public Advisory</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="adv-dept" className="block text-[#06391C] font-extrabold mb-1">
                      Issuing Department
                    </label>
                    <select
                      id="adv-dept"
                      value={advisoryDept}
                      onChange={(e) => setAdvisoryDept(e.target.value as any)}
                      className="w-full px-3 py-3 min-h-[44px] rounded-xl border border-[#06391C]/20 bg-[#F4F9F5] text-[#06391C] focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                    >
                      <option value="rescue_evac">Rescue & Evacuation</option>
                      <option value="health_medical">Medical & Health</option>
                      <option value="relief_supplies">Food & Water Relief</option>
                      <option value="power_utilities">Power & Utilities</option>
                      <option value="public_info">Public Information</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="adv-purok" className="block text-[#06391C] font-extrabold mb-1">
                    Target Purok / Community
                  </label>
                  <input
                    id="adv-purok"
                    type="text"
                    value={advisoryPurok}
                    onChange={(e) => setAdvisoryPurok(e.target.value)}
                    placeholder="e.g. Purok 1 • Riverside or Barangay Quiling Wide"
                    className="w-full px-4 py-3 min-h-[44px] rounded-xl border border-[#06391C]/20 bg-[#F4F9F5] text-[#06391C] focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                  />
                </div>

                <div>
                  <label htmlFor="adv-msg" className="block text-[#06391C] font-extrabold mb-1">
                    Advisory Body & Instructions *
                  </label>
                  <textarea
                    id="adv-msg"
                    required
                    rows={4}
                    value={advisoryMessage}
                    onChange={(e) => setAdvisoryMessage(e.target.value)}
                    placeholder="Detail safety recommendations, shelter locations, and hotline instructions..."
                    className="w-full px-4 py-3 rounded-xl border border-[#06391C]/20 bg-[#F4F9F5] text-[#06391C] placeholder-[#06391C]/50 focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 min-h-[44px] rounded-full bg-[#06391C] hover:bg-[#074020] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Broadcast Advisory Immediately</span>
                </button>
              </form>
            </div>

            {/* Form 2: Ground Truth Anti-Rumor Debunker CMS */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#06391C]/15 shadow-apple-sm space-y-5">
              <div className="flex items-center gap-2 pb-4 border-b border-[#06391C]/10">
                <div className="w-8 h-8 rounded-full bg-[#30D158]/15 flex items-center justify-center text-[#06391C]">
                  <CheckCircle2 className="w-4 h-4 text-[#30D158]" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#06391C]">
                    Publish Ground Truth Fact-Check
                  </h3>
                  <p className="text-xs text-[#06391C]/70 font-medium">
                    Neutralize false group chat rumors and verify physical ground reality
                  </p>
                </div>
              </div>

              <form onSubmit={handlePublishDebunker} className="space-y-4 text-xs font-semibold">
                <div>
                  <label htmlFor="debunk-rumor" className="block text-[#D70015] font-extrabold mb-1">
                    Unverified Group Chat Rumor *
                  </label>
                  <input
                    id="debunk-rumor"
                    type="text"
                    required
                    value={rumorText}
                    onChange={(e) => setRumorText(e.target.value)}
                    placeholder="e.g. Water release from Batac dam will submerge Purok 1 within 1 hour"
                    className="w-full px-4 py-3 min-h-[44px] rounded-xl border border-red-200 bg-red-50/50 text-red-950 placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>

                <div>
                  <label htmlFor="debunk-impact" className="block text-[#06391C] font-extrabold mb-1">
                    Misinformation Impact Tag
                  </label>
                  <input
                    id="debunk-impact"
                    type="text"
                    value={rumorImpact}
                    onChange={(e) => setRumorImpact(e.target.value)}
                    placeholder="e.g. Causing panic evacuation through flood zone"
                    className="w-full px-4 py-3 min-h-[44px] rounded-xl border border-[#06391C]/20 bg-[#F4F9F5] text-[#06391C] placeholder-[#06391C]/50 focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                  />
                </div>

                <div>
                  <label htmlFor="debunk-fact-title" className="block text-[#06391C] font-extrabold mb-1">
                    Verified Ground Truth Headline *
                  </label>
                  <input
                    id="debunk-fact-title"
                    type="text"
                    required
                    value={factTitle}
                    onChange={(e) => setFactTitle(e.target.value)}
                    placeholder="e.g. Batac Dike & River Elevation Verified Normal by BDRRMC Patrol"
                    className="w-full px-4 py-3 min-h-[44px] rounded-xl border border-[#06391C]/20 bg-[#F4F9F5] text-[#06391C] placeholder-[#06391C]/50 focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                  />
                </div>

                <div>
                  <label htmlFor="debunk-fact-text" className="block text-[#06391C] font-extrabold mb-1">
                    Official Inspected Ground Truth Explanation *
                  </label>
                  <textarea
                    id="debunk-fact-text"
                    required
                    rows={3}
                    value={factText}
                    onChange={(e) => setFactText(e.target.value)}
                    placeholder="State exact inspection findings, water levels, and authoritative confirmation..."
                    className="w-full px-4 py-3 rounded-xl border border-[#06391C]/20 bg-[#F4F9F5] text-[#06391C] placeholder-[#06391C]/50 focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                  />
                </div>

                <div>
                  <label htmlFor="debunk-pst" className="block text-[#06391C] font-extrabold mb-1">
                    Official PST Timestamp
                  </label>
                  <input
                    id="debunk-pst"
                    type="text"
                    value={factPst}
                    onChange={(e) => setFactPst(e.target.value)}
                    placeholder="e.g. 20:30 PST"
                    className="w-full px-4 py-3 min-h-[44px] rounded-xl border border-[#06391C]/20 bg-[#F4F9F5] text-[#06391C] font-mono focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 min-h-[44px] rounded-full bg-[#06391C] hover:bg-[#074020] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#30D158]" />
                  <span>Publish Fact-Check to Ground Truth Section</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
