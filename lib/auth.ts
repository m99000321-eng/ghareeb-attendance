const encoder = new TextEncoder();

export const SESSION_COOKIE = "ghareeb_attendance";
export const SESSION_MAX_AGE = 60 * 60 * 12;

export function authSecret(): string {
  return process.env.ATTENDANCE_SECRET ?? process.env.ATTENDANCE_PASSWORD ?? "";
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(): Promise<string> {
  const secret = authSecret();
  if (!secret) throw new Error("ATTENDANCE_PASSWORD is not configured");
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  return `${expires}.${await sign(String(expires), secret)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const secret = authSecret();
  if (!token || !secret) return false;
  const [expires, signature] = token.split(".");
  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now() || !signature) {
    return false;
  }
  const expected = await sign(expires, secret);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) {
    diff |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }
  return diff === 0;
}
