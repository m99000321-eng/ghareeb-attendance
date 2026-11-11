export type Role = "player" | "coach";
export type Sport = "ملاكمة" | "كيك بوكس" | "كونغ فو" | "MMA";

export type Credential = {
  id: string;
  publicKey: string;
  counter: number;
  createdAt: string;
};

export type Member = {
  id: string;
  name: string;
  role: Role;
  sport: Sport;
  phone: string;
  parentPhone?: string;
  group?: string;
  barcodeToken?: string;
  joinedAt: string;
  color: string;
  credential?: Credential;
};

export type Attendance = {
  id: string;
  memberId: string;
  at: string;
  method: "fingerprint" | "manual" | "barcode";
};

export type Subscription = {
  id: string;
  memberId: string;
  month: string;
  amount: number;
  paid: boolean;
  paidAt?: string;
  note?: string;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  at: string;
  note?: string;
};

export type Grade = {
  id: string;
  memberId: string;
  title: string;
  score: number;
  max: number;
  at: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  group?: string;
  at: string;
};

export type Challenge = {
  challenge: string;
  userId?: string;
  expires: number;
};

export type WhatsappSettings = {
  instanceId: string;
  token: string;
  updatedAt: string;
};

export type WhatsappStatus = {
  configured: boolean;
  provider: "green" | "meta" | null;
  source: "env" | "db" | null;
  state: string;
  instanceId: string;
  phone: string;
  tokenTail: string;
};

export type DB = {
  members: Member[];
  attendance: Attendance[];
  challenges: Record<string, Challenge>;
  subscriptions: Subscription[];
  expenses: Expense[];
  grades: Grade[];
  announcements: Announcement[];
  settings?: {
    whatsapp?: WhatsappSettings;
  };
};

export type SafeMember = Omit<Member, "credential"> & {
  enrolled: boolean;
  credentialAt?: string;
};
