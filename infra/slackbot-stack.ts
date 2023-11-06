import { Construct } from "constructs";

import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { FunctionUrlAuthType, Runtime } from "aws-cdk-lib/aws-lambda";
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
        //     SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET ,
        //     SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN |,
        //     TURSO_API_TOKEN: process.env.TURSO_API_TOKEN ,
        //     DATABASE_URL: process.env.DATABASE_URL,
        //     DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,
      },
    });
    dynamoTable.grantReadWriteData(lambda);

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
