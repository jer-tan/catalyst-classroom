import "dotenv/config";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { initializeConnection, initializeDb } from "./database";

// This will run migrations on the database, skipping the ones already applied
export default async function migration() {
  const conn = await initializeConnection();
  const database = await initializeDb();

  await migrate(database, { migrationsFolder: "./drizzle" });

  // Don't forget to close the connection, otherwise the script will hang
  await conn.end();
}

migration();
