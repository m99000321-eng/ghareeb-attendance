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

export default function AttendanceTools({ date, rows }: { date: string; rows: Row[] }) {
  const router = useRouter();

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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="date"
        value={date}
        onChange={(event) => {
          if (event.target.value) router.push(`/attendance?date=${event.target.value}`);
        }}
        className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-lime/50"
      />
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
