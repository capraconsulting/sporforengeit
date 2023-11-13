import "dotenv/config";
import { App, AwsLambdaReceiver } from "@slack/bolt";
import { randomAnimal } from "./random-animal";
import { hash, compare } from "bcryptjs";
import type { Handler } from "aws-lambda";
import { app, lambdaReciever } from "./app";
import {
	DynamoDBClient,
	GetItemCommand,
	PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { db } from "./db";

const TABLE_NAME: string = process.env.TABLE_NAME || "";
const dynamo = new DynamoDBClient();

app.command("/anon", async ({ ack, command, body, client }) => {
	const { text, user_id, channel_id } = command;
	try {
		await ack();
		await client.views.open({
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
							text: 'Noen regler her',
						},
					},
					{
						type: "input",
						block_id: "input_message",
						label: {
							type: "plain_text",
							text: "Melding",
						},
						element: {
							type: "plain_text_input",
							action_id: "anonymously_message",
							min_length: 1,
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
			},
		});

		// await client.chat.postEphemeral({
		// 	user: user_id,
		// 	channel: channel_id,
		// 	text: "Takk for innsendt spørsmål!",
		// });

		// const hashedUserId = await hash(user_id, 2);
		// const result = await db.execute({
		// 	sql: "insert into messages values (null, :content, :authorId, false, false, :createdAt)",
		// 	args: {
		// 		content: `*Anonym melding*\n\n${text}`,
		// 		authorId: hashedUserId,
		// 		createdAt: new Date().toISOString(),
		// 	},
		// });
		// await client.chat.postMessage({
		// 	channel: "C063T0ZE4F2",
		// 	text: `*Ny anonym melding nr. ${result.lastInsertRowid}*\n\n${text}`,
		// });
		
	} catch (error) {
		console.error(error);
	}
});

app.action("reply_anonymously", async ({ ack, body, client }) => {
	try {
		await ack();
		if (body.type !== "block_actions" || !body.message) {
			return;
		}
		const formatMessaged = body.message?.text
			?.split("\n")
			.slice(1)
			.join("")
			.slice(0, -34);
		await client.views.open({
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
				private_metadata: body.message?.ts, // Send the thread id to the message
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
	const command = new GetItemCommand({
		TableName: TABLE_NAME,
		Key: {
			ThreadId: {
				S: threadId,
			},
		},
	});
	const result = await dynamo.send(command);
	console.log(result);

	if (!result.Item) return;
	const item = {
		threadId: result.Item.ThreadId.S || "",
		authorId: result.Item.AuthorId.S || "",
		channelId: result.Item.ChannelId.S || "",
		content: result.Item.Content.S || "",
	};

	const isAuthor = await compare(body.user.id, item.authorId);

	// If the user is not the author, get a random seeded animal. The seed is based on the threadId and the userId
	const alias = isAuthor
		? "OP"
		: randomAnimal(`${item.threadId}.${body.user.id}`);

	const text = `*Anonymous reply* by \`${alias}\`\n${value}`;

	await client.chat.postMessage({
		channel: item.channelId,
		thread_ts: item.threadId,
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

export const handler: Handler = async (event, context, callback) => {
	const slackLambda = await lambdaReciever.start();
	return slackLambda(event, context, callback);
};
