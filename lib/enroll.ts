"use client";

import { startRegistration } from "@simplewebauthn/browser";

export async function enrollFingerprint(memberId: string) {
  const optionsResponse = await fetch("/api/webauthn/register/options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId }),
  });
  const optionsData = await optionsResponse.json();
  if (!optionsResponse.ok) {
    throw new Error(optionsData.error ?? "تعذر بدء تسجيل البصمة");
  }

  let attestation;
  try {
    attestation = await startRegistration({ optionsJSON: optionsData.options });
  } catch {
    throw new Error(
      "تم إلغاء عملية البصمة. تأكد من تفعيل بصمة الإصبع أو Windows Hello على هذا الجهاز ثم أعد المحاولة.",
    );
  }

  const verifyResponse = await fetch("/api/webauthn/register/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      memberId,
      requestId: optionsData.requestId,
      response: attestation,
    }),
  });
  const verifyData = await verifyResponse.json();
  if (!verifyResponse.ok) {
    throw new Error(verifyData.error ?? "فشل تسجيل البصمة");
  }
  return verifyData;
}
