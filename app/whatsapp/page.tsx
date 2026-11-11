import Shell from "@/components/Shell";
import WhatsappClient from "@/components/WhatsappClient";
import { requireSession } from "@/lib/guard";
import { whatsappStatus } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function WhatsappPage() {
  await requireSession();
  const status = await whatsappStatus();

  return (
    <Shell>
      <WhatsappClient initial={status} />
    </Shell>
  );
}
