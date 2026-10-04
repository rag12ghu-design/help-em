"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Radio,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Zap,
  Droplets,
  Truck,
  ShieldCheck,
  UserCheck,
  PhoneCall,
  Info,
} from "lucide-react";
import { ModalMode, SubmissionReceipt } from "@/types/modal";
import { PurokNode } from "@/types/purok";
import { useResilience } from "@/context/ResilienceContext";
import { DepartmentType, CreateTicketInput } from "@/types/responder";

interface ActionModalProps {
  isOpen: boolean;
  mode: ModalMode;
  puroks: PurokNode[];
  initialPurokId?: string;
  onClose: () => void;
  onSuccess: (receipt: SubmissionReceipt) => void;
}

export default function ActionModal({
  isOpen,
  mode,
  puroks,
  initialPurokId = "purok-2",
  onClose,
  onSuccess,
}: ActionModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const { addTicket } = useResilience();

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [purokId, setPurokId] = useState(initialPurokId);
  const [emergencyType, setEmergencyType] = useState("Rising Flood / Water Surge");
  const [notes, setNotes] = useState("");
  const [urgentNeeds, setUrgentNeeds] = useState<string[]>(["Evacuation Shuttle"]);
  const [volunteerRole, setVolunteerRole] = useState("First Aid & Health Triage");
  const [householdMembers, setHouseholdMembers] = useState(4);
  const [aidIntent, setAidIntent] = useState<"request" | "donate">("request");
  const [resourceCategory, setResourceCategory] = useState("Emergency Generator Charging");
  const [stationName, setStationName] = useState("Barangay Hall Emergency Generator Hub");

  // Validation & Submission
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<SubmissionReceipt | null>(null);

  // Focus trap & Escape dismissal
  useEffect(() => {
    if (!isOpen) {
      setSubmittedReceipt(null);
      setPhoneError(null);
      setNameError(null);
      return;
    }

    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Sync initial purok
  useEffect(() => {
    if (initialPurokId) {
      setPurokId(initialPurokId);
    }
  }, [initialPurokId]);

  if (!isOpen) return null;

  // Validate Philippine phone: 09XXXXXXXXX (11 digits)
  const validatePhone = (value: string): boolean => {
    const cleanNumber = value.replace(/[\s-]/g, "");
    const phRegex = /^09\d{9}$/;
    if (!phRegex.test(cleanNumber)) {
      setPhoneError("Please enter a valid 11-digit Philippine mobile number starting with 09 (e.g. 09171234567).");
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const handleUrgentNeedToggle = (need: string) => {
    setUrgentNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let isValid = true;
    if (!name.trim()) {
      setNameError("Please enter your name.");
      isValid = false;
    } else {
      setNameError(null);
    }

    if (!validatePhone(phone)) {
      isValid = false;
    }

    if (!isValid) return;

    const matchedPurok = puroks.find((p) => p.id === purokId)?.name || "Barangay Quiling";
    const cleanPhone = phone.replace(/[\s-]/g, "");
    const generatedTicket = `#MMSU-${Math.floor(1000 + Math.random() * 9000)}`;

    let summary = "";
    let responderNote = "";

    if (mode === "sos") {
      summary = `SOS Alert: ${emergencyType} in ${matchedPurok}. Needs: ${urgentNeeds.join(", ") || "Immediate response"}.`;
      responderNote = "Dispatched to BDRRMC Rescue & Barangay Health Workers.";
    } else if (mode === "join") {
      summary = `Community Volunteer Network: ${name} (${volunteerRole}) enrolled for ${matchedPurok} (${householdMembers} household members).`;
      responderNote = "Assigned to Barangay Quiling Community Volunteer Roster.";
    } else {
      summary = `${aidIntent === "request" ? "Request" : "Offer"} for ${resourceCategory} at ${stationName}.`;
      responderNote = "Forwarded to Station Coordinator & BDRRMC Logistics Desk.";
    }

    let targetDept: DepartmentType = "rescue_evac";
    if (mode === "sos") {
      const et = emergencyType.toLowerCase();
      if (et.includes("medical") || et.includes("wound") || et.includes("oxygen")) {
        targetDept = "health_medical";
      } else if (et.includes("power") || et.includes("concentrator")) {
        targetDept = "power_utilities";
      } else {
        targetDept = "rescue_evac";
      }
    } else if (mode === "aid") {
      const rc = resourceCategory.toLowerCase();
      if (rc.includes("generator") || rc.includes("power") || rc.includes("charge")) {
        targetDept = "power_utilities";
      } else if (rc.includes("water") || rc.includes("food") || rc.includes("relief") || rc.includes("ration")) {
        targetDept = "relief_supplies";
      } else if (rc.includes("medical") || rc.includes("health") || rc.includes("first aid")) {
        targetDept = "health_medical";
      } else {
        targetDept = "rescue_evac";
      }
    } else if (mode === "join") {
      const vr = volunteerRole.toLowerCase();
      if (vr.includes("first aid") || vr.includes("health")) {
        targetDept = "health_medical";
      } else if (vr.includes("relief") || vr.includes("pack")) {
        targetDept = "relief_supplies";
      } else if (vr.includes("radio") || vr.includes("dispatch")) {
        targetDept = "power_utilities";
      } else {
        targetDept = "rescue_evac";
      }
    }

    try {
      const ticketInput: CreateTicketInput = {
        contactName: name.trim(),
        phone: cleanPhone,
        purokId,
        purokName: matchedPurok,
        source: mode === "sos" ? "sos" : mode === "aid" ? "aid" : "citizen_report",
        priority: mode === "sos" ? "critical" : mode === "aid" ? "medium" : "low",
        category: mode === "sos" ? emergencyType : mode === "aid" ? resourceCategory : volunteerRole,
        description: notes || summary,
        householdMembers: householdMembers,
        urgentNeeds: mode === "sos" ? urgentNeeds : [resourceCategory],
        responderNotes: responderNote,
        targetDepartment: targetDept,
      };
      addTicket(ticketInput);
    } catch (err) {
      console.warn("Could not save ticket to ResilienceContext:", err);
    }

    const receipt: SubmissionReceipt = {
      ticketId: generatedTicket,
      timestamp: new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) + " PST",
      mode,
      contactName: name.trim(),
      phone: cleanPhone,
      purok: matchedPurok,
      summary,
      responderNote,
    };

    setSubmittedReceipt(receipt);
    onSuccess(receipt);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-[28px] max-w-lg w-full p-5 sm:p-8 border border-[#06391C]/20 shadow-apple-lg relative max-h-[90vh] overflow-y-auto"
      >
        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#06391C]/5 hover:bg-[#06391C]/10 flex items-center justify-center text-[#06391C] transition-colors focus:outline-none focus:ring-2 focus:ring-[#06391C]"
        >
          <X className="w-4 h-4" />
        </button>

        {!submittedReceipt ? (
          <div>
            {/* Header Badge */}
            <div className="flex items-center gap-2 mb-2 pr-12">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  mode === "sos"
                    ? "bg-[#FF453A]/15 text-[#D70015] border border-[#FF453A]/30"
                    : mode === "join"
                    ? "bg-[#FBBF24]/20 text-[#06391C] border border-[#FBBF24]/40"
                    : "bg-[#0A84FF]/15 text-[#0066CC] border border-[#0A84FF]/30"
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>
                  {mode === "sos"
                    ? "Emergency SOS Dispatch"
                    : mode === "join"
                    ? "Community Volunteer Roster"
                    : "Barangay Mutual Aid Network"}
                </span>
              </span>
            </div>

            {/* Dialog Title */}
            <h2 id="modal-title" className="text-2xl font-extrabold text-[#06391C] tracking-tight mb-2 pr-12">
              {mode === "sos"
                ? "Immediate SOS Distress Broadcast"
                : mode === "join"
                ? "Enroll Household • Join Community Volunteer Network"
                : "Aid Station Resource Coordination"}
            </h2>

            <p className="text-xs text-[#06391C] mb-4 leading-relaxed font-semibold">
              {mode === "sos"
                ? "Send instant high-priority coordinates to the Barangay Quiling BDRRMC and Tanod patrol."
                : mode === "join"
                ? "Register your household head to receive welfare check-ins and emergency supplies."
                : "Coordinate clean water, generator charging, medical aid, or volunteer transport support."}
            </p>

            {/* The Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium" noValidate>
              {/* Field 1: Name */}
              <div>
                <label htmlFor="contact-name" className="block text-[#06391C] font-bold mb-1">
                  {mode === "join" ? "Household Head / Resident Full Name" : "Contact Person / Reporting Name"} *
                </label>
                <input
                  id="contact-name"
                  ref={firstInputRef}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder="e.g. Juan dela Cruz"
                  className={`w-full px-4 py-3 min-h-[44px] rounded-xl border bg-white text-[#06391C] placeholder-[#06391C]/60 font-semibold focus:outline-none focus:ring-2 ${
                    nameError
                      ? "border-[#FF453A] focus:ring-[#FF453A]"
                      : "border-[#06391C]/25 focus:ring-[#06391C]"
                  }`}
                />
                {nameError && (
                  <p className="text-[11px] text-[#FF453A] mt-1 font-semibold">{nameError}</p>
                )}
              </div>

              {/* Field 3: Philippine Mobile Phone */}
              <div>
                <label htmlFor="mobile-phone" className="block text-[#06391C] font-bold mb-1">
                  Philippine Mobile Number (09XXXXXXXXX) *
                </label>
                <input
                  id="mobile-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  onBlur={() => {
                    if (phone.trim()) validatePhone(phone);
                  }}
                  placeholder="e.g. 09171234567"
                  className={`w-full px-4 py-3 min-h-[44px] rounded-xl border bg-white text-[#06391C] placeholder-[#06391C]/60 font-mono font-semibold focus:outline-none focus:ring-2 ${
                    phoneError
                      ? "border-[#FF453A] focus:ring-[#FF453A]"
                      : "border-[#06391C]/25 focus:ring-[#06391C]"
                  }`}
                />
                {phoneError ? (
                  <p className="text-[11px] text-[#FF453A] mt-1 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>{phoneError}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-[#06391C] font-semibold mt-0.5">
                    11-digit mobile number for SMS verification & rescue contact.
                  </p>
                )}
              </div>

              {/* Field 4: Purok Selection */}
              <div>
                <label htmlFor="purok-selector" className="block text-[#06391C] font-semibold mb-1">
                  Target Purok / Location
                </label>
                <select
                  id="purok-selector"
                  value={purokId}
                  onChange={(e) => setPurokId(e.target.value)}
                  className="w-full px-3 py-3 min-h-[44px] rounded-xl border border-[#06391C]/20 bg-white text-[#06391C] focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                >
                  {puroks.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.statusText})
                    </option>
                  ))}
                </select>
              </div>

              {/* MODE SPECIFIC FIELDS */}
              {/* === MODE: SOS === */}
              {mode === "sos" && (
                <>
                  <div>
                    <label htmlFor="emergency-type" className="block text-[#06391C] font-semibold mb-1">
                      Urgent Emergency Type *
                    </label>
                    <select
                      id="emergency-type"
                      value={emergencyType}
                      onChange={(e) => setEmergencyType(e.target.value)}
                      className="w-full px-3 py-3 min-h-[44px] rounded-xl border border-[#06391C]/20 bg-white text-[#06391C] focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                    >
                      <option>Rising Flood / Water Surge</option>
                      <option>Medical Emergency / Wound Care</option>
                      <option>Infant / Senior Evacuation Needed</option>
                      <option>Oxygen Concentrator / Medical Power Loss</option>
                      <option>Structural Collapse / Roof Blown Away</option>
                    </select>
                  </div>

                  <div>
                    <span className="block text-[#06391C] font-semibold mb-1.5">
                      Immediate Support Needed (Select all that apply)
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {[
                        "Evacuation Shuttle",
                        "Medical First Aid Kit",
                        "Clean Water Jugs",
                        "Emergency Power Hub",
                        "Rescue Stretcher",
                        "Dry Blankets / Cot",
                      ].map((need) => (
                        <label
                          key={need}
                          className={`flex items-center gap-2 p-2.5 min-h-[44px] rounded-lg border cursor-pointer select-none transition-all ${
                            urgentNeeds.includes(need)
                              ? "bg-[#FF453A]/10 border-[#FF453A]/40 text-[#D70015] font-bold"
                              : "bg-white border-[#06391C]/20 text-[#06391C] font-semibold"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={urgentNeeds.includes(need)}
                            onChange={() => handleUrgentNeedToggle(need)}
                            className="rounded text-[#FF453A] focus:ring-[#FF453A]"
                          />
                          <span>{need}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sos-notes" className="block text-[#06391C] font-semibold mb-1">
                      Exact Landmark & Specific Situation
                    </label>
                    <textarea
                      id="sos-notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Yellow bungalow house near Riverside bridge, 2 seniors inside."
                      className="w-full px-3 py-2 rounded-xl border border-[#06391C]/20 bg-white text-[#06391C] placeholder-[#06391C]/40 focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                    />
                  </div>
                </>
              )}

              {/* === MODE: JOIN === */}
              {mode === "join" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="volunteer-role" className="block text-[#06391C] font-semibold mb-1">
                        Volunteer Skill / Role
                      </label>
                      <select
                        id="volunteer-role"
                        value={volunteerRole}
                        onChange={(e) => setVolunteerRole(e.target.value)}
                        className="w-full px-3 py-3 min-h-[44px] rounded-xl border border-[#06391C]/20 bg-white text-[#06391C] focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                      >
                        <option>First Aid & Health Triage</option>
                        <option>Flood Evacuation Assistant</option>
                        <option>Volunteer as Community Field Support</option>
                        <option>Relief Pack Distribution</option>
                        <option>Emergency Radio / Dispatch</option>
                        <option>Household Head / Resident</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="household-count" className="block text-[#06391C] font-semibold mb-1">
                        Household Members
                      </label>
                      <input
                        id="household-count"
                        type="number"
                        min="1"
                        max="20"
                        value={householdMembers}
                        onChange={(e) => setHouseholdMembers(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-3 min-h-[44px] rounded-xl border border-[#06391C]/20 bg-white text-[#06391C] focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* === MODE: AID === */}
              {mode === "aid" && (
                <>
                  <div className="flex rounded-full bg-[#06391C]/10 p-1">
                    <button
                      type="button"
                      onClick={() => setAidIntent("request")}
                      className={`flex-1 py-2.5 min-h-[44px] flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                        aidIntent === "request"
                          ? "bg-[#06391C] text-white shadow-xs"
                          : "text-[#06391C]/70 hover:text-[#06391C]"
                      }`}
                    >
                      Request Supplies
                    </button>
                    <button
                      type="button"
                      onClick={() => setAidIntent("donate")}
                      className={`flex-1 py-2.5 min-h-[44px] flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                        aidIntent === "donate"
                          ? "bg-[#06391C] text-white shadow-xs"
                          : "text-[#06391C]/70 hover:text-[#06391C]"
                      }`}
                    >
                      Donate / Offer Help
                    </button>
                  </div>

                  <div>
                    <label htmlFor="station-name" className="block text-[#06391C] font-semibold mb-1">
                      Target Aid Station
                    </label>
                    <select
                      id="station-name"
                      value={stationName}
                      onChange={(e) => setStationName(e.target.value)}
                      className="w-full px-3 py-3 min-h-[44px] rounded-xl border border-[#06391C]/20 bg-white text-[#06391C] focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                    >
                      <option>Barangay Hall Emergency Generator Hub (Purok 2)</option>
                      <option>Community Covered Court Evacuation Center (Purok 3)</option>
                      <option>Sitio Riverside Clean Water Refill Station (Purok 1)</option>
                      <option>Barangay Health & First Aid Outpost (Purok 2)</option>
                      <option>Barangay Patrol & Tricycle Emergency Shuttle (Purok 4)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="resource-category" className="block text-[#06391C] font-semibold mb-1">
                      Resource Category
                    </label>
                    <select
                      id="resource-category"
                      value={resourceCategory}
                      onChange={(e) => setResourceCategory(e.target.value)}
                      className="w-full px-3 py-3 min-h-[44px] rounded-xl border border-[#06391C]/20 bg-white text-[#06391C] focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                    >
                      <option>Emergency Generator Charging</option>
                      <option>Clean Potable Water (5-Gal Refill)</option>
                      <option>Evacuation Cot & Dry Blankets</option>
                      <option>First Aid / Pediatric Fever Meds</option>
                      <option>Tricycle Shuttle Transit</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="aid-details" className="block text-[#06391C] font-semibold mb-1">
                      Specific Quantity or Notes
                    </label>
                    <textarea
                      id="aid-details"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Need 2 phones charged for senior medicine reminders."
                      className="w-full px-3 py-2 rounded-xl border border-[#06391C]/20 bg-white text-[#06391C] placeholder-[#06391C]/40 focus:outline-none focus:ring-2 focus:ring-[#06391C]"
                    />
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full py-3.5 px-6 min-h-[44px] rounded-full text-white font-bold text-sm shadow-md transition-all mt-4 flex items-center justify-center gap-2 active:scale-[0.98] ${
                  mode === "sos"
                    ? "bg-[#FF453A] hover:bg-[#D70015] shadow-red-200"
                    : "bg-[#06391C] hover:bg-[#074020]"
                }`}
              >
                {mode === "sos" ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Broadcast Urgent SOS Now</span>
                  </>
                ) : mode === "join" ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Confirm Community Volunteer Registration</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Aid Station Dispatch</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* CONFIRMATION FEEDBACK RECEIPT VIEW */
          <div data-testid="submission-confirmation" className="py-4 space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#30D158]/15 text-[#30D158] flex items-center justify-center mx-auto border border-[#30D158]/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#06391C] font-black bg-black/5 px-2.5 py-1 rounded-full border border-[#06391C]/15">
                Ticket {submittedReceipt.ticketId} • {submittedReceipt.timestamp}
              </span>
              <h3 className="text-2xl font-extrabold text-[#06391C] mt-2 tracking-tight">
                {mode === "sos"
                  ? "Distress Alert Broadcasted"
                  : mode === "join"
                  ? "Community Volunteer Network Active"
                  : "Aid Request Recorded"}
              </h3>
              <p className="text-xs text-[#06391C] max-w-sm mx-auto mt-1 leading-relaxed font-semibold">
                {submittedReceipt.responderNote}
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-[#F4F9F5] rounded-2xl p-4 border border-[#06391C]/20 text-left text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-[#06391C]/15">
                <span className="text-[#06391C] font-semibold">Registered Name</span>
                <span className="font-bold text-[#06391C]">{submittedReceipt.contactName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#06391C]/15">
                <span className="text-[#06391C] font-semibold">Contact Number</span>
                <span className="font-mono font-bold text-[#06391C]">{submittedReceipt.phone}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#06391C]/15">
                <span className="text-[#06391C] font-semibold">Location</span>
                <span className="font-bold text-[#06391C]">{submittedReceipt.purok}</span>
              </div>
              <div className="pt-1">
                <span className="text-[#06391C] font-semibold block mb-0.5">Details:</span>
                <p className="text-[11px] text-[#06391C] font-semibold bg-white p-2 rounded-lg border border-[#06391C]/15">
                  {submittedReceipt.summary}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 min-h-[44px] flex items-center justify-center rounded-full bg-[#06391C] hover:bg-[#074020] text-white text-xs font-bold shadow-md transition-all"
            >
              Done & Return to Console
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
