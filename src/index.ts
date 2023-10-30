import bolt from "@slack/bolt";
import "dotenv/config";
import argon2 from "argon2";
import { thread } from "./schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomAnimal } from "./animal";

const receiver = new bolt.ExpressReceiver({
	signingSecret: process.env.SLACK_SIGNING_SECRET || "",
});

receiver.router.post("/slack/events", (req, res) => {
	if (req?.body?.challenge) res.send({ challenge: req.body.challenge });
});

const app = new bolt.App({
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	token: process.env.SLACK_BOT_TOKEN,
});

// Start your app
await app.start(process.env.PORT || 3500);

console.log("⚡️ Bolt app is running!");

app.command("/anon", async ({ ack, command, say, logger }) => {
	await ack();
	const { text, user_id, channel_id } = command;

	try {
		await app.client.chat.postEphemeral({
			token: process.env.SLACK_BOT_TOKEN,
			signingSecret: process.env.SLACK_SIGNING_SECRET,
			user: user_id,
			channel: channel_id,
			text: "Takk for innsendt spørsmål!",
		});

		const message = await say({
			channel: channel_id,
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `*Anonym melding*\n\n${text}`,
					},
				},
				{
					type: "actions",
					elements: [
						{
							type: "button",
							text: {
								type: "plain_text",
								text: "🧵 Reply anonymously",
							},
							style: "primary",
							action_id: "reply_anonymously",
						},
					],
				},
			],
		});
		if (!message.ts) throw new Error("Could not get thread ID");

		const hashedUserId = await argon2.hash(user_id, {
			type: argon2.argon2id,
			secret: Buffer.from(message.ts),
		});

		await db.insert(thread).values({
			id: message.ts,
			content: text,
			authorId: hashedUserId,
			channelId: channel_id,
		});
	} catch (error) {
		console.error(error);
	}
});

app.action("reply_anonymously", async ({ ack, body, client, payload }) => {
	await ack();

	try {
		if (body.type !== "block_actions" || !body.message) {
			return;
		}
		const formatMessaged = body.message?.text
			?.split("\n")
			.slice(1)
			.join("")
			.slice(0, -34);
		const result = await client.views.open({
			trigger_id: body.trigger_id,
			view: {
				type: "modal",
				callback_id: "reply_view",
				title: {
					type: "plain_text",
					text: "Anonymt svar",
				},
				blocks: [
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text: `Svarer til: _${formatMessaged}_`,
						},
					},
					{
						type: "input",
						block_id: "input_message",
						label: {
							type: "plain_text",
							text: "Hva ønsker du å svare?",
						},
						element: {
							type: "plain_text_input",
							action_id: "anonymously_message",
							multiline: true,
						},
					},
				],
				submit: {
					type: "plain_text",
					text: "Send inn",
				},
				close: {
					type: "plain_text",
					text: "Lukk",
				},
				private_metadata: body.message?.ts,
			},
		});
	} catch (error) {
		console.error(error);
	}
});

app.view("reply_view", async ({ ack, client, body, payload, view }) => {
	await ack();
	const value = view.state.values.input_message.anonymously_message.value;

	if (!value) return;
	const threadId = payload.private_metadata;

	const result = await db.select().from(thread).where(eq(thread.id, threadId));

	const thread_ts = result[0];

	const isAuthor = await argon2.verify(thread_ts.authorId, body.user.id, {
		secret: Buffer.from(thread_ts.id),
	});

	const alias = isAuthor
		? "OP"
		: randomAnimal(`${thread_ts.id}.${body.user.id}`);

	const text = `*Anonymous reply* by \`${alias}\`\n${value}`;

	await client.chat.postMessage({
		channel: thread_ts.channelId,
		thread_ts: thread_ts.id,
		text,
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text,
				},
			},
		],
	});
});
