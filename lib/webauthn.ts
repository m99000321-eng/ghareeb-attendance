export function rpContext(request: Request) {
  const origin = request.headers.get("origin") ?? "http://localhost:3100";
  let rpID = "localhost";
  try {
    rpID = new URL(origin).hostname;
  } catch {
    rpID = "localhost";
  }
  return { origin, rpID };
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
