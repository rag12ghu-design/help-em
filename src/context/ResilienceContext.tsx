"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  UserRole,
  EmergencyTicket,
  NSTPVolunteerTeam,
  CommunityAnnouncement,
  VulnerableHousehold,
  TicketStatus,
  TicketPriority,
  DepartmentType,
} from "@/types/responder";
import { DebunkerItem } from "@/types/debunker";
import { DEBUNKER_ITEMS } from "@/data/debunkers";
import { RESCUE_DEPARTMENTS, getDepartmentInfo } from "@/data/departments";

interface ResilienceContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  selectedDepartment: DepartmentType;
  setSelectedDepartment: (dept: DepartmentType) => void;
  tickets: EmergencyTicket[];
  filteredTickets: EmergencyTicket[];
  addTicket: (
    data: Omit<EmergencyTicket, "id" | "ticketNumber" | "timestamp" | "status" | "departmentName"> & {
      targetDepartment?: DepartmentType;
    }
  ) => EmergencyTicket;
  updateTicketStatus: (
    ticketId: string,
    status: TicketStatus,
    assignedTeamId?: string,
    responderNotes?: string
  ) => void;
  debunkers: DebunkerItem[];
  addDebunker: (item: Omit<DebunkerItem, "id">) => void;
  announcements: CommunityAnnouncement[];
  addAnnouncement: (
    item: Omit<CommunityAnnouncement, "id" | "timestamp" | "isActive">
  ) => void;
  dismissAnnouncement: (id: string) => void;
  volunteerTeams: NSTPVolunteerTeam[];
  vulnerableHouseholds: VulnerableHousehold[];
  toggleVulnerableSafe: (id: string) => void;
  citizenTicketIds: string[];
  isSafe: boolean;
  safeCount: number;
  totalHouseholds: number;
  toggleSafe: () => void;
  setIsSafe: (val: boolean) => void;
}

const ResilienceContext = createContext<ResilienceContextType | undefined>(undefined);

const SEED_TEAMS: NSTPVolunteerTeam[] = [
  {
    id: "team-alpha",
    name: "BDRRMC Rescue & Engineering Unit Alpha",
    department: "rescue_evac",
    college: "BDRRMC Search & Rescue Division",
    focus: "River Dike Patrol & Lowland Flood Evacuation",
    leader: "Engr. Carlos Mendoza",
    contactNumber: "0917-889-MMS1",
    status: "deployed",
    activePurokId: "purok-1",
    assignedTicketsCount: 1,
  },
  {
    id: "team-beta",
    name: "Barangay Health Medical Unit Beta",
    department: "health_medical",
    college: "Barangay Health Station & Municipal Clinic",
    focus: "First Aid, Vitals Triage & Pediatric Care",
    leader: "Nurse Alyssa Ramos, RN",
    contactNumber: "0917-889-MMS2",
    status: "available",
    activePurokId: "purok-3",
    assignedTicketsCount: 0,
  },
  {
    id: "team-gamma",
    name: "Relief & Food Logistics Unit Gamma",
    department: "relief_supplies",
    college: "MSWDO Relief Logistics Division",
    focus: "Hot Meals, Drinking Water & Supply Logistics",
    leader: "Officer Jonan Castro",
    contactNumber: "0917-889-MMS3",
    status: "deployed",
    activePurokId: "purok-2",
    assignedTicketsCount: 1,
  },
  {
    id: "team-delta",
    name: "Power & Communications Unit Delta",
    department: "power_utilities",
    college: "Barangay Power & Radio Communications",
    focus: "Generator Hub Charging, Mesh Radio & Line Inspection",
    leader: "Lead Tech Paolo Valdez",
    contactNumber: "0917-889-MMS4",
    status: "available",
    activePurokId: "purok-2",
    assignedTicketsCount: 1,
  },
];

