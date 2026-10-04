import { DebunkerItem } from "@/types/debunker";

export const DEBUNKER_ITEMS: DebunkerItem[] = [
  {
    id: "debunk-1",
    rumor: "“May nagsabi gumuho daw ang dike sa Purok 1? Totoo ba? Lilipat na ba kami?”",
    rumorImpact: "Unverified forward • 34 shares • Causing panic",
    verifiedTitle: "Dike Inspection Fact-Check (Purok 1)",
    verifiedText:
      "RUMOR DEBUNKED: Barangay Captain and Municipal Disaster Engineers inspected the Purok 1 embankment at 19:15 PST. Dike is fully intact and water level is at a stable 2.1m safe threshold.",
    pstTime: "19:30 PST",
    purok: "Purok 1",
    badgeText: "Embankment Intact",
  },
  {
    id: "debunk-2",
    rumor: "“Wala raw kuryente buong linggo sa buong Batac at Laoag sabi ng kapitbahay.”",
    rumorImpact: "Unverified rumor from private Messenger group",
    verifiedTitle: "Power Restoration Schedule",
    verifiedText:
      "INEC line repair team is active along National Highway. Feeder 4 estimated back by 22:00 PST. Barangay Hall generator charging hub remains open 24/7 for phone charging.",
    pstTime: "19:42 PST",
    purok: "Purok 2",
    badgeText: "Feeder 4 Repair Active",
  },
  {
    id: "debunk-3",
    rumor: "“Walang pagkain sa evacuation center wag na kayo pumunta dun.”",
    rumorImpact: "False report discouraging evacuation of vulnerable seniors",
    verifiedTitle: "Evacuation Center Relief Status",
    verifiedText:
      "Barangay relief logistics and community volunteers delivered 150 hot rice porridge bowls and clean drinking water. Covered Court has dry cots, medical kits, and hygiene packs available.",
    pstTime: "19:50 PST",
    purok: "Purok 3",
    badgeText: "Relief Supplies Stocked",
  },
];
