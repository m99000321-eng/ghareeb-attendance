import * as XLSX from "xlsx";
import { dayKey, getDB, timeArabic } from "@/lib/db";
import { percent } from "@/lib/format";
import { denyApi, isApiAuthorized } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function workbookResponse(rows: Record<string, string | number>[], sheet: string, file: string) {
  const book = XLSX.utils.book_new();
  const data = rows.length ? rows : [{ "لا توجد بيانات": "" }];
  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet["!cols"] = Object.keys(data[0]).map((key) => ({
    wch: Math.min(Math.max(key.length + 6, 12), 34),
  }));
  XLSX.utils.book_append_sheet(book, worksheet, sheet);
  const buffer = XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();

  const params = new URL(request.url).searchParams;
  const type = params.get("type") ?? "attendance";
  const month = params.get("month") ?? "";
  const group = params.get("group") ?? "";

  const db = await getDB();
  const members = new Map(db.members.map((member) => [member.id, member]));
  const nameOf = (id: string) => members.get(id)?.name ?? "عضو محذوف";
  const groupOf = (id: string) => members.get(id)?.group ?? "";
  const roleOf = (id: string) => (members.get(id)?.role === "coach" ? "مدرب" : "لاعب");
  const sportOf = (id: string) => members.get(id)?.sport ?? "";
  const inMonth = (iso: string) => !month || dayKey(iso).startsWith(month);
  const inGroup = (id: string) => !group || groupOf(id) === group;

  if (type === "subscriptions") {
    const rows = db.subscriptions
      .filter((item) => inMonth(item.month ? `${item.month}-01T12:00:00` : "") && inGroup(item.memberId))
      .map((item) => ({
        العضو: nameOf(item.memberId),
        المجموعة: groupOf(item.memberId),
        الشهر: item.month,
        المبلغ: item.amount,
        الحالة: item.paid ? "مدفوع" : "غير مدفوع",
        "تاريخ الدفع": item.paidAt ? dayKey(item.paidAt) : "",
        ملاحظات: item.note ?? "",
      }));
    return workbookResponse(rows, "الاشتراكات", `subscriptions-${month || "all"}.xlsx`);
  }

  if (type === "expenses") {
    const rows = db.expenses
      .filter((item) => inMonth(item.at))
      .map((item) => ({
        البيان: item.title,
        التصنيف: item.category,
        المبلغ: item.amount,
        التاريخ: dayKey(item.at),
        ملاحظات: item.note ?? "",
      }));
    return workbookResponse(rows, "المصروفات", `expenses-${month || "all"}.xlsx`);
  }

  if (type === "grades") {
    const rows = db.grades
      .filter((item) => inMonth(item.at) && inGroup(item.memberId))
      .map((item) => ({
        العضو: nameOf(item.memberId),
        المجموعة: groupOf(item.memberId),
        الاختبار: item.title,
        الدرجة: item.score,
        "الدرجة النهائية": item.max,
        النسبة: `${percent(item.score, item.max)}%`,
        التاريخ: dayKey(item.at),
      }));
    return workbookResponse(rows, "الدرجات", `grades-${month || "all"}.xlsx`);
  }

  const rows = db.attendance
    .filter((item) => inMonth(item.at) && inGroup(item.memberId))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .map((item) => ({
      العضو: nameOf(item.memberId),
      الصفة: roleOf(item.memberId),
      الرياضة: sportOf(item.memberId),
      المجموعة: groupOf(item.memberId),
      التاريخ: dayKey(item.at),
      الوقت: timeArabic(item.at),
      الطريقة:
        item.method === "fingerprint" ? "بصمة" : item.method === "barcode" ? "باركود" : "يدوي",
    }));
  return workbookResponse(rows, "الحضور", `attendance-${month || "all"}.xlsx`);
}
