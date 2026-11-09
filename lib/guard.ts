import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

export async function requireSession(): Promise<void> {
  const store = await cookies();
  if (!(await verifySessionToken(store.get(SESSION_COOKIE)?.value))) {
    redirect("/login");
  }
}

function cookieValue(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const chunk of header.split(";")) {
    const [key, ...rest] = chunk.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export async function isApiAuthorized(request: Request): Promise<boolean> {
  return verifySessionToken(cookieValue(request, SESSION_COOKIE));
}

export async function denyApi(): Promise<Response> {
  return Response.json({ error: "غير مصرح" }, { status: 401 });
}
