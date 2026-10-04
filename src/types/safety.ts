export interface SafetyBadge {
  text: 'Safe' | 'Unchecked';
  variant: 'success' | 'neutral';
}

export interface SafetyCheckInState {
  isSafe: boolean;
  safeCount: number;
  totalHouseholds: number;
  badge: SafetyBadge;
}