const SEED_TICKETS: EmergencyTicket[] = [
  {
    id: "tkt-001",
    ticketNumber: "TKT-1041",
    timestamp: "19:48 PST",
    source: "sos",
    contactName: "Mang Ernesto Agcaoili",
    phone: "09171234567",
    purokId: "purok-1",
    purokName: "Purok 1 • Riverside",
    targetDepartment: "rescue_evac",
    departmentName: "Rescue, Evacuation & Flood Operations",
    priority: "critical",
    status: "pending",
    category: "Rising Flood / Water Surge",
    description: "Water reaching porch level. 5 family members including an 82yo bedridden grandmother requiring priority evacuation.",
    householdMembers: 5,
    urgentNeeds: ["Evacuation Shuttle", "Rescue Boat / Flotation", "Flashlight / Batteries"],
  },
  {
    id: "tkt-002",
    ticketNumber: "TKT-1038",
    timestamp: "19:35 PST",
    source: "aid",
    contactName: "Aling Corazon Valdez",
    phone: "09187654321",
    purokId: "purok-2",
    purokName: "Purok 2 • Barangay Hall Command Post",
    targetDepartment: "power_utilities",
    departmentName: "Power, Generator Hub & Critical Utilities",
    priority: "high",
    status: "dispatched",
    category: "Emergency Generator Charging",
    description: "Requesting priority slot for nebulizer and rechargeable emergency medical lamp.",
    householdMembers: 3,
    urgentNeeds: ["Power Generator Slot", "Clean Water"],
    assignedTeamId: "team-delta",
    assignedTeamName: "Power & Communications Unit Delta",
    responderNotes: "Assigned slot #4 at Brgy Generator Hub. Power & Communications Unit Delta assisting with delivery.",
  },
  {
    id: "tkt-003",
    ticketNumber: "TKT-1032",
    timestamp: "19:12 PST",
    source: "citizen_report",
    contactName: "Resident Bryan Castro",
    phone: "09205556677",
    purokId: "purok-4",
    purokName: "Purok 4 • Lowland Intersection",
    targetDepartment: "rescue_evac",
    departmentName: "Rescue, Evacuation & Flood Operations",
    priority: "medium",
    status: "acknowledged",
    category: "Fallen Tree Branch & Road Clearance",
    description: "Large acacia branch blocking tricycle evacuation path towards high school ground.",
    householdMembers: 2,
    urgentNeeds: ["Road Clearing", "Barangay Tanod Escort"],
    assignedTeamId: "team-alpha",
    assignedTeamName: "BDRRMC Rescue & Engineering Unit Alpha",
    responderNotes: "Acknowledged by Brgy Kagawad. BDRRMC Rescue Unit Alpha dispatched with manual cross-cut saws.",
  },
  {
    id: "tkt-004",
    ticketNumber: "TKT-1029",
    timestamp: "18:55 PST",
    source: "sos",
    contactName: "Nanay Remedios Ramos",
    phone: "09193334455",
    purokId: "purok-3",
    purokName: "Purok 3 • Covered Court",
    targetDepartment: "health_medical",
    departmentName: "Health, Triage & Medical First Response",
    priority: "high",
    status: "dispatched",
    category: "High Blood Pressure & Pediatric Fever",
    description: "7-year-old child experiencing 39C fever and grandmother complaining of dizziness following power outage.",
    householdMembers: 4,
    urgentNeeds: ["Pediatric Paracetamol", "BP Check", "Oral Rehydration Salts"],
    assignedTeamId: "team-beta",
    assignedTeamName: "Barangay Health Medical Unit Beta",
    responderNotes: "Medical Unit Beta dispatched from Health Outpost with pediatric fever kit.",
  },
  {
    id: "tkt-005",
    ticketNumber: "TKT-1025",
    timestamp: "18:40 PST",
    source: "aid",
    contactName: "Tessie Dumlao",
    phone: "09228889900",
    purokId: "purok-1",
    purokName: "Purok 1 • Riverside",
    targetDepartment: "relief_supplies",
    departmentName: "Food Relief, Potable Water & Shelter Logistics",
    priority: "medium",
    status: "acknowledged",
    category: "Potable Drinking Water Shortage",
    description: "Deep well murky due to river rise. Need 2 clean 5-gallon water containers for 6 family members.",
    householdMembers: 6,
    urgentNeeds: ["5-Gallon Drinking Water", "Hot Porridge Meal"],
    assignedTeamId: "team-gamma",
    assignedTeamName: "Relief & Food Logistics Unit Gamma",
    responderNotes: "Queued for Sitio Riverside water filtration pump refill batch 2.",
  },
];

