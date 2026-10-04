import { DepartmentInfo, DepartmentType } from "@/types/responder";

export const RESCUE_DEPARTMENTS: DepartmentInfo[] = [
  {
    id: "rescue_evac",
    name: "Rescue, Evacuation & Flood Operations",
    shortName: "Rescue & Evac",
    leadAgency: "Barangay Quiling BDRRMC & Batac CDRRMO",
    supportDivision: "BDRRMC Search & Rescue Division",
    nstpPartnerCollege: "BDRRMC Search & Rescue Division",
    icon: "ShieldAlert",
    hotline: "0917-889-MMSU",
    color: "#FF453A",
  },
  {
    id: "health_medical",
    name: "Health, Triage & Medical First Response",
    shortName: "Medical & Health",
    leadAgency: "Barangay Health Station & MMSU Medical Clinic",
    supportDivision: "Barangay Health Station & Municipal Clinic",
    nstpPartnerCollege: "Barangay Health Station & Municipal Clinic",
    icon: "HeartPulse",
    hotline: "(077) 600-0459",
    color: "#30D158",
  },
  {
    id: "relief_supplies",
    name: "Food Relief, Potable Water & Shelter Logistics",
    shortName: "Food & Water Relief",
    leadAgency: "Covered Court Evacuation Hub & DSWD Desk",
    supportDivision: "MSWDO Relief Logistics Division",
    nstpPartnerCollege: "MSWDO Relief Logistics Division",
    icon: "Droplets",
    hotline: "0917-889-AID1",
    color: "#0A84FF",
  },
  {
    id: "power_utilities",
    name: "Power, Generator Hub & Critical Utilities",
    shortName: "Power & Utilities",
    leadAgency: "Barangay Hall Emergency Generator Post",
    supportDivision: "Barangay Power & Radio Communications",
    nstpPartnerCollege: "Barangay Power & Radio Communications",
    icon: "Zap",
    hotline: "0917-889-PWR2",
    color: "#FF9F0A",
  },
  {
    id: "public_info",
    name: "Public Information & Anti-Rumor Fact-Check Desk",
    shortName: "Public Info & Truth",
    leadAgency: "Barangay Quiling BDRRMC & City Disaster Office",
    supportDivision: "City Information Office & Barangay Public Desk",
    nstpPartnerCollege: "City Information Office & Barangay Public Desk",
    icon: "Radio",
    hotline: "0917-889-INFO",
    color: "#06391C",
  },
];

export function getDepartmentInfo(id: DepartmentType): DepartmentInfo {
  return (
    RESCUE_DEPARTMENTS.find((d) => d.id === id) || RESCUE_DEPARTMENTS[0]
  );
}
