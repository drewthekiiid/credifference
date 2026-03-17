export interface ScorePoint {
  date: string;
  score: number;
}

export interface BlockerDocument {
  name: string;
  url: string;
  type: string;
}

export type BlockerType = "Collection" | "Charge Off" | "Past Due";
export type BlockerStatus = "pending" | "disputed" | "action_required" | "resolved";

export interface Blocker {
  id: string;
  creditor: string;
  originalCreditor?: string;
  type: BlockerType;
  amount: number;
  status: BlockerStatus;
  disputeDate: string | null;
  documents: BlockerDocument[];
}

export interface ActionItem {
  id: string;
  task: string;
  completed: boolean;
}

export interface ActionPhase {
  phase: number;
  title: string;
  items: ActionItem[];
}

export interface CustodianLogEntry {
  date: string;
  message: string;
}

export interface StateData {
  scoreHistory: ScorePoint[];
  currentScore: number;
  blockers: Blocker[];
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
