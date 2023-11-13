import { Construct } from "constructs";

import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { FunctionUrlAuthType, Runtime } from "aws-cdk-lib/aws-lambda";
import events from "aws-cdk-lib/aws-events";
import targets from "aws-cdk-lib/aws-events-targets";
import * as path from "path";

export class SlackbotStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		const dynamoTable = new Table(this, "thread", {
			partitionKey: { name: "ThreadId", type: AttributeType.STRING },
		});

		const lambda = new NodejsFunction(this, "slackbot-lambda", {
			runtime: Runtime.NODEJS_18_X,
			entry: path.join(__dirname, "/../src/lambda.ts"),
			handler: "handler",
			environment: {
				TABLE_NAME: dynamoTable.tableName,
				SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET || "",
				SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN || "",
				DATABASE_URL: process.env.DATABASE_URL || "",
				DATABASE_TOKEN: process.env.DATABASE_TOKEN || "",
			},
			bundling: {
				minify: true,
				sourceMap: true,
				sourcesContent: false,
				target: "es2020",
			},
			timeout: Duration.minutes(2),
		});
		dynamoTable.grantReadWriteData(lambda);

		const functionUrl = lambda.addFunctionUrl({
			authType: FunctionUrlAuthType.NONE,
			cors: {
				allowedOrigins: ["*"],
			},
		});

		// const postMessageLambda = new NodejsFunction(this, "post-message-lambda", {
		// 	runtime: Runtime.NODEJS_18_X,
		// 	entry: path.join(__dirname, "/../src/post-message.ts"),
		// 	handler: "handler",
		// 	environment: {
		// 		TABLE_NAME: dynamoTable.tableName,
		// 		SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET || "",
		// 		SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN || "",
		// 	},
		// 	bundling: {
		// 		minify: true,
		// 		sourceMap: true,
		// 		sourcesContent: false,
		// 		target: "es2018",
		// 	},
		// 	timeout: Duration.minutes(2),
		// });

		// dynamoTable.grantReadWriteData(postMessageLambda);
		// const lambdaTarget = new targets.LambdaFunction(postMessageLambda)


		// const eventRule = new events.Rule(this, "scheduleRule", {
		// 	schedule: events.Schedule.cron({ minute: "3", hour: "0"}),
		// 	targets: [lambdaTarget]
		// });

		new CfnOutput(this, "slackbot-function-url", {
			value: functionUrl.url,
		});

		// new CfnOutput(this, "Cron", {
		// 	value: `Scheduled to run ${eventRule.ruleArn}`,
		// });

		// TODO: Cron job stuff and post at 12:00
	}
}
