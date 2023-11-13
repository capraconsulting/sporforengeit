import { Handler } from "aws-lambda";
import { app } from "./app";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { db } from "./db";
import { MessageSchema } from "./types";
import { parse } from "valibot";

const TABLE_NAME: string = process.env.TABLE_NAME || "";
const dynamo = new DynamoDBClient();

export const handler: Handler = async (event, context, callback) => {
	const resultSet = await db.execute({
		sql: "SELECT * FROM messages WHERE scheduled = true AND published = false;",
    args: {}
	});

  const rows = resultSet.rows.map(row => parse(MessageSchema, row))

  
  console.log(rows)


	const command = new ScanCommand({
		TableName: TABLE_NAME,
		Limit: 1,
		ExpressionAttributeValues: {
			":s": {
				S: "TO_BE_PUBLISHED",
			},
		},
		FilterExpression: "Status = :s",
	});

	const result = await dynamo.send(command);
	if (!result.Items || result.Items.length === 0) return;
	const item = result.Items[0];
	const thread = {
		threadId: item.ThreadId.S || "",
		authorId: item.AuthorId.S || "",
		channelId: item.ChannelId.S || "",
		content: item.Content.S || "",
		status: item.Content.S || "",
	};
	const message = await await app.client.chat.postMessage({
		channel: thread.channelId,
		text: thread.content,
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: thread.content,
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
};
