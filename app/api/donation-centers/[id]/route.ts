import { PUBLIC_DONATION_CENTERS } from "@/lib/donation-centers";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { const { id } = await context.params; const center = PUBLIC_DONATION_CENTERS.find((item) => item.id === id); return center ? Response.json({ data: center }) : Response.json({ error: "Unidade não encontrada." }, { status: 404 }); }
