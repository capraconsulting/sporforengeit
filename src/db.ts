import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { migrate } from "drizzle-orm/libsql/migrator";

const client = createClient({
  url: process.env.DATABASE_URL || "",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const db = drizzle(client);

(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
})();

export { db };
