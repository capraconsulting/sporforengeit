import { App } from "@slack/bolt";
import {
	addDays,
	fromUnixTime,
	getUnixTime,
	setHours,
	setMinutes,
} from "date-fns";
import { SCHEDULE_MESSAGE_VIEW, SEND_MESSAGE_VIEW } from "./modal-views";
import { z } from "zod";
import { env } from "./env";

export const initializeSlackEvents = (app: App) => {
	app.command("/anon", async ({ ack, body, client }) => {
		try {
			await ack();
			await client.views.open({
				trigger_id: body.trigger_id,
				view: SEND_MESSAGE_VIEW(),
			});
		} catch (error) {
			console.error(error);
		}
	});

	app.view("send_in_view", async ({ ack, client, view }) => {
		try {
			await ack();
			const value = view.state.values.input_message.anonymously_message.value;
			if (!value) return;

			await client.chat.postMessage({
				channel: env.PRIVATE_CHANNEL_ID,
				text: value,
				blocks: [
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text: value,
						},
					},
					{
						type: "actions",
						elements: [
							{
								type: "button",
								text: {
									type: "plain_text",
									text: "🚀 Godkjenn denne",
								},
								style: "primary",
								action_id: "schedule_message",
							},
						],
					},
				],
			});
		} catch (error) {
			console.error(error);
		}
	});

	app.action("schedule_message", async ({ body, client, ack }) => {
		try {
			await ack();
			if (body.type !== "block_actions" || !body.message) {
				return;
			}

			const tomorowAtTwelve = setHours(
				setMinutes(addDays(new Date(), 1), 0),
				11,
			);
			// Should always be valid since submissions cannot be empty
			const result = z.string().parse(body.message.text);

			await client.views.open({
				trigger_id: body.trigger_id,
				view: SCHEDULE_MESSAGE_VIEW(result, tomorowAtTwelve, body.message.ts),
			});
		} catch (error) {
			console.error(error);
		}
	});

	app.view("schedule_message_view", async ({ payload, ack, view }) => {
		try {
			await ack();
			const timestamp =
				view.state.values.date_input.datetimepicker_action.selected_date_time;
			const text =
				view.state.values.scheduled_message_input.scheduled_text.value;
			if (!timestamp || !text) return;
			const post_at = fromUnixTime(timestamp);

			const message = await app.client.chat.scheduleMessage({
				channel: env.PUBLIC_CHANNEL_ID,
				post_at: getUnixTime(post_at),
				text,
				metadata: {
					event_type: ""
				}
			});

			const ts = payload.private_metadata;

			const formater = new Intl.DateTimeFormat("nb", {
				timeZone: "Europe/Oslo",
				timeStyle: "short",
				dateStyle: "long",
			});

			await app.client.chat.update({
				channel: env.PRIVATE_CHANNEL_ID,
				ts,
				text,
				blocks: [
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text,
						},
					},
					{
						type: "section",
						block_id: "scheduled_time_id",
						text: {
							type: "mrkdwn",
							text: `Denne meldingen blir sendt: ${formater.format(post_at)}`,
						},
					},
					{
						type: "actions",
						elements: [
							{
								type: "button",
								text: {
									type: "plain_text",
									text: "Angre sending",
								},
								style: "danger",
								action_id: "undo_schedule",
								value: message.scheduled_message_id,
							},
						],
					},
				],
			});
		} catch (error) {
			console.error(error);
		}
	});

	app.action("undo_schedule", async ({ ack, client, payload, body }) => {
		try {
			await ack();
			console.log({ payload, body });
			if (payload.type !== "button") {
				return;
			}
			if (body.type !== "block_actions" || !body.message) {
				return;
			}

			await client.chat.deleteScheduledMessage({
				scheduled_message_id: payload.value,
				channel: env.PUBLIC_CHANNEL_ID,
			});

			const text = body.message.text || "";

			await client.chat.update({
				channel: env.PRIVATE_CHANNEL_ID,
				ts: body.message.ts,
				text,
				blocks: [
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text,
						},
					},
					{
						type: "actions",
						elements: [
							{
								type: "button",
								text: {
									type: "plain_text",
									text: "🚀 Godkjenn denne",
								},
								style: "primary",
								action_id: "schedule_message",
							},
						],
					},
				],
			});
		} catch (err) {
			console.error(err);
		}
	});
	return app;
};
