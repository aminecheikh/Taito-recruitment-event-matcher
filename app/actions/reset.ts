"use server";

import { revalidatePath } from "next/cache";
import { resetEnabled } from "@/lib/demoReset";
import { resetDb } from "@/lib/store/db";

export async function resetDemoData(): Promise<void> {
  if (!resetEnabled()) return;
  await resetDb();
  revalidatePath("/", "layout");
}
