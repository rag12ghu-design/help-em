import { CallStation } from "@/types/call";

export const CALL_STATIONS: CallStation[] = [
  {
    id: "brgy-command",
    name: "Barangay Quiling Command Desk",
    operator: "Kagawad Marcos (BDRRMC Officer)",
    frequency: "VHF 144.750 MHz",
    purok: "Purok 2 • Barangay Hall",
    avatarColor: "#30D158",
    greeting: "Help'Em Barangay Quiling Command Desk online. Stay calm, emergency assistance is on standby.",
    role: "Incident Command & Phone Charging Hub",
  },
  {
    id: "nstp-health",
    name: "Barangay Health Outpost",
    operator: "Barangay Health Nurse Ramos & Health Responders",
    frequency: "VHF 145.200 MHz",
    purok: "Purok 2 • Barangay Clinic",
    avatarColor: "#0A84FF",
    greeting: "Barangay Health Outpost standing by. State your medical or first-aid emergency.",
    role: "First Aid, BP Triage & Pediatric Kits",
  },
  {
    id: "tanod-shuttle",
    name: "Barangay Patrol & Shuttle",
    operator: "Tanod Commander Valdez",
    frequency: "VHF 145.850 MHz",
    purok: "Purok 4 • Lowland Transit",
    avatarColor: "#FF9F0A",
    greeting: "Barangay Patrol mobile unit receiving. State your location and household count for evacuation transport.",
    role: "Assisted Evacuation & Infant Transit",
  },
];
