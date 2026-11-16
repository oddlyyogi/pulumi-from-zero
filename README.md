# Pulumi from Zero: Guestbook

The code for the **Pulumi** video course. One small app, the Guestbook (a page and a messages API), is deployed with
Pulumi in TypeScript, with Python shown where it differs: first to local Docker, then to AWS (S3, Lambda, API Gateway,
DynamoDB) and Azure (Storage, Static Web Apps with managed Functions), then with components, state and import work,
Pulumi ESC, tests and policies, Kubernetes on kind, the Automation API, CI/CD and a full clean-up.

The root of this repository is the finished project. Each chapter's finished project is in [`chapters/`](chapters).
No state, passphrases, account IDs or tokens are committed: local stacks use the file backend (`pulumi login --local`)
and a passphrase you choose (`PULUMI_CONFIG_PASSPHRASE`).

| # | Chapter | Folder |
|---|---------|--------|
| 1 | Install Pulumi and Deploy Your First Stack | [chapters/01-install-pulumi-and-deploy-your-first-stack](chapters/01-install-pulumi-and-deploy-your-first-stack) |
| 2 | Resources, Inputs and Outputs | [chapters/02-resources-inputs-and-outputs](chapters/02-resources-inputs-and-outputs) |
| 3 | Projects, Stacks and Config | coming soon |
| 4 | Deploy to AWS | coming soon |
| 5 | Deploy to Azure | coming soon |
| 6 | Component Resources | coming soon |
| 7 | State, Import and Refactoring | coming soon |
| 8 | Secrets and Environments with Pulumi ESC | coming soon |
| 9 | Test Infrastructure Code | coming soon |
| 10 | Kubernetes with Pulumi | coming soon |
| 11 | The Automation API | coming soon |
| 12 | CI/CD: GitHub Actions and Pulumi Deployments | coming soon |
| 13 | Clean Up, Costs and Best Practices | coming soon |

## Versions

Pulumi CLI v3.276.0, @pulumi/pulumi 3.276.0, @pulumi/docker 5.3.0, @pulumi/aws 7.55.0, @pulumi/azure-native 3.30.0,
@pulumi/kubernetes 4.34.3, Node.js 22, Python 3.12. AWS Region us-east-2, Azure region westus2.

## License

MIT
