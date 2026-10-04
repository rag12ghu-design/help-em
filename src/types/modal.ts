export type ModalMode = 'sos' | 'join' | 'aid' | null;

export interface SOSPayload {
  name: string;
  phone: string;
  purok: string;
  emergencyType: string;
  situationNotes: string;
  urgentNeeds: string[];
}

export interface JoinPayload {
  name: string;
  residentId?: string;
  phone: string;
  purok: string;
  volunteerRole: string;
  householdMembers: number;
}

export interface AidPayload {
  name: string;
  phone: string;
  purok: string;
  intent: 'request' | 'donate';
  stationTitle: string;
  resourceCategory: string;
  quantityNotes: string;
}

export interface SubmissionReceipt {
  ticketId: string;
  timestamp: string;
  mode: ModalMode;
  contactName: string;
  phone: string;
  purok: string;
  summary: string;
  responderNote: string;
}
