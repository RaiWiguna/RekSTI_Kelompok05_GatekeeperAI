export type AttendanceDecision = "granted" | "denied";

export interface AttendanceRuleInput {
  studentNim: string;
  roomCode: string;
  requestedAt: string;
}

export function evaluateAccess(_input: AttendanceRuleInput): AttendanceDecision {
  return "denied";
}

