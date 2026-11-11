"use client";

import { useRouter } from "next/navigation";
import { IconDownload } from "./Icons";

type Row = {
  name: string;
  role: string;
  sport: string;
  time: string;
  method: string;
};

export default function AttendanceTools({
  date,
  group,
  groups,
  rows,
}: {
  date: string;
  group: string;
  groups: string[];
  rows: Row[];
}) {
  const router = useRouter();

  function go(next: { date?: string; group?: string }) {
    const params = new URLSearchParams();
    const nextDate = next.date ?? date;
    const nextGroup = next.group ?? group;
    if (nextDate) params.set("date", nextDate);
    if (nextGroup) params.set("group", nextGroup);
    router.push(`/attendance?${params.toString()}`);
  }

  function exportCsv() {
    const header = ["الاسم", "الصفة", "الرياضة", "الوقت", "طريقة التسجيل"];
    const lines = rows.map((row) => [
      row.name,
      row.role,
      row.sport,
      row.time,
      row.method,
    ]);
    const csv = [header, ...lines]
      .map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `attendance-${date}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={date}
        onChange={(event) => {
          if (event.target.value) go({ date: event.target.value });
        }}
        className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-lime/50"
      />
      <select
        value={group}
        onChange={(event) => go({ group: event.target.value })}
        className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-lime/50"
      >
        <option value="" className="bg-[#0a0c12]">
          كل المجموعات
        </option>
        {groups.map((item) => (
          <option key={item} value={item} className="bg-[#0a0c12]">
            {item}
          </option>
        ))}
      </select>
      <button
        onClick={exportCsv}
        disabled={rows.length === 0}
        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-white/60 transition hover:border-white/25 hover:text-white disabled:opacity-40"
      >
        <IconDownload className="size-4" />
        تصدير CSV
      </button>
    </div>
  );
}
