import { App, AwsLambdaReceiver } from "@slack/bolt";

export const lambdaReciever = new AwsLambdaReceiver({
	signingSecret: process.env.SLACK_SIGNING_SECRET || "",
});
export const app = new App({
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	token: process.env.SLACK_BOT_TOKEN,
	receiver: lambdaReciever,
});
