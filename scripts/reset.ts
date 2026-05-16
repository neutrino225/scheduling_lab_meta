import { db } from "../lib/db";
import { accounts, posts, media, jobs } from "../drizzle/schema";
import * as fs from "fs";
import * as path from "path";

async function reset() {
  console.log("Resetting database...");

  try {
    // Delete in correct order for foreign keys
    await db.delete(jobs);
    await db.delete(media);
    await db.delete(posts);
    await db.delete(accounts);

    console.log("Database tables cleared.");

    // Optional: Clean up storage/media
    const storagePath = path.join(process.cwd(), "storage", "media");
    if (fs.existsSync(storagePath)) {
      console.log("Cleaning up storage/media...");
      // Re-create the directory to empty it
      fs.rmSync(storagePath, { recursive: true, force: true });
      fs.mkdirSync(storagePath, { recursive: true });
      console.log("Storage cleared.");
    }

    console.log("Reset complete.");
  } catch (error) {
    console.error("Reset failed:", error);
    process.exit(1);
  }
}

reset();
