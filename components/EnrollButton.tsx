"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enrollFingerprint } from "@/lib/enroll";
import { IconCheck, IconFingerprint, IconX } from "./Icons";

export default function EnrollButton({
  memberId,
  memberName,
  enrolled,
}: {
  memberId: string;
  memberName: string;
  enrolled: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "ok" | "error">(
    enrolled ? "ok" : "idle",
  );
  const [message, setMessage] = useState("");

  async function handleClick() {
    setState("busy");
    setMessage("");
    try {
      await enrollFingerprint(memberId);
      setState("ok");
      setMessage(`تم ربط بصمة ${memberName} بهذا الجهاز بنجاح`);
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage((error as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleClick}
        disabled={state === "busy" || state === "ok"}
        className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-extrabold transition ${
          state === "ok"
            ? "border border-lime/25 bg-lime/[0.06] text-lime"
            : "bg-lime text-ink lime-glow hover:brightness-105"
        }`}
      >
        {state === "busy" ? (
          <span className="inline-block size-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
        ) : state === "ok" ? (
          <IconCheck className="size-5" />
        ) : (
          <IconFingerprint className="size-5" />
        )}
        {state === "busy" ? "بانتظار لمسة البصمة…" : state === "ok" ? "البصمة مسجلة" : "تسجيل بصمة العضو"}
      </button>

      {message ? (
        <p
          className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[11px] leading-relaxed ${
            state === "ok"
              ? "border-lime/20 bg-lime/[0.04] text-lime/80"
              : "border-rose-400/20 bg-rose-500/[0.06] text-rose-200/90"
          }`}
        >
          {state === "ok" ? <IconCheck className="mt-0.5 size-3.5 shrink-0" /> : <IconX className="mt-0.5 size-3.5 shrink-0" />}
          {message}
        </p>
      ) : (
        <p className="text-[11px] leading-relaxed text-white/35">
          سيُطلب منك تأكيد البصمة أو Windows Hello على هذا الجهاز مرة واحدة فقط.
        </p>
      )}
    </div>
  );
}
