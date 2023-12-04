import { Construct } from "constructs";

import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { FunctionUrlAuthType, Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { env } from "../src/env";

export class SlackbotStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		const lambda = new NodejsFunction(this, "slackbot-lambda", {
			runtime: Runtime.NODEJS_18_X,
			entry: path.join(__dirname, "/../src/lambda.ts"),
			handler: "handler",
			environment: env,
			bundling: {
				minify: true,
				sourceMap: true,
				sourcesContent: false,
				target: "es2020",
			},
			timeout: Duration.minutes(1),
		});

		const functionUrl = lambda.addFunctionUrl({
			authType: FunctionUrlAuthType.NONE,
			cors: {
				allowedOrigins: ["*"],
			},
		});

		new CfnOutput(this, "slackbot-function-url", {
			value: functionUrl.url,
		});
	}
}
