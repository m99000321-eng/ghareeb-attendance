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
  joinedAt: string;
  color: string;
  credential?: Credential;
};

export type Attendance = {
  id: string;
  memberId: string;
  at: string;
  method: "fingerprint" | "manual";
};

export type Challenge = {
  challenge: string;
  userId?: string;
  expires: number;
};

export type DB = {
  members: Member[];
  attendance: Attendance[];
  challenges: Record<string, Challenge>;
};

export type SafeMember = Omit<Member, "credential"> & {
  enrolled: boolean;
  credentialAt?: string;
};