const SEED_ANNOUNCEMENTS: CommunityAnnouncement[] = [
  {
    id: "ann-001",
    title: "Barangay Quiling BDRRMC Weather Advisory: Signal No. 2 Active",
    message: "Typhoon Doppler indicates heavy gusts until 02:00 PST. Residents along Purok 1 riverbank are advised to prepare Go Bags and proceed to Covered Court if flood reaches curb level.",
    severity: "urgent",
    timestamp: "19:10 PST",
    author: "Barangay Quiling BDRRMC Operations Desk",
    department: "rescue_evac",
    purokTag: "Barangay Quiling Wide",
    isActive: true,
  },
  {
    id: "ann-002",
    title: "Health Advisory: Free Pediatric Check-in at Covered Court",
    message: "Barangay Health Medical team has set up clinic tables with fever medicines, hydration packs, and wound dressings. Walk-ins open 24/7.",
    severity: "advisory",
    timestamp: "19:30 PST",
    author: "Barangay Quiling Disaster Operations",
    department: "health_medical",
    purokTag: "Purok 3",
    isActive: true,
  },
];

const SEED_VULNERABLE: VulnerableHousehold[] = [
  {
    id: "vul-001",
    headOfFamily: "Agcaoili, Ernesto",
    purokId: "purok-1",
    purokName: "Purok 1 • Riverside",
    membersCount: 5,
    vulnerabilityType: "Senior Citizen",
    contactNumber: "0917-123-4567",
    isSafe: false,
    priorityLevel: "Critical",
    notes: "Lola Remedios (82 yo) bedridden. House within 30m of river embankment.",
  },
  {
    id: "vul-002",
    headOfFamily: "Mariano, Grace",
    purokId: "purok-1",
    purokName: "Purok 1 • Riverside",
    membersCount: 4,
    vulnerabilityType: "Infant / Toddler",
    contactNumber: "0919-222-3344",
    isSafe: true,
    priorityLevel: "High",
    notes: "Twin 6-month-old infants. Pre-evacuated to Covered Court cot #12.",
  },
  {
    id: "vul-003",
    headOfFamily: "Valdez, Corazon",
    purokId: "purok-2",
    purokName: "Purok 2 • Barangay Hall",
    membersCount: 3,
    vulnerabilityType: "Person with Disability (PWD)",
    contactNumber: "0918-765-4321",
    isSafe: true,
    priorityLevel: "High",
    notes: "Requires nebulizer power access every 4 hours.",
  },
  {
    id: "vul-004",
    headOfFamily: "Pascual, Danilo",
    purokId: "purok-4",
    purokName: "Purok 4 • Lowland",
    membersCount: 6,
    vulnerabilityType: "Senior Citizen",
    contactNumber: "0921-998-8776",
    isSafe: false,
    priorityLevel: "High",
    notes: "Lolo Pedro (78 yo) hard of hearing. House sits in natural catchment basin.",
  },
  {
    id: "vul-005",
    headOfFamily: "Flores, Marivic",
    purokId: "purok-5",
    purokName: "Purok 5 • Highland Ridge",
    membersCount: 4,
    vulnerabilityType: "Infant / Toddler",
    contactNumber: "0916-444-5566",
    isSafe: true,
    priorityLevel: "High",
    notes: "Newborn infant (3 weeks old). House intact on elevated ridge.",
  },
];

