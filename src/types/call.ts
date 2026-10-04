export interface CallStation {
  id: string;
  name: string;
  operator: string;
  frequency: string;
  purok: string;
  avatarColor: string;
  greeting: string;
  role: string;
}

export type CallStatus = "idle" | "calling" | "connected" | "ended";

export interface CallLogMessage {
  id: string;
  sender: "system" | "dispatcher" | "user";
  text: string;
  timestamp: string;
}
