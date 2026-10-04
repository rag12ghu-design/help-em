"use client";

import React from "react";
import Image from "next/image";
import { Radio, Phone, ShieldCheck, Heart } from "lucide-react";

interface FooterProps {
  onOpenCall?: (stationId?: string) => void;
}

export default function Footer({ onOpenCall }: FooterProps = {}) {
  return (
    <footer className="border-t border-[#06391C]/15 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-xs sm:text-sm">
        {/* Col 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 font-black text-[#06391C] text-sm sm:text-base">
            <Image
              src="/logo.png"
              alt="Help'Em Logo"
              width={28}
              height={28}
              className="w-7 h-7 rounded-full shadow-sm border border-[#06391C]/15 shrink-0 object-cover"
            />
            <span>Help&apos;Em • MMSU NSTP Initiative</span>
          </div>
          <p className="text-[#06391C] leading-relaxed font-semibold text-xs sm:text-sm">
            National Service Training Program (NSTP) Civic Welfare Training Service (CWTS)
            community disaster resilience and empowerment platform for Barangay Quiling.
          </p>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="font-black text-[#06391C] mb-3 uppercase tracking-wider text-xs sm:text-[13px]">
            Emergency Hotlines
          </h4>
          <ul className="space-y-2.5 text-[#06391C]">
            <li className="flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-2 font-medium">
                <Phone className="w-4 h-4 text-[#1B7340] shrink-0" />
                <span className="font-black text-[#06391C]">
                  Barangay Desk:{" "}
                  <a
                    href="tel:0917-889-6678"
                    className="underline hover:text-[#1B7340] transition-colors py-1 inline-block focus:outline-none focus:ring-2 focus:ring-[#1B7340] rounded relative before:absolute before:-inset-2 before:content-['']"
                    aria-label="Call Barangay Desk at 0917-889-MMSU"
                  >
                    0917-889-MMSU
                  </a>
                </span>
              </span>
              {onOpenCall && (
                <button
                  type="button"
                  onClick={() => onOpenCall("brgy-command")}
                  className="min-h-[44px] min-w-[44px] px-3.5 py-2 flex items-center justify-center rounded-full bg-[#30D158]/30 hover:bg-[#30D158]/45 text-[#06391C] text-xs font-black border border-[#30D158]/60 transition-all cursor-pointer shadow-xs"
                >
                  Call Live
                </button>
              )}
            </li>
            <li className="flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-2 font-medium">
                <Phone className="w-4 h-4 text-[#0066CC] shrink-0" />
                <span className="font-black text-[#06391C]">
                  MMSU Health Clinic:{" "}
                  <a
                    href="tel:0776000459"
                    className="underline hover:text-[#0066CC] transition-colors py-1 inline-block focus:outline-none focus:ring-2 focus:ring-[#0066CC] rounded relative before:absolute before:-inset-2 before:content-['']"
                    aria-label="Call MMSU Health Clinic at (077) 600-0459"
                  >
                    (077) 600-0459
                  </a>
                </span>
              </span>
              {onOpenCall && (
                <button
                  type="button"
                  onClick={() => onOpenCall("nstp-health")}
                  className="min-h-[44px] min-w-[44px] px-3.5 py-2 flex items-center justify-center rounded-full bg-[#0A84FF]/25 hover:bg-[#0A84FF]/35 text-[#004B99] text-xs font-black border border-[#0A84FF]/50 transition-all cursor-pointer shadow-xs"
                >
                  Call Live
                </button>
              )}
            </li>
            <li className="flex items-center gap-2 font-medium">
              <Phone className="w-4 h-4 text-[#D70015] shrink-0" />
              <span className="font-black text-[#06391C]">
                Batac CDRRMO:{" "}
                <a
                  href="tel:911"
                  className="underline hover:text-[#D70015] transition-colors py-1 inline-block focus:outline-none focus:ring-2 focus:ring-[#D70015] rounded relative before:absolute before:-inset-2 before:content-['']"
                  aria-label="Call Batac CDRRMO at 911"
                >
                  911
                </a>
                {" / "}
                <a
                  href="tel:161"
                  className="underline hover:text-[#D70015] transition-colors py-1 inline-block focus:outline-none focus:ring-2 focus:ring-[#D70015] rounded relative before:absolute before:-inset-2 before:content-['']"
                  aria-label="Call Batac CDRRMO at 161"
                >
                  161
                </a>
              </span>
            </li>
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h4 className="font-black text-[#06391C] mb-3 uppercase tracking-wider text-xs sm:text-[13px]">
            Institutional Partners
          </h4>
          <ul className="space-y-2 text-[#06391C] font-semibold text-xs sm:text-sm">
            <li className="font-black text-[#06391C]">Mariano Marcos State University (MMSU)</li>
            <li>NSTP-CWTS Disaster Management Unit</li>
            <li>Barangay Quiling BDRRM Council</li>
            <li>City Government of Batac</li>
          </ul>
        </div>

        {/* Col 4 */}
        <div>
          <h4 className="font-black text-[#06391C] mb-3 uppercase tracking-wider text-xs sm:text-[13px]">
            Civic Integrity
          </h4>
          <div className="space-y-2 text-[#06391C]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#30D158] shadow-xs" />
              <span className="font-black text-[#06391C] text-sm">Purok 1–5 Mesh Online</span>
            </div>
            <p className="font-semibold text-xs sm:text-sm">Dedicated to Barangay Disaster Resilience.</p>
            <p className="font-semibold text-xs sm:text-sm">© 2026 MMSU NSTP Project. Non-commercial civic public service.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
