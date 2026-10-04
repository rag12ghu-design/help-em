export type PurokStatus = 'safe' | 'alert' | 'shelter' | 'evac';

export interface PurokNode {
  id: string;
  name: string;
  purokNumber: number;
  area: string;
  x: number;
  y: number;
  status: PurokStatus;
  statusText: string;
  familiesSafe: string;
  total: number;
  safe: number;
  hazards: string;
  details: string;
  color: string;
}
