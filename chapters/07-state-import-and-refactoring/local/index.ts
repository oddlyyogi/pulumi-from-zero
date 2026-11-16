import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
import { Guestbook } from "./guestbook";

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

const image = new docker.Image("app-image", {
  imageName: "guestbook-app:v3",
  build: { context: "../app" },
  skipPush: true,
}, { aliases: [{ name: "guestbook-image" }] });
const main = new Guestbook("guestbook", {
  image: image.imageName,
  network: networkName,
  port,
  title,
  memoryMb: limits.memoryMb,
  adminToken: configuredToken,
});

const previewApp = new Guestbook("preview", {
  image: image.imageName,
  network: networkName,
  port: port + 1,
  title: `${title}, preview`,
  memoryMb: 64,
}, {
  transforms: [(args) =>
    args.type === "docker:index/container:Container"
      ? { props: { ...args.props, restart: "unless-stopped" },
          opts: args.opts }
      : undefined],
});

const extraNames = config.getObject<string[]>("extraCopies") ?? [];
const extras = extraNames.map((copy, i) => new Guestbook(copy, {
  image: image.imageName,
  network: networkName,
  port: port + 2 + i,
  title: `${title}, ${copy}`,
  memoryMb: 64,
}));

export const url = main.url;
export const containerName = main.containerName;
export const token = main.token;
export const previewUrl = previewApp.url;
export const extraUrls = extras.map((g) => g.url);
