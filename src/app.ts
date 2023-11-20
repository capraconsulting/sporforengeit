import { App } from "@slack/bolt";
import {
	addDays,
	fromUnixTime,
	getUnixTime,
	setHours,
	setMinutes,
} from "date-fns";

export const initApp = (app: App) => {
	app.command("/anon", async ({ ack, body, client }) => {
		try {
			await ack();
			await client.views.open({
				trigger_id: body.trigger_id,
				view: {
					type: "modal",
					callback_id: "send_in_view",
					title: {
						type: "plain_text",
						text: "Anonymt svar",
					},
					blocks: [
						{
							type: "section",
							text: {
								type: "mrkdwn",
								text: "Noen regler her",
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
				channel: "C063T0ZE4F2",
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
	const formater = new Intl.DateTimeFormat("nb", {
		timeZone: "Europe/Oslo",
		timeStyle: "short",
		dateStyle: "long",
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

			await client.views.open({
				trigger_id: body.trigger_id,
				view: {
					type: "modal",
					callback_id: "schedule_message_view",
					title: {
						type: "plain_text",
						text: "Velg et tidspunkt ",
					},
					blocks: [
						{
							type: "input",
							block_id: "date_input",
							label: {
								type: "plain_text",
								text: "Tidspunkt for sending",
							},
							element: {
								type: "datetimepicker",
								action_id: "datetimepicker_action",
								initial_date_time: getUnixTime(tomorowAtTwelve),
							},
						},
						{
							type: "input",
							block_id: "scheduled_message_input",
							label: {
								type: "plain_text",
								text: "Melding",
							},
							element: {
								type: "plain_text_input",
								action_id: "scheduled_text",
								initial_value: body.message.text,
								multiline: true,
							},
						},
					],
					submit: {
						type: "plain_text",
						text: "Sett opp for sending 🚀",
						emoji: true,
					},
					close: {
						type: "plain_text",
						text: "Lukk",
					},
					private_metadata: body.message.ts,
				},
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
				channel: "C062XBMBTK8",
				post_at: getUnixTime(post_at),
				text,
			});
			const ts = payload.private_metadata;

			await app.client.chat.update({
				channel: "C063T0ZE4F2",
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
			if (payload.type !== "button") {
				return;
			}
			if (body.type !== "block_actions" || !body.message) {
				return;
			}

			await client.chat.deleteScheduledMessage({
				scheduled_message_id: payload.value,
				channel: "C062XBMBTK8",
			});

			console.log(body);

			const text = body.message.text || "";

			await client.chat.update({
				channel: "C063T0ZE4F2",
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