export function ResilienceProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("citizen");
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentType>("all");
  const [tickets, setTickets] = useState<EmergencyTicket[]>(SEED_TICKETS);
  const [debunkers, setDebunkers] = useState<DebunkerItem[]>(DEBUNKER_ITEMS);
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>(SEED_ANNOUNCEMENTS);
  const [volunteerTeams, setVolunteerTeams] = useState<NSTPVolunteerTeam[]>(SEED_TEAMS);
  const [vulnerableHouseholds, setVulnerableHouseholds] = useState<VulnerableHousehold[]>(SEED_VULNERABLE);
  const [citizenTicketIds, setCitizenTicketIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Household Safety Check-in State & Accounting
  const BASELINE_SAFE = 214;
  const TOTAL_FAMILIES = 240;

  const [isSafe, setIsSafeState] = useState<boolean>(false);
  const safeCount = BASELINE_SAFE + (isSafe ? 1 : 0);
  const totalHouseholds = TOTAL_FAMILIES;

  const toggleSafe = () => {
    setIsSafeState((prev) => !prev);
  };

  const setIsSafe = (val: boolean) => {
    setIsSafeState(val);
  };

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const savedRole = localStorage.getItem("helpem_user_role");
      if (savedRole === "citizen" || savedRole === "responder") {
        setRoleState(savedRole);
      }
      const savedDept = localStorage.getItem("helpem_dept");
      if (savedDept) {
        setSelectedDepartment(savedDept as DepartmentType);
      }
      const savedTickets = localStorage.getItem("helpem_tickets");
      if (savedTickets) {
        setTickets(JSON.parse(savedTickets));
      }
      const savedDebunkers = localStorage.getItem("helpem_debunkers");
      if (savedDebunkers) {
        setDebunkers(JSON.parse(savedDebunkers));
      }
      const savedCitizenTickets = localStorage.getItem("helpem_citizen_ticket_ids");
      if (savedCitizenTickets) {
        setCitizenTicketIds(JSON.parse(savedCitizenTickets));
      }
      const savedSafe = localStorage.getItem("helpem_is_safe");
      if (savedSafe !== null) {
        setIsSafeState(savedSafe === "true");
      }
    } catch (e) {
      console.warn("ResilienceProvider: localStorage load error:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when updated
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("helpem_user_role", role);
      localStorage.setItem("helpem_dept", selectedDepartment);
      localStorage.setItem("helpem_tickets", JSON.stringify(tickets));
      localStorage.setItem("helpem_debunkers", JSON.stringify(debunkers));
      localStorage.setItem("helpem_citizen_ticket_ids", JSON.stringify(citizenTicketIds));
      localStorage.setItem("helpem_is_safe", String(isSafe));
    } catch (e) {
      console.warn("ResilienceProvider: localStorage save error:", e);
    }
  }, [role, selectedDepartment, tickets, debunkers, citizenTicketIds, isSafe, isLoaded]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  const toggleRole = () => {
    setRoleState((prev) => (prev === "citizen" ? "responder" : "citizen"));
  };

  // Helper to determine department by category if not explicitly given
  const resolveDepartment = (category: string, target?: DepartmentType): DepartmentType => {
    if (target && target !== "all") return target;
    const cat = category.toLowerCase();
    if (cat.includes("flood") || cat.includes("surge") || cat.includes("evacuat") || cat.includes("rescue") || cat.includes("tree")) {
      return "rescue_evac";
    }
    if (cat.includes("health") || cat.includes("fever") || cat.includes("wound") || cat.includes("medic") || cat.includes("blood pressure")) {
      return "health_medical";
    }
    if (cat.includes("water") || cat.includes("food") || cat.includes("relief") || cat.includes("porridge") || cat.includes("ration")) {
      return "relief_supplies";
    }
    if (cat.includes("generator") || cat.includes("power") || cat.includes("charge") || cat.includes("battery") || cat.includes("electric")) {
      return "power_utilities";
    }
    return "rescue_evac";
  };

  const addTicket = (
    data: Omit<EmergencyTicket, "id" | "ticketNumber" | "timestamp" | "status" | "departmentName"> & {
      targetDepartment?: DepartmentType;
    }
  ): EmergencyTicket => {
    const id = "tkt-" + Date.now().toString(36);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TKT-${randomNum}`;
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const mins = now.getMinutes().toString().padStart(2, "0");
    const timestamp = `${hours}:${mins} PST`;

    const deptId = resolveDepartment(data.category, data.targetDepartment);
    const deptInfo = getDepartmentInfo(deptId);

    const newTicket: EmergencyTicket = {
      ...data,
      id,
      ticketNumber,
      timestamp,
      targetDepartment: deptId,
      departmentName: deptInfo.name,
      status: "pending",
    };

    setTickets((prev) => [newTicket, ...prev]);
    setCitizenTicketIds((prev) => [id, ...prev]);
    return newTicket;
  };

  const updateTicketStatus = (
    ticketId: string,
    status: TicketStatus,
    assignedTeamId?: string,
    responderNotes?: string
  ) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        let assignedTeamName = t.assignedTeamName;
        if (assignedTeamId) {
          const team = volunteerTeams.find((tm) => tm.id === assignedTeamId);
          if (team) assignedTeamName = team.name;
        }
        return {
          ...t,
          status,
          assignedTeamId: assignedTeamId || t.assignedTeamId,
          assignedTeamName,
          responderNotes: responderNotes ?? t.responderNotes,
          resolvedAt: status === "resolved" ? new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) + " PST" : t.resolvedAt,
        };
      })
    );

    // Update team assignment
    if (assignedTeamId) {
      setVolunteerTeams((prev) =>
        prev.map((tm) =>
          tm.id === assignedTeamId
            ? { ...tm, assignedTicketsCount: tm.assignedTicketsCount + 1, status: "deployed" }
            : tm
        )
      );
    }
  };

  const addDebunker = (item: Omit<DebunkerItem, "id">) => {
    const id = "debunk-" + Date.now().toString(36);
    const newItem: DebunkerItem = { ...item, id };
    setDebunkers((prev) => [newItem, ...prev]);
  };

  const addAnnouncement = (
    item: Omit<CommunityAnnouncement, "id" | "timestamp" | "isActive">
  ) => {
    const id = "ann-" + Date.now().toString(36);
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const mins = now.getMinutes().toString().padStart(2, "0");
    const timestamp = `${hours}:${mins} PST`;

    const newAnn: CommunityAnnouncement = {
      ...item,
      id,
      timestamp,
      isActive: true,
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
  };

  const dismissAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleVulnerableSafe = (id: string) => {
    setVulnerableHouseholds((prev) =>
      prev.map((vh) => (vh.id === id ? { ...vh, isSafe: !vh.isSafe } : vh))
    );
  };

  // Filtered tickets by department
  const filteredTickets =
    selectedDepartment === "all"
      ? tickets
      : tickets.filter((t) => t.targetDepartment === selectedDepartment);

  return (
    <ResilienceContext.Provider
      value={{
        role,
        setRole,
        toggleRole,
        selectedDepartment,
        setSelectedDepartment,
        tickets,
        filteredTickets,
        addTicket,
        updateTicketStatus,
        debunkers,
        addDebunker,
        announcements,
        addAnnouncement,
        dismissAnnouncement,
        volunteerTeams,
        vulnerableHouseholds,
        toggleVulnerableSafe,
        citizenTicketIds,
        isSafe,
        safeCount,
        totalHouseholds,
        toggleSafe,
        setIsSafe,
      }}
    >
      {children}
    </ResilienceContext.Provider>
  );
}

const DEFAULT_FALLBACK_CTX: ResilienceContextType = {
  role: "citizen",
  setRole: () => {},
  toggleRole: () => {},
  selectedDepartment: "all",
  setSelectedDepartment: () => {},
  tickets: SEED_TICKETS,
  filteredTickets: SEED_TICKETS,
  addTicket: () => SEED_TICKETS[0],
  updateTicketStatus: () => {},
  debunkers: DEBUNKER_ITEMS,
  addDebunker: () => {},
  announcements: SEED_ANNOUNCEMENTS,
  addAnnouncement: () => {},
  dismissAnnouncement: () => {},
  volunteerTeams: SEED_TEAMS,
  vulnerableHouseholds: SEED_VULNERABLE,
  toggleVulnerableSafe: () => {},
  citizenTicketIds: [],
  isSafe: false,
  safeCount: 214,
  totalHouseholds: 240,
  toggleSafe: () => {},
  setIsSafe: () => {},
};

export function useResilience() {
  const ctx = useContext(ResilienceContext);
  return ctx || DEFAULT_FALLBACK_CTX;
}
