"use client";

import { useEffect, useState } from "react";

export default function LiveClock({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) {
    return (
      <div className={compact ? "h-4 w-24 animate-pulse rounded bg-white/10" : "h-16 w-40 animate-pulse rounded-2xl bg-white/10"} />
    );
  }

  const time = now.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    second: compact ? undefined : "2-digit",
  });
  const date = now.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (compact) {
    return <span className="tabular-nums text-white/60">{time}</span>;
  }

  return (
    <div className="text-left">
      <div className="text-3xl font-extrabold tabular-nums tracking-tight text-white md:text-[42px]">
        {time}
      </div>
      <div className="mt-1 text-sm text-white/45">{date}</div>
    </div>
  );
}
