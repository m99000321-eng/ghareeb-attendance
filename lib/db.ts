import fs from "node:fs/promises";
import path from "node:path";
import { get as blobGet, put as blobPut } from "@vercel/blob";
import type { DB, Member, SafeMember } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const DB_KEY = "ghareeb:attendance:v1";
const useBlob = Boolean(
  process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN,
);

function seed(): DB {
  return {
    members: [],
    attendance: [],
    challenges: {},
    subscriptions: [],
    expenses: [],
    grades: [],
    announcements: [],
  };
}

async function readRaw(): Promise<DB | null> {
  try {
    if (useBlob) {
      const result = await blobGet(DB_KEY, { access: "private", useCache: false });
      if (!result) return null;
      return JSON.parse(await new Response(result.stream).text()) as DB;
    }
    const raw = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(raw) as DB;
  } catch {
    return null;
  }
}

export async function getDB(): Promise<DB> {
  const db = (await readRaw()) ?? seed();
  db.members ??= [];
  db.attendance ??= [];
  db.challenges ??= {};
  db.subscriptions ??= [];
  db.expenses ??= [];
  db.grades ??= [];
  db.announcements ??= [];
  let tokensAdded = false;
  for (const member of db.members) {
    if (!member.barcodeToken) {
      ensureBarcodeToken(member);
      tokensAdded = true;
    }
  }
  // Persist freshly generated card tokens so shared links stay stable.
  if (tokensAdded) await saveDB(db);
  return db;
}

export async function saveDB(db: DB): Promise<void> {
  const now = Date.now();
  for (const [key, challenge] of Object.entries(db.challenges)) {
    if (challenge.expires < now) delete db.challenges[key];
  }
  const payload = JSON.stringify(db, null, 2);
  if (useBlob) {
    await blobPut(DB_KEY, payload, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 0,
    });
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, payload, "utf8");
}

export function storageLabel(): string {
  return useBlob ? "Vercel Blob — تخزين دائم" : "ملفات محلية (data/db.json)";
}

export function safeMember(member: Member): SafeMember {
  const { credential, ...rest } = member;
  return {
    ...rest,
    enrolled: Boolean(credential),
    credentialAt: credential?.createdAt,
  };
}

export function ensureBarcodeToken(member: Member): string {
  if (!member.barcodeToken) {
    member.barcodeToken = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
  }
  return member.barcodeToken;
}

export function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA");
}

export function todayKey(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function timeArabic(iso: string): string {
  return new Date(iso).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dateArabic(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
