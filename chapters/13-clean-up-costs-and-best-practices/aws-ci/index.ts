import * as aws from "@pulumi/aws";

const repo = "oddlyyogi@346381989/pulumi-from-zero@1459388941";

const github = new aws.iam.OpenIdConnectProvider("github", {
  url: "https://token.actions.githubusercontent.com",
  clientIdLists: ["sts.amazonaws.com"],
});

const deployRole = new aws.iam.Role("deploy", {
  assumeRolePolicy: github.arn.apply((arn) => JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Effect: "Allow",
      Principal: { Federated: arn },
      Action: "sts:AssumeRoleWithWebIdentity",
      Condition: {
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        },
        StringLike: {
          "token.actions.githubusercontent.com:sub": `repo:${repo}:*`,
        },
      },
    }],
  })),
});

export const roleArn = deployRole.arn;
