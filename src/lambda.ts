import "dotenv/config";
import type { Handler } from "aws-lambda";
import { App, AwsLambdaReceiver } from "@slack/bolt";
import { initApp } from "./app";

const lambdaReciever = new AwsLambdaReceiver({
	signingSecret: process.env.SLACK_SIGNING_SECRET || "",
});

initApp(
	new App({
		signingSecret: process.env.SLACK_SIGNING_SECRET,
		token: process.env.SLACK_BOT_TOKEN,
		receiver: lambdaReciever,
	}),
);

export const handler: Handler = async (event, context, callback) => {
	const slackLambda = await lambdaReciever.start();
	return slackLambda(event, context, callback);
};
