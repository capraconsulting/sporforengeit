import "dotenv/config";
import { App, AwsLambdaReceiver } from "@slack/bolt";
import { randomAnimal } from "./random-animal";
import bcrypt from "bcryptjs";
import { Handler } from "aws-lambda";

const TABLE_NAME: string = process.env.TABLE_NAME || "";

const lambdaReciever = new AwsLambdaReceiver({
	signingSecret: process.env.SLACK_SIGNING_SECRET || "",
});

const app = new App({
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	token: process.env.SLACK_BOT_TOKEN,
	receiver: lambdaReciever,
	processBeforeResponse: true,
});

app.command("/anon", async ({ ack, command, say, client }) => {
	await ack();
	const { text, user_id, channel_id } = command;

	try {
		/** Confirmation message only vissble for the user */
		await client.chat.postEphemeral({
			user: user_id,
			channel: channel_id,
			text: "Takk for innsendt spørsmål!",
		});

		const content = `*Anonym melding*\n\n${text}`;
		const message = await say({
			channel: channel_id,
			text: content,
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: content,
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

		const hashedUserId = await bcrypt.hash(user_id, 2);
		if (!message.ts) return;

		const { DynamoDBClient, PutItemCommand } = await import(
			"@aws-sdk/client-dynamodb"
		);
		const dynamo = new DynamoDBClient();
		const command = new PutItemCommand({
			TableName: TABLE_NAME,
			Item: {
				ThreadId: {
					S: message.ts,
				},
				Content: {
					S: text,
				},
				AuthorId: {
					S: hashedUserId,
				},
				ChannelId: {
					S: channel_id,
				},
			},
		});

		const response = await dynamo.send(command);
		console.info(response);
	} catch (error) {
		console.error(error);
	}
});

app.action("reply_anonymously", async ({ ack, body, client }) => {
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

	const { DynamoDBClient, GetItemCommand } = await import(
		"@aws-sdk/client-dynamodb"
	);

	const dynamo = new DynamoDBClient();
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

	const isAuthor = await bcrypt.compare(body.user.id, item.authorId);

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
