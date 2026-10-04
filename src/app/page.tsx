"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CheckCircle2, ShieldCheck, X } from "lucide-react";
import Navigation from "@/components/Navigation";
import SOSConsole from "@/components/SOSConsole";
import DebunkerSection from "@/components/DebunkerSection";
import AidDirectory from "@/components/AidDirectory";
import MobilizationTerminal from "@/components/MobilizationTerminal";
import Footer from "@/components/Footer";
import ActionModal from "@/components/ActionModal";
import EmergencyCallModal from "@/components/EmergencyCallModal";
import FloatingCallWidget from "@/components/FloatingCallWidget";
import CitizenCaseTracker from "@/components/CitizenCaseTracker";
import ResponderOperationsDesk from "@/components/ResponderOperationsDesk";
import { ResilienceProvider, useResilience } from "@/context/ResilienceContext";
import { PUROK_NODES } from "@/data/puroks";
import { ModalMode, SubmissionReceipt } from "@/types/modal";
import { AidStation } from "@/types/resources";

if (typeof window !== "undefined" && typeof (globalThis as any).localStorage === "undefined" && (window as any).localStorage) {
  try {
    (globalThis as any).localStorage = (window as any).localStorage;
  } catch {
    // Ignore
  }
}

export default function HelpEmLandingPage() {
  return (
    <ResilienceProvider>
      <HelpEmApp />
    </ResilienceProvider>
  );
}

