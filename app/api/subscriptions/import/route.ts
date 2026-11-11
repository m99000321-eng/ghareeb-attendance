import * as XLSX from "xlsx";
import { getDB, saveDB } from "@/lib/db";
import { TIER_PRICE, monthKey } from "@/lib/format";
import { denyApi, isApiAuthorized } from "@/lib/guard";
import type { Subscription } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Row = Record<string, unknown>;

const NAME_KEYS = ["العضو", "الاسم", "اسم العضو", "Player", "Name"];
const MONTH_KEYS = ["الشهر", "Month"];
const AMOUNT_KEYS = ["المبلغ", "المبلغ الشهري", "Amount", "Price"];
const PAID_KEYS = ["الحالة", "مدفوع", "Paid", "Status"];
const NOTE_KEYS = ["ملاحظات", "Notes", "Note"];

const TRUE_VALUES = ["true", "1", "paid", "مدفوع", "نعم", "تم", "تم الدفع"];
const FALSE_VALUES = ["false", "0", "unpaid", "غير مدفوع", "لم يدفع", "لا", "متدفعش"];

function pick(row: Row, keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key];
  }
  const normalized = new Map(
    Object.keys(row).map((key) => [key.replace(/\s+/g, " ").trim().toLowerCase(), key]),
  );
  for (const key of keys) {
    const actual = normalized.get(key.replace(/\s+/g, " ").trim().toLowerCase());
    if (actual) return row[actual];
  }
  return undefined;
}

function parseMonth(value: unknown, fallback: string): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
  }
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  let match = raw.match(/^(\d{4})[-/](\d{1,2})/);
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}`;
  match = raw.match(/^(\d{1,2})[-/](\d{4})$/);
  if (match) return `${match[2]}-${match[1].padStart(2, "0")}`;
  return null;
}

function parseAmount(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const digits = String(value ?? "").replace(/[^\d.]/g, "");
  if (!digits) return null;
  const amount = Number(digits);
  return Number.isFinite(amount) ? amount : null;
}

function parsePaid(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return undefined;
  if (FALSE_VALUES.includes(raw)) return false;
  if (TRUE_VALUES.includes(raw)) return true;
  return undefined;
}

export async function POST(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "ارفع ملف Excel أولاً" }, { status: 400 });
  }

  const fallbackMonth = parseMonth(form?.get("month"), monthKey()) ?? monthKey();
  let rows: Row[];
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const book = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheet = book.Sheets[book.SheetNames[0]];
    if (!sheet) throw new Error("empty");
    rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
  } catch {
    return Response.json({ error: "الملف مش مقروء — تأكد إنه Excel صحيح" }, { status: 400 });
  }

  if (rows.length === 0) {
    return Response.json({ error: "الملف فاضي — مفيش صفوف" }, { status: 400 });
  }

  const hasNameColumn = rows.some((row) => pick(row, NAME_KEYS) !== undefined);
  if (!hasNameColumn) {
    return Response.json(
      { error: "لازم يكون فيه عمود «العضو» أو «الاسم» في الملف" },
      { status: 400 },
    );
  }

  const db = await getDB();
  const members = new Map<string, (typeof db.members)[number]>();
  for (const member of db.members) {
    const key = member.name.trim().replace(/\s+/g, " ").toLowerCase();
    if (!members.has(key)) members.set(key, member);
  }

  let created = 0;
  let updated = 0;
  const skipped: { row: number; name: string; reason: string }[] = [];
  const now = new Date().toISOString();

  rows.forEach((row, index) => {
    const rawName = String(pick(row, NAME_KEYS) ?? "").trim();
    if (!rawName) return;
    const member = members.get(rawName.replace(/\s+/g, " ").toLowerCase());
    if (!member) {
      skipped.push({ row: index + 2, name: rawName, reason: "العضو غير موجود" });
      return;
    }

    const month = parseMonth(pick(row, MONTH_KEYS), fallbackMonth);
    if (!month) {
      skipped.push({ row: index + 2, name: rawName, reason: "الشهر غير صحيح" });
      return;
    }

    const existing = db.subscriptions.find(
      (item) => item.memberId === member.id && item.month === month,
    );
    const amount = parseAmount(pick(row, AMOUNT_KEYS));
    const paid = parsePaid(pick(row, PAID_KEYS));
    const note = String(pick(row, NOTE_KEYS) ?? "").trim();

    if (!existing && amount === null && paid === undefined) {
      skipped.push({ row: index + 2, name: rawName, reason: "مفيش مبلغ أو حالة" });
      return;
    }

    const record: Subscription =
      existing ??
      {
        id: `s_${crypto.randomUUID().slice(0, 8)}`,
        memberId: member.id,
        month,
        amount: amount ?? TIER_PRICE[member.tier ?? "junior"],
        paid: false,
      };

    if (amount !== null) record.amount = amount;
    if (paid !== undefined) {
      record.paid = paid;
      if (paid) record.paidAt = existing?.paidAt ?? now;
      else delete record.paidAt;
    }
    if (note) record.note = note;

    if (existing) {
      db.subscriptions[db.subscriptions.indexOf(existing)] = record;
      updated += 1;
    } else {
      db.subscriptions.push(record);
      created += 1;
    }
  });

  await saveDB(db);

  const unpaid = db.subscriptions
    .filter((item) => item.month === fallbackMonth && !item.paid)
    .map((item) => ({
      name: db.members.find((member) => member.id === item.memberId)?.name ?? "عضو محذوف",
      amount: item.amount,
    }));

  return Response.json({
    ok: true,
    created,
    updated,
    skipped: skipped.slice(0, 20),
    unpaid,
    subscriptions: db.subscriptions.filter((item) => item.month === fallbackMonth),
  });
}
