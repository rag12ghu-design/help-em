"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  HeartPulse,
  Bus,
  Minimize2,
  Maximize2,
  AlertTriangle,
  Send,
  CheckCircle2,
  Signal,
  X,
} from "lucide-react";
import { CALL_STATIONS } from "@/data/callStations";
import { CallStation, CallStatus, CallLogMessage } from "@/types/call";
import { soundEngine } from "@/utils/audioEffects";

interface EmergencyCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStationId?: string;
}

export default function EmergencyCallModal({
  isOpen,
  onClose,
  initialStationId = "brgy-command",
}: EmergencyCallModalProps) {
  const [selectedStationId, setSelectedStationId] = useState<string>(initialStationId);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [messages, setMessages] = useState<CallLogMessage[]>([]);
  const [customNote, setCustomNote] = useState<string>("");

  const activeStation =
    CALL_STATIONS.find((s) => s.id === selectedStationId) || CALL_STATIONS[0];

  // Timer interval ref
  const timerRef = useRef<any>(null);

  // Synchronize initialStationId
  useEffect(() => {
    if (initialStationId) {
      setSelectedStationId(initialStationId);
    }
  }, [initialStationId]);

  // Handle Call Timer
  useEffect(() => {
    if (callStatus === "connected") {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callStatus]);

  // Clean up sounds on unmount
  useEffect(() => {
    return () => {
      soundEngine.stopRinging();
      soundEngine.stopSpeech();
    };
  }, []);

  // Format Duration seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Start Call Sequence
  const handleStartCall = (station?: CallStation) => {
    const target = station || activeStation;
    setSelectedStationId(target.id);
    setCallStatus("calling");
    setCallDuration(0);
    setIsMinimized(false);

    setMessages([
      {
        id: `sys-${Date.now()}`,
        sender: "system",
        text: `Initiating peer-to-peer radio link to ${target.name} (${target.frequency})...`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    // Start ringing audio
    soundEngine.startRinging();

    // Auto-connect after 2.4 seconds (Messenger/Apple simulated pickup)
    setTimeout(() => {
      soundEngine.stopRinging();
      soundEngine.playConnectChirp();
      setCallStatus("connected");

      setMessages((prev) => [
        ...prev,
        {
          id: `disp-${Date.now()}`,
          sender: "dispatcher",
          text: target.greeting,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      // Speak greeting
      soundEngine.speakGreeting(target.greeting);
    }, 2400);
  };

  // Hang Up / End Call
  const handleEndCall = () => {
    soundEngine.stopRinging();
    soundEngine.stopSpeech();
    soundEngine.playHangup();
    setCallStatus("ended");

    setMessages((prev) => [
      ...prev,
      {
        id: `sys-end-${Date.now()}`,
        sender: "system",
        text: `Call terminated (${formatTime(callDuration)}). Incident Log #HQ-${Math.floor(
          1000 + Math.random() * 9000
        )} transmitted to Barangay Quiling Emergency Dispatch Desk.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Reset and Close
  const handleDismiss = () => {
    soundEngine.stopRinging();
    soundEngine.stopSpeech();
    setCallStatus("idle");
    setCallDuration(0);
    setIsMinimized(false);
    onClose();
  };

  // Toggle Mute
  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.playPTTClick(next);
      return next;
    });
  };

  // Toggle Speaker
  const handleToggleSpeaker = () => {
    setIsSpeakerOn((prev) => {
      const next = !prev;
      soundEngine.playPTTClick(next);
      return next;
    });
  };

  // Push to talk start
  const handlePTTDown = () => {
    if (callStatus !== "connected") return;
    setIsTransmitting(true);
    soundEngine.playPTTClick(true);
  };

  // Push to talk stop
  const handlePTTUp = () => {
    if (callStatus !== "connected") return;
    setIsTransmitting(false);
    soundEngine.playPTTClick(false);
    soundEngine.playStaticBurst(0.06, 0.03);
  };

  // Send quick dispatch tag
  const handleSendQuickTag = (tagText: string) => {
    if (callStatus !== "connected") return;
    soundEngine.playPTTClick(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text: tagText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    // Dispatcher auto-acknowledgement after brief delay
    setTimeout(() => {
      soundEngine.playStaticBurst(0.04, 0.02);
      setMessages((prev) => [
        ...prev,
        {
          id: `disp-ack-${Date.now()}`,
          sender: "dispatcher",
          text: `Acknowledged: "${tagText}". Barangay emergency responders logged this alert for priority dispatch.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1200);
  };

  // Send custom text message
  const handleSendCustomNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNote.trim() || callStatus !== "connected") return;
    handleSendQuickTag(customNote.trim());
    setCustomNote("");
  };

  if (!isOpen) return null;

  // MINIMIZED PICTURE-IN-PICTURE (PIP) FLOATING CAPSULE
  if (isMinimized) {
    return (
      <aside
        data-testid="minimized-call-pill"
        role="region"
        aria-label="Active emergency call in progress"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#06391C] text-white border-2 border-[#30D158]/60 shadow-2xl backdrop-blur-xl animate-fade-in"
      >
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="min-h-[44px] min-w-[44px] flex items-center gap-2.5 text-left cursor-pointer group"
          title="Click to expand call window"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30D158] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#30D158]" />
          </span>

          <div className="flex flex-col">
            <span className="text-xs font-black leading-none text-white group-hover:text-[#30D158] transition-colors">
              {activeStation.name}
            </span>
            <span className="text-[11px] font-mono font-bold text-white">
              {callStatus === "calling" ? "Ringing..." : formatTime(callDuration)}
            </span>
          </div>

          {/* Mini Sound Waveform Indicator */}
          {callStatus === "connected" && (
            <div className="flex items-center gap-0.5 h-3 px-1">
              <span className="w-0.5 h-2 bg-[#30D158] animate-pulse" />
              <span className="w-0.5 h-3 bg-[#30D158] animate-bounce" />
              <span className="w-0.5 h-1.5 bg-[#30D158] animate-pulse" />
            </div>
          )}
        </button>

        {/* Quick Mute in Minimized Capsule */}
        {callStatus === "connected" && (
          <button
            type="button"
            onClick={handleToggleMute}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isMuted ? "bg-red-500/20 text-red-400" : "bg-white/10 hover:bg-white/20 text-white"
            }`}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        {/* End Call Button */}
        <button
          type="button"
          onClick={handleEndCall}
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors cursor-pointer"
          title="End Call"
        >
          <PhoneOff className="w-4 h-4" />
        </button>

        {/* Expand Button */}
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Expand"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  // FULL CALL SHEET / MODAL (Apple Human Interface Guidelines & Messenger Aesthetic)
  return (
    <div
      data-testid="emergency-call-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-call-title"
    >
      <div className="relative w-full max-w-lg rounded-[32px] bg-[#071F11] border border-[#30D158]/50 text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Dynamic Island Header Bar */}
        <div className="px-5 py-3.5 border-b border-white/15 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-full bg-[#06391C] border border-[#30D158]/50 flex items-center gap-2 text-xs font-black text-white shadow-xs">
              <Radio className="w-3.5 h-3.5 text-[#30D158] animate-pulse" />
              <span>{activeStation.frequency}</span>
            </div>
            <span className="text-xs text-white font-mono font-bold hidden sm:inline">
              VHF Mesh Direct
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Minimize / PiP button */}
            {callStatus !== "idle" && callStatus !== "ended" && (
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                title="Minimize call to floating capsule"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Close window"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Station Channel Selector (Tabs) */}
        {callStatus === "idle" && (
          <div className="px-5 pt-4 pb-2 border-b border-white/10">
            <span className="text-xs font-black uppercase tracking-wider text-white block mb-2">
              Select Dispatch Station to Call
            </span>
            <div className="grid grid-cols-3 gap-2">
              {CALL_STATIONS.map((station) => (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => setSelectedStationId(station.id)}
                  className={`min-h-[44px] min-w-[44px] p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedStationId === station.id
                      ? "bg-[#06391C] border-2 border-[#30D158] shadow-apple-pill"
                      : "bg-white/15 border-white/25 hover:bg-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    {station.id === "brgy-command" && (
                      <Radio className="w-4 h-4 text-[#30D158]" />
                    )}
                    {station.id === "nstp-health" && (
                      <HeartPulse className="w-4 h-4 text-[#0A84FF]" />
                    )}
                    {station.id === "tanod-shuttle" && (
                      <Bus className="w-4 h-4 text-[#FF9F0A]" />
                    )}
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/80 text-white border border-white/30">
                      {station.purok.split(" • ")[0]}
                    </span>
                  </div>
                  <span className="text-xs font-black text-white leading-tight line-clamp-1">
                    {station.name}
                  </span>
                  <span className="text-xs text-white/95 line-clamp-1 mt-0.5 font-semibold">
                    {station.operator.split(" (")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Center Call Canvas (Avatar & Waveforms) */}
        <div className="p-6 flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-b from-transparent via-[#06391C]/25 to-black/40">
          {/* Animated Waveform / Ripple Container */}
          <div className="relative mb-4 flex items-center justify-center">
            {/* Calling Pulse Rings */}
            {callStatus === "calling" && (
              <>
                <span className="absolute w-32 h-32 rounded-full border border-[#30D158]/40 animate-ping" />
                <span className="absolute w-28 h-28 rounded-full border border-[#30D158]/60 animate-pulse" />
              </>
            )}

            {/* Connected Animated Glow Ring */}
            {callStatus === "connected" && (
              <span
                className={`absolute w-28 h-28 rounded-full border-2 transition-all duration-300 ${
                  isTransmitting
                    ? "border-[#FF453A] animate-ping"
                    : "border-[#30D158]/70 animate-pulse"
                }`}
              />
            )}

            {/* Avatar Circle */}
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl relative z-10 transition-transform ${
                callStatus === "connected" ? "scale-105" : ""
              }`}
              style={{
                backgroundColor:
                  activeStation.id === "brgy-command"
                    ? "#06391C"
                    : activeStation.id === "nstp-health"
                    ? "#0A3D62"
                    : "#61380B",
                border: `3px solid ${activeStation.avatarColor}`,
              }}
            >
              {activeStation.id === "brgy-command" && (
                <Radio className="w-9 h-9 text-[#30D158]" />
              )}
              {activeStation.id === "nstp-health" && (
                <HeartPulse className="w-9 h-9 text-[#0A84FF]" />
              )}
              {activeStation.id === "tanod-shuttle" && (
                <Bus className="w-9 h-9 text-[#FF9F0A]" />
              )}
            </div>
          </div>

          {/* Caller Identity */}
          <h3
            id="emergency-call-title"
            className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1.5"
          >
            {activeStation.name}
          </h3>
          <p className="text-xs sm:text-sm text-white font-bold mb-2">
            {activeStation.operator} • {activeStation.purok}
          </p>

          {/* Status & Timer */}
          <div className="flex items-center gap-2 mb-3">
            {callStatus === "idle" && (
              <span className="text-xs sm:text-sm text-white font-medium">
                Ready to transmit voice over local community mesh
              </span>
            )}
            {callStatus === "calling" && (
              <span className="text-sm sm:text-base font-black text-[#30D158] flex items-center gap-2">
                <span className="animate-spin w-3.5 h-3.5 border-2 border-[#30D158] border-t-transparent rounded-full" />
                Ringing Barangay Desk...
              </span>
            )}
            {callStatus === "connected" && (
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30D158] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#30D158]" />
                </span>
                <span className="text-lg font-mono font-black text-white tracking-wider">
                  {formatTime(callDuration)}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-[#30D158] font-black border border-white/30">
                  {isTransmitting ? "TRANSMITTING..." : "LISTENING"}
                </span>
              </div>
            )}
            {callStatus === "ended" && (
              <span className="text-sm font-bold text-white">
                Call Ended • Total Duration: {formatTime(callDuration)}
              </span>
            )}
          </div>

          {/* Dynamic Audio Visualizer Frequency Bars */}
          {callStatus === "connected" && (
            <div className="flex items-center justify-center gap-1.5 h-8 w-48 mb-2">
              {[40, 75, 100, 60, 90, 45, 80, 55, 30].map((height, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isTransmitting
                      ? "bg-[#FF453A]"
                      : isMuted
                      ? "bg-white/20 h-1.5"
                      : "bg-[#30D158]"
                  }`}
                  style={{
                    height: isMuted
                      ? "4px"
                      : isTransmitting
                      ? `${Math.max(6, (height * 0.35) % 28)}px`
                      : `${Math.max(4, (height * 0.28) % 24)}px`,
                    animation:
                      isMuted || !isSpeakerOn
                        ? "none"
                        : `pulse ${0.4 + (i % 3) * 0.2}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Live Incident Transcript / Messages Log */}
        {callStatus !== "idle" && (
          <div className="px-5 py-3.5 bg-black/50 border-y border-white/15 max-h-40 overflow-y-auto space-y-2 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2.5 rounded-xl leading-relaxed ${
                  msg.sender === "system"
                    ? "bg-white/15 text-white font-mono text-xs border border-white/20"
                    : msg.sender === "dispatcher"
                    ? "bg-[#06391C] border border-[#30D158]/60 text-white font-semibold text-xs sm:text-sm shadow-xs"
                    : "bg-[#0A3D62] border border-[#0A84FF]/60 text-white font-semibold text-xs sm:text-sm text-right shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-white/90 font-bold mb-1">
                  <span className="capitalize">{msg.sender}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick Dispatch Action Tags (When Connected) */}
        {callStatus === "connected" && (
          <div className="px-5 pt-3 pb-2.5 bg-black/40">
            <span className="text-xs font-black uppercase tracking-wider text-white block mb-2">
              Quick Transmit Alerts
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleSendQuickTag("💧 Flood rising rapidly in our sitio")}
                className="min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors border border-white/30 shadow-xs cursor-pointer flex items-center justify-center"
              >
                💧 Flood Rising
              </button>
              <button
                type="button"
                onClick={() => handleSendQuickTag("🩺 Medical kit & wound dressing needed")}
                className="min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors border border-white/30 shadow-xs cursor-pointer flex items-center justify-center"
              >
                🩺 Medical Kit
              </button>
              <button
                type="button"
                onClick={() => handleSendQuickTag("🚐 Requesting evacuation shuttle for 3 elders")}
                className="min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors border border-white/30 shadow-xs cursor-pointer flex items-center justify-center"
              >
                🚐 Evac Shuttle
              </button>
              <button
                type="button"
                onClick={() => handleSendQuickTag("⚡ Power out; battery below 10%")}
                className="min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors border border-white/30 shadow-xs cursor-pointer flex items-center justify-center"
              >
                ⚡ Power Request
              </button>
            </div>
          </div>
        )}

        {/* Push-to-Talk (PTT) Bar When Connected */}
        {callStatus === "connected" && (
          <div className="px-5 py-2.5 bg-black/50 flex items-center justify-center">
            <button
              type="button"
              onMouseDown={handlePTTDown}
              onMouseUp={handlePTTUp}
              onTouchStart={handlePTTDown}
              onTouchEnd={handlePTTUp}
              className={`w-full min-h-[44px] min-w-[44px] py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all select-none cursor-pointer ${
                isTransmitting
                  ? "bg-[#FF453A] text-white shadow-lg scale-[0.99]"
                  : "bg-white/25 hover:bg-white/35 text-white active:scale-95 border border-white/30"
              }`}
            >
              <Radio className={`w-4 h-4 ${isTransmitting ? "animate-spin" : ""}`} />
              <span>
                {isTransmitting
                  ? "Transmitting Audio Over Mesh..."
                  : "Hold to Transmit Voice (PTT Walkie-Talkie)"}
              </span>
            </button>
          </div>
        )}

        {/* Call Controls Footer (Messenger / Apple Call Style) */}
        <div className="p-5 border-t border-white/15 bg-black/70 flex items-center justify-around">
          {callStatus === "idle" && (
            <button
              type="button"
              onClick={() => handleStartCall()}
              className="w-full py-3.5 px-6 rounded-full bg-[#30D158] hover:bg-[#28B84D] text-[#06391C] font-black text-base flex items-center justify-center gap-2 shadow-apple-pill transition-all active:scale-98 cursor-pointer"
            >
              <PhoneCall className="w-5 h-5" />
              <span>Call {activeStation.name}</span>
            </button>
          )}

          {callStatus === "calling" && (
            <button
              type="button"
              onClick={handleEndCall}
              className="py-3.5 px-8 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-apple-pill transition-all active:scale-98 cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Cancel Call</span>
            </button>
          )}

          {callStatus === "connected" && (
            <div className="flex items-center justify-center gap-6 w-full">
              {/* Mute Mic */}
              <button
                type="button"
                onClick={handleToggleMute}
                className={`min-h-[44px] min-w-[44px] flex flex-col items-center gap-1 text-xs cursor-pointer ${
                  isMuted ? "text-red-400 font-bold" : "text-white font-bold hover:text-white"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isMuted ? "bg-red-500/25 border border-red-500 text-red-400" : "bg-white/15 hover:bg-white/25 text-white"
                  }`}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </div>
                <span>{isMuted ? "Muted" : "Mute"}</span>
              </button>

              {/* End Call Button (Big Red Circle) */}
              <button
                type="button"
                onClick={handleEndCall}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-lg transition-transform cursor-pointer"
                title="End Emergency Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              {/* Speaker Toggle */}
              <button
                type="button"
                onClick={handleToggleSpeaker}
                className={`min-h-[44px] min-w-[44px] flex flex-col items-center gap-1 text-xs cursor-pointer ${
                  isSpeakerOn ? "text-[#30D158] font-bold" : "text-white font-bold hover:text-white"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isSpeakerOn
                      ? "bg-[#30D158]/25 border border-[#30D158] text-[#30D158]"
                      : "bg-white/15 hover:bg-white/25 text-white"
                  }`}
                >
                  {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <span>{isSpeakerOn ? "Speaker" : "Ear"}</span>
              </button>
            </div>
          )}

          {callStatus === "ended" && (
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => handleStartCall()}
                className="flex-1 min-h-[44px] min-w-[44px] py-3.5 px-4 rounded-full bg-[#06391C] border-2 border-[#30D158] hover:bg-[#074020] text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-[#30D158]" />
                <span>Call Again</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="flex-1 min-h-[44px] min-w-[44px] py-3.5 px-4 rounded-full bg-white/15 hover:bg-white/25 text-white font-black text-xs border border-white/20 flex items-center justify-center transition-all cursor-pointer"
              >
                <span>Dismiss</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
