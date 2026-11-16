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
| 3 | Projects, Stacks and Config | [chapters/03-projects-stacks-and-config](chapters/03-projects-stacks-and-config) |
| 4 | Deploy to AWS | [chapters/04-deploy-to-aws](chapters/04-deploy-to-aws) |
| 5 | Deploy to Azure | [chapters/05-deploy-to-azure](chapters/05-deploy-to-azure) |
| 6 | Component Resources | [chapters/06-component-resources](chapters/06-component-resources) |
| 7 | State, Import and Refactoring | [chapters/07-state-import-and-refactoring](chapters/07-state-import-and-refactoring) |
| 8 | Secrets and Environments with Pulumi ESC | [chapters/08-secrets-and-environments-with-pulumi-esc](chapters/08-secrets-and-environments-with-pulumi-esc) |
| 9 | Test Infrastructure Code | [chapters/09-test-infrastructure-code](chapters/09-test-infrastructure-code) |
| 10 | Kubernetes with Pulumi | [chapters/10-kubernetes-with-pulumi](chapters/10-kubernetes-with-pulumi) |
| 11 | The Automation API | [chapters/11-the-automation-api](chapters/11-the-automation-api) |
| 12 | CI/CD: GitHub Actions and Pulumi Deployments | coming soon |
| 13 | Clean Up, Costs and Best Practices | [chapters/13-clean-up-costs-and-best-practices](chapters/13-clean-up-costs-and-best-practices) |

## Versions

Pulumi CLI v3.276.0, @pulumi/pulumi 3.276.0, @pulumi/docker 5.3.0, @pulumi/aws 7.55.0, @pulumi/azure-native 3.30.0,
@pulumi/kubernetes 4.34.3, Node.js 22, Python 3.12. AWS Region us-east-2, Azure region westus2.

## License

MIT
