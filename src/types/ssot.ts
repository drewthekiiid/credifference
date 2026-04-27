export interface ScorePoint {
  date: string;
  score: number;
}

export type BureauName = "Experian" | "Equifax" | "TransUnion";

export interface ScoreMeta {
  label: string;
  note: string;
  goal: number;
}

export interface BlockerDocument {
  name: string;
  url: string;
  type: string;
}

export type BlockerType = "Collection" | "Charge Off" | "Past Due" | "Late History";
export type BlockerStatus = "pending" | "disputed" | "action_required" | "resolved";

export interface Blocker {
  id: string;
  creditor: string;
  originalCreditor?: string;
  type: BlockerType;
  amount: number;
  balanceAmount?: number;
  pastDueAmount?: number;
  status: BlockerStatus;
  disputeDate: string | null;
  documents: BlockerDocument[];
  bureaus: BureauName[];
  nextStep: string;
  notes: string;
  estimatedRemoval?: string;
}

export interface ActionItem {
  id: string;
  task: string;
  completed: boolean;
  dueWindow?: string;
  why?: string;
  unlocks?: string[];
  relatedAccounts?: string[];
}

export interface ActionPhase {
  phase: number;
  title: string;
  description?: string;
  items: ActionItem[];
}

export interface CustodianLogEntry {
  date: string;
  message: string;
}

export interface BureauReport {
  bureau: BureauName;
  reportDate: string;
  summary: string;
  highlights: string[];
}

export interface LegacyIssue {
  id: string;
  creditor: string;
  issue: string;
  bureaus: BureauName[];
  strategy: string;
  estimatedRemoval?: string;
}

export type StackItemStatus = "build_now" | "sequence_next" | "locked";

export interface StackItem {
  id: string;
  category: string;
  name: string;
  status: StackItemStatus;
  requirement: string;
  nextStep: string;
  blockedBy: string[];
}

export interface StateData {
  scoreHistory: ScorePoint[];
  currentScore: number;
  scoreMeta: ScoreMeta;
  bureauReports: BureauReport[];
  blockers: Blocker[];
  legacyIssues: LegacyIssue[];
  stackChecklist: StackItem[];
  actionPlan: ActionPhase[];
  custodianLog: CustodianLogEntry[];
}

export interface StoredPasskeyDevice {
  credentialID: string;
  credentialPublicKey: string;
  counter: number;
  credentialDeviceType: string;
  credentialBackedUp: boolean;
  transports?: string[];
}

export interface StoredPasskeyUser {
  id: string;
  username: string;
  devices: StoredPasskeyDevice[];
}

export interface PasskeysData {
  users: {
    drew: StoredPasskeyUser;
  };
  currentChallenge: string | null;
}
