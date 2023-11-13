import "dotenv/config";
import { db } from "./src/db";
import { parse } from "valibot";
import { MessageSchema } from "./src/types";
import { app } from "./src/app";

(async () => {
	const resultSet = await db.execute({
		sql: "SELECT * FROM messages WHERE scheduled = 1 AND published = 0 limit 1;",
		args: {},
	});

	const data = parse(MessageSchema, resultSet.rows[0])

	const message = await await app.client.chat.postMessage({
		channel: ""
		text: data.content,
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: data.content,
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
})();
