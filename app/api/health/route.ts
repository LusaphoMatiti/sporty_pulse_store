import prisma from "../../../utils/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`select 1`;
    return Response.json({ ok: true, dbMs: Date.now() - start });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
