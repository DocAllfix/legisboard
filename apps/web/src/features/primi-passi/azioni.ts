"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { requireStudio } from "@/features/auth/guards";
import { CHIAVE_PRIMI_PASSI } from "./dati";

/** Chi chiude i primi passi non li rivede: la scelta sta sull'utente, come i tour visti. */
export async function chiudiPrimiPassi(): Promise<void> {
  const ctx = await requireStudio();
  if (ctx.mode === "demo") return;
  const u = await db.query.user.findFirst({ where: eq(user.id, ctx.userId), columns: { tourVisti: true } });
  await db
    .update(user)
    .set({ tourVisti: { ...(u?.tourVisti ?? {}), [CHIAVE_PRIMI_PASSI]: 1 } })
    .where(eq(user.id, ctx.userId));
  revalidatePath("/cruscotto");
}
