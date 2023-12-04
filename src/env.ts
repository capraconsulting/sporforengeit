import "dotenv/config"
import { z } from "zod";

const envSchema = z.object({
	SLACK_SIGNING_SECRET: z.string(),
	SLACK_BOT_TOKEN: z.string(),
	PUBLIC_CHANNEL_ID: z.string(),
	PRIVATE_CHANNEL_ID: z.string(),
});

const parsedEnv = envSchema.safeParse({
	SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
	SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
	PUBLIC_CHANNEL_ID: process.env.PUBLIC_CHANNEL_ID,
	PRIVATE_CHANNEL_ID: process.env.PRIVATE_CHANNEL_ID,
});

if (!parsedEnv.success) {
    throw new Error("Missing or incorrect environment variables")
}

export const env = parsedEnv.data;
