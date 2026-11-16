import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
import * as random from "@pulumi/random";

const network = new docker.Network("guestbook-net");

const data = new docker.Volume("guestbook-data");

const adminToken = new random.RandomPassword("admin-token", {
  length: 24,
  special: false,
});

const image = new docker.Image("guestbook-image", {
  imageName: "guestbook-app:v3",
  build: { context: "../app" },
  skipPush: true,
});

const container = new docker.Container("guestbook-web", {
  image: image.imageName,
  ports: [{ internal: 8080, external: 8081 }],
  envs: [
    "TITLE=Guestbook with a volume",
    pulumi.interpolate`ADMIN_TOKEN=${adminToken.result}`,
  ],
  networksAdvanced: [{ name: network.name }],
  volumes: [{ volumeName: data.name, containerPath: "/data" }],
  labels: [{
    label: "guestbook.info",
    value: pulumi.jsonStringify({
      network: network.name,
      port: 8081,
    }),
  }],
});


export const containerName = container.name;
export const containerId = container.id;
export const url = container.ports.apply(
  (ports) => `http://localhost:${ports?.[0].external}`,
);

export const where =
  pulumi.interpolate`${container.name} on ${network.name}`;
export const summary = pulumi
  .all([container.name, image.imageName])
  .apply(([name, img]) => `${name} runs ${img}`);
export const token = adminToken.result;
