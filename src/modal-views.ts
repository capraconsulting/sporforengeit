import type { View } from "@slack/bolt";
import { getUnixTime } from "date-fns";

export const SEND_MESSAGE_VIEW = (): View => ({
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
				text: "Liten påminnelse: Still spørsmål som ikke er ufine :smile: \nDet vil bli sendt ut 2 spørsmål hver dag, så det er ikke sikkert at spørsmålet ditt kommer i kanalen med en gang.\n\n<https://www.notion.so/capra/sp-rforenvenn-bfc59b595e4e42b2820e817ed79f9d7a|Regler for kanalen>",
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
});

export const SCHEDULE_MESSAGE_VIEW = (
    value: string,
	initialDate: Date,
	ts: string,
): View => ({
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
				initial_date_time: getUnixTime(initialDate),
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
				initial_value: value,
				multiline: true,
			},
		},
	],
	submit: {
		type: "plain_text",
		text: "Send senere",
		emoji: true,
	},
	close: {
		type: "plain_text",
		text: "Avbryt",
	},
	private_metadata: ts,
});
