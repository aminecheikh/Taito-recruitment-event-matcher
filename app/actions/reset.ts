"use server";

import { revalidatePath } from "next/cache";
import { resetDb } from "@/lib/store/db";

export async function resetDemoData(): Promise<void> {
  await resetDb();
  revalidatePath("/", "layout");
}
