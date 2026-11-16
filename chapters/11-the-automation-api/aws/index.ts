import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
const config = new pulumi.Config();
const title = config.get("title") ?? "Guestbook on AWS";

// Messages: one DynamoDB table, billed per request.
const table = new aws.dynamodb.Table("messages", {
  billingMode: "PAY_PER_REQUEST",
  hashKey: "pk",
  rangeKey: "at",
  attributes: [
    { name: "pk", type: "S" },
    { name: "at", type: "S" },
  ],
});

// The API's identity: a role that only Lambda may assume.
const role = new aws.iam.Role("api-role", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Effect: "Allow",
      Principal: { Service: "lambda.amazonaws.com" },
      Action: "sts:AssumeRole",
    }],
  }),
});

const logsPolicy = new aws.iam.RolePolicyAttachment("api-logs", {
  role: role.name,
  policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
});

const tablePolicy = new aws.iam.RolePolicy("api-table", {
  role: role.id,
  policy: pulumi.jsonStringify({
    Version: "2012-10-17",
    Statement: [{
      Effect: "Allow",
      Action: ["dynamodb:PutItem", "dynamodb:Query"],
      Resource: table.arn,
    }],
  }),
});

const logGroup = new aws.cloudwatch.LogGroup("api-log-group", {
  retentionInDays: 7,
});

const fn = new aws.lambda.Function("api", {
  runtime: aws.lambda.Runtime.NodeJS22dX,
  architectures: ["arm64"],
  handler: "index.handler",
  role: role.arn,
  code: new pulumi.asset.AssetArchive({
    "index.mjs": new pulumi.asset.FileAsset("lambda/index.mjs"),
  }),
  environment: { variables: { TABLE_NAME: table.name } },
  loggingConfig: { logFormat: "Text", logGroup: logGroup.name },
}, { dependsOn: [logsPolicy, tablePolicy] });

// The front door: an HTTP API that calls the function.
const api = new aws.apigatewayv2.Api("http-api", {
  protocolType: "HTTP",
  corsConfiguration: {
    allowOrigins: ["*"],
    allowMethods: ["GET", "POST"],
    allowHeaders: ["content-type"],
  },
});

const integration = new aws.apigatewayv2.Integration("lambda", {
  apiId: api.id,
  integrationType: "AWS_PROXY",
  integrationUri: fn.arn,
  payloadFormatVersion: "2.0",
});

for (const routeKey of ["GET /api/messages", "POST /api/messages"]) {
  new aws.apigatewayv2.Route(routeKey.split(" ")[0].toLowerCase(), {
    apiId: api.id,
    routeKey,
    target: pulumi.interpolate`integrations/${integration.id}`,
  });
}

new aws.apigatewayv2.Stage("default", {
  apiId: api.id,
  name: "$default",
  autoDeploy: true,
});

new aws.lambda.Permission("api-invoke", {
  action: "lambda:InvokeFunction",
  function: fn.name,
  principal: "apigateway.amazonaws.com",
  sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
});

export const apiUrl = api.apiEndpoint;
export const tableName = table.name;
export const functionName = fn.name;

// The page: a public S3 static website.
const site = new aws.s3.Bucket("site", { forceDestroy: true });

const website = new aws.s3.BucketWebsiteConfiguration("site", {
  bucket: site.id,
  indexDocument: { suffix: "index.html" },
});

const publicAccess = new aws.s3.BucketPublicAccessBlock("site", {
  bucket: site.id,
  blockPublicAcls: true,
  ignorePublicAcls: true,
  blockPublicPolicy: false,
  restrictPublicBuckets: false,
});

new aws.s3.BucketPolicy("site", {
  bucket: site.id,
  policy: pulumi.jsonStringify({
    Version: "2012-10-17",
    Statement: [{
      Effect: "Allow",
      Principal: "*",
      Action: "s3:GetObject",
      Resource: pulumi.interpolate`${site.arn}/*`,
    }],
  }),
}, { dependsOn: [publicAccess] });

new aws.s3.BucketObject("index", {
  bucket: site.id,
  key: "index.html",
  source: new pulumi.asset.FileAsset("../app/public/index.html"),
  contentType: "text/html",
});

new aws.s3.BucketObject("config", {
  bucket: site.id,
  key: "config.js",
  contentType: "text/javascript",
  content: pulumi.interpolate`
window.API_BASE = "${api.apiEndpoint}";
window.TITLE = ${JSON.stringify(title)};
`,
});

export const siteUrl =
  pulumi.interpolate`http://${website.websiteEndpoint}`;

