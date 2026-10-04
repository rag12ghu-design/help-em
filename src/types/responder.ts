export type UserRole = "citizen" | "responder";

export type DepartmentType =
  | "all"
  | "rescue_evac"
  | "health_medical"
  | "relief_supplies"
  | "power_utilities"
  | "public_info";

export interface DepartmentInfo {
  id: DepartmentType;
  name: string;
  shortName: string;
  leadAgency: string;
  supportDivision?: string;
  nstpPartnerCollege: string;
  icon: string;
  hotline: string;
  color: string;
}

export type TicketPriority = "critical" | "high" | "medium" | "low";

export type TicketStatus = "pending" | "acknowledged" | "dispatched" | "resolved";

export interface EmergencyTicket {
  id: string;
  ticketNumber: string;
  timestamp: string;
  source: "sos" | "call" | "aid" | "citizen_report";
  contactName: string;
  phone: string;
  purokId: string;
  purokName: string;
  targetDepartment?: DepartmentType;
  departmentName?: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  description: string;
  householdMembers?: number;
  urgentNeeds: string[];
  assignedTeamId?: string;
  assignedTeamName?: string;
  responderNotes?: string;
  resolvedAt?: string;
}

export type CreateTicketInput = Omit<
  EmergencyTicket,
  "id" | "ticketNumber" | "timestamp" | "status" | "departmentName" | "targetDepartment"
> & {
  targetDepartment?: DepartmentType;
};

export interface EmergencyResponseTeam {
  id: string;
  name: string;
  department: DepartmentType;
  college: string;
  focus: string;
  leader: string;
  contactNumber: string;
  status: "available" | "deployed" | "standby";
  activePurokId?: string;
  assignedTicketsCount: number;
}

export type NSTPVolunteerTeam = EmergencyResponseTeam;

export interface CommunityAnnouncement {
  id: string;
  title: string;
  message: string;
  severity: "urgent" | "warning" | "advisory";
  timestamp: string;
  author: string;
  department: DepartmentType;
  purokTag?: string;
  isActive: boolean;
}

export interface VulnerableHousehold {
  id: string;
  headOfFamily: string;
  purokId: string;
  purokName: string;
  membersCount: number;
  vulnerabilityType: "Senior Citizen" | "Infant / Toddler" | "Person with Disability (PWD)" | "Bedridden Patient";
  contactNumber: string;
  isSafe: boolean;
  priorityLevel: "Critical" | "High";
  notes: string;
}
