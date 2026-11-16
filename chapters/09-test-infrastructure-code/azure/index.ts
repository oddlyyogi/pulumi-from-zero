import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as storage from "@pulumi/azure-native/storage";
import * as web from "@pulumi/azure-native/web";

const stack = pulumi.getStack();
const rg = new resources.ResourceGroup("rg", {
  resourceGroupName: `rg-pulumi-guestbook-${stack}`,
  tags: { project: "guestbook", "managed-by": "pulumi" },
});

const account = new storage.StorageAccount("guestbook", {
  resourceGroupName: rg.name,
  sku: { name: storage.SkuName.Standard_LRS },
  kind: storage.Kind.StorageV2,
  allowBlobPublicAccess: false,
  minimumTlsVersion: storage.MinimumTlsVersion.TLS1_2,
  tags: { project: "guestbook", data: "messages" },
});

new storage.Table("messages", {
  resourceGroupName: rg.name,
  accountName: account.name,
  tableName: "messages",
});

const keys = storage.listStorageAccountKeysOutput({
  resourceGroupName: rg.name,
  accountName: account.name,
});
const connection = pulumi.secret(pulumi.concat(
  "DefaultEndpointsProtocol=https;AccountName=", account.name,
  ";AccountKey=", keys.keys[0].value,
  ";EndpointSuffix=core.windows.net",
));

const website = new storage.StorageAccountStaticWebsite("site", {
  resourceGroupName: rg.name,
  accountName: account.name,
  indexDocument: "index.html",
});

new storage.Blob("index", {
  resourceGroupName: rg.name,
  accountName: account.name,
  containerName: website.containerName,
  blobName: "index.html",
  contentType: "text/html",
  source: new pulumi.asset.FileAsset("../app/public/index.html"),
});

export const storageSite = account.primaryEndpoints.web;
export const connectionString = connection;

const app = new web.StaticSite("guestbook", {
  resourceGroupName: rg.name,
  location: "westus2",
  sku: { name: "Free", tier: "Free" },
  stagingEnvironmentPolicy: "Enabled",
  allowConfigFileUpdates: true,
  buildProperties: { skipGithubActionWorkflowGeneration: true },
});

const appSecrets = web.listStaticSiteSecretsOutput({
  resourceGroupName: rg.name,
  name: app.name,
});
export const deploymentToken = pulumi.secret(
  appSecrets.properties.apply((p) => p?.apiKey ?? ""),
);
export const appName = app.name;
export const appUrl = pulumi.interpolate`https://${app.defaultHostname}`;
export const groupName = rg.name;
