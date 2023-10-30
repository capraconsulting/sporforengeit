import type { Config } from "drizzle-kit";
import "dotenv/config"
 
export default {
  schema: "./src/schema.ts",
  out: "./drizzle",
} satisfies Config;