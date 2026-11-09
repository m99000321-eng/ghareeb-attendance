import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getDB, saveDB } from "@/lib/db";
import { rpContext } from "@/lib/webauthn";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { rpID } = rpContext(request);

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: [],
  });

  const db = await getDB();
  const requestId = crypto.randomUUID();
  db.challenges[requestId] = {
    challenge: options.challenge,
    expires: Date.now() + 2 * 60_000,
  };
  await saveDB(db);

  return Response.json({ options, requestId });
}
