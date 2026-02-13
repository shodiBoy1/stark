import { db } from "@/lib/db";

export async function clearAllData() {
  await db.transaction("rw", [db.projects, db.pdfs, db.tests, db.settings], async () => {
    await db.projects.clear();
    await db.pdfs.clear();
    await db.tests.clear();
    await db.settings.clear();
  });
}
