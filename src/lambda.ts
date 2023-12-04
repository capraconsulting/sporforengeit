import type { Handler } from "aws-lambda";
import { App, AwsLambdaReceiver } from "@slack/bolt";
import { initializeSlackEvents } from "./app";
import { env } from "./env";

const lambdaReciever = new AwsLambdaReceiver({
	signingSecret: env.SLACK_SIGNING_SECRET,
});

const app = new App({
	signingSecret: env.SLACK_SIGNING_SECRET,
	token: env.SLACK_BOT_TOKEN,
	receiver: lambdaReciever,
});

initializeSlackEvents(app);

export const handler: Handler = async (event, context, callback) => {
	const slackLambda = await lambdaReciever.start();
	return slackLambda(event, context, callback);
};