function HelpEmApp() {
  const {
    role,
    isSafe,
    safeCount,
    totalHouseholds,
    toggleSafe,
  } = useResilience();

  // Map layer toggle: "community" vs "radar"
  const [mapLayer, setMapLayer] = useState<"community" | "radar">("community");
  const [selectedPurokId, setSelectedPurokId] = useState<string>("purok-2");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("join");

  // On-Site Emergency Call State
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callStationId, setCallStationId] = useState("brgy-command");

  // Feedback Toast Banner
  const [activeToast, setActiveToast] = useState<{
    title: string;
    description: string;
    type: "success" | "info";
  } | null>(null);

  // Toggle Household Safe Status
  const handleToggleSafe = () => {
    const nextSafe = !isSafe;
    toggleSafe();
    if (nextSafe) {
      showToast(
        "Household Recorded as Safe",
        "Your family status is synchronized with Barangay Quiling emergency responders.",
        "success"
      );
    } else {
      showToast(
        "Safety Status Unchecked",
        "Your household remains marked for welfare monitoring.",
        "info"
      );
    }
  };

  const showToast = (title: string, description: string, type: "success" | "info" = "success") => {
    setActiveToast({ title, description, type });
    setTimeout(() => {
      setActiveToast((current) => (current?.title === title ? null : current));
    }, 4500);
  };

  const handleOpenModal = (mode: ModalMode) => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleOpenCall = (stationId = "brgy-command") => {
    setCallStationId(stationId);
    setIsCallOpen(true);
  };

  const handleConnectToAidStation = (station: AidStation) => {
    setModalMode("aid");
    setIsModalOpen(true);
  };

  const handleModalSuccess = (receipt: SubmissionReceipt) => {
    showToast(
      `Dispatch Ticket ${receipt.ticketId} Created`,
      `${receipt.contactName} (${receipt.purok}) — ${receipt.responderNote}`,
      "success"
    );
  };

  const activePurok = PUROK_NODES.find((p) => p.id === selectedPurokId) || PUROK_NODES[1];

  return (
    <div
      className="relative min-h-screen bg-white text-[#06391C] selection:bg-[#06391C] selection:text-white"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(6, 57, 28, 0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(6, 57, 28, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: "36px 36px",
      }}
    >
      {/* FLOATING CONFIRMATION TOAST NOTIFICATION */}
      {activeToast && (
        <aside
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-full bg-[#06391C] text-white shadow-apple-lg border border-white/20 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md w-[92%]"
        >
          <div className="w-6 h-6 rounded-full bg-[#30D158] flex items-center justify-center text-[#06391C] shrink-0">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black truncate">{activeToast.title}</p>
            <p className="text-[11px] text-white/95 font-medium truncate">{activeToast.description}</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveToast(null)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] -mr-2 rounded-full hover:bg-white/15 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss toast notification"
          >
            <X className="w-4 h-4" />
          </button>
        </aside>
      )}

      {/* 1. TOP HEADER & FLOATING DYNAMIC ISLAND */}
      <Navigation
        onOpenApp={() => handleOpenModal("join")}
        onOpenCall={() => handleOpenCall("brgy-command")}
      />

      {/* DUAL-ACCESS CONDITIONAL VIEW RENDERING */}
      {role === "responder" ? (
        <main>
          <ResponderOperationsDesk onOpenCall={handleOpenCall} />
        </main>
      ) : (
        <>
          {/* 2. COMMUNITY RESIDENT HERO SECTION MATCHING BASIS-HERO COMPOSITION */}
          <main>
            <section className="pt-6 sm:pt-8 md:pt-10 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
                {/* Left Column: Headline & Apple Frosted Glass Emergency SOS Console */}
                <div className="lg:col-span-7 flex flex-col justify-center">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#06391C] leading-[1.08] mb-6 sm:mb-8">
                    When the storm hits, <br />
                    neighbors take flight.
                  </h1>

                  {/* EMERGENCY SOS CONSOLE WITH PUROK MAP / RADAR & SAFETY CHECK-IN */}
                  <SOSConsole
                    puroks={PUROK_NODES}
                    selectedPurokId={selectedPurokId}
                    onSelectPurok={setSelectedPurokId}
                    activePurok={activePurok}
                    mapLayer={mapLayer}
                    onSetMapLayer={setMapLayer}
                    isSafe={isSafe}
                    safeCount={safeCount}
                    totalHouseholds={totalHouseholds}
                    onToggleSafe={handleToggleSafe}
                    onOpenModal={handleOpenModal}
                    onOpenCall={handleOpenCall}
                  />
                </div>

                {/* Right Column: Hero Star (3D MMSU Stallion Mascot Thumbs-Up) */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center relative isolate">
                  {/* Ambient backlight glow */}
                  <div
                    className="absolute w-72 sm:w-[380px] md:w-[440px] lg:w-[480px] xl:w-[520px] h-72 sm:h-[380px] md:h-[440px] lg:h-[480px] xl:h-[520px] rounded-full bg-gradient-to-tr from-[#30D158]/35 via-[#1B7340]/25 to-[#FBBF24]/20 blur-3xl pointer-events-none -z-10 animate-pulse"
                    style={{ animationDuration: "5s" }}
                    aria-hidden="true"
                  />

                  {/* Floating mascot container */}
                  <div className="relative flex flex-col items-center justify-center">
                    <div
                      onClick={() => handleOpenCall("brgy-command")}
                      className="relative w-[280px] sm:w-[340px] md:w-[390px] lg:w-[430px] xl:w-[470px] max-w-full aspect-[3/4] flex items-center justify-center group cursor-pointer animate-float-mascot select-none"
                      title="Click walkie-talkie to start emergency radio call"
                    >
                      <Image
                        src="/mascot/mascot-thumbsup.png"
                        alt="Official 3D MMSU Stallion Mascot giving thumbs up with emergency walkie-talkie in green jersey and shorts"
                        fill
                        priority
                        className="object-contain drop-shadow-[0_25px_35px_rgba(6,57,28,0.25)] transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>

                    {/* Perspective Ground Shadow */}
                    <div
                      className="w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 h-3.5 sm:h-4.5 bg-[#06391C]/35 rounded-[100%] blur-sm mt-1 pointer-events-none animate-float-shadow"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 3. GROUND TRUTH DEBUNKER SECTION */}
            <DebunkerSection />

            {/* 4. BARANGAY MUTUAL AID NETWORK */}
            <AidDirectory onConnectToStation={handleConnectToAidStation} />

            {/* 5. MOBILIZATION TERMINAL (FINAL REGISTRATION CTA) */}
            <MobilizationTerminal onEnroll={() => handleOpenModal("join")} />
          </main>

          {/* CITIZEN ACTIVE CASE TRACKER */}
          <CitizenCaseTracker onOpenCall={handleOpenCall} />
        </>
      )}

      {/* 6. APPLE HIG FOOTER */}
      <Footer onOpenCall={handleOpenCall} />

      {/* 7. ACTION DISPATCH & ENROLLMENT MODAL */}
      <ActionModal
        isOpen={isModalOpen}
        mode={modalMode}
        puroks={PUROK_NODES}
        initialPurokId={selectedPurokId}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* 8. ON-SITE EMERGENCY CALL MODAL (MESSENGER / FACETIME AUDIO STYLE) */}
      <EmergencyCallModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        initialStationId={callStationId}
      />

      {/* 9. FLOATING BOTTOM-RIGHT CALL WIDGET */}
      <FloatingCallWidget
        onOpenCall={handleOpenCall}
        isCallActive={isCallOpen}
      />
    </div>
  );
}
