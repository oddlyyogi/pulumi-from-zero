import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
import * as random from "@pulumi/random";

const config = new pulumi.Config();
const port = config.requireNumber("port");
const title = config.get("title") ?? "Guestbook";
const limits = config.requireObject<{ memoryMb: number }>("limits");
const configuredToken = config.getSecret("adminToken");
const stack = pulumi.getStack();

const platform = new pulumi.StackReference(
  "organization/guestbook-platform/shared",
);
const networkName = platform.requireOutput("networkName");

const data = new docker.Volume("guestbook-data");

const adminToken = new random.RandomPassword("admin-token", {
  length: 24,
  special: false,
});

const tokenValue = configuredToken ?? adminToken.result;

const image = new docker.Image("guestbook-image", {
  imageName: "guestbook-app:v3",
  build: { context: "../app" },
  skipPush: true,
});

const container = new docker.Container("guestbook-web", {
  image: image.imageName,
  ports: [{ internal: 8080, external: port }],
  memory: limits.memoryMb,
  envs: [
    `TITLE=${title}`,
    pulumi.interpolate`ADMIN_TOKEN=${tokenValue}`,
  ],
  networksAdvanced: [{ name: networkName }],
  volumes: [{ volumeName: data.name, containerPath: "/data" }],
  labels: [{
    label: "guestbook.stack",
    value: stack,
  }, {
    label: "guestbook.info",
    value: pulumi.jsonStringify({
      network: networkName,
      port,
    }),
  }],
});

export const containerName = container.name;
export const containerId = container.id;
export const url = container.ports.apply(
  (ports) => `http://localhost:${ports?.[0].external}`,
);

export const where =
  pulumi.interpolate`${container.name} on ${networkName}`;
export const summary = pulumi
  .all([container.name, image.imageName])
  .apply(([name, img]) => `${name} runs ${img}`);
export const token = tokenValue;
