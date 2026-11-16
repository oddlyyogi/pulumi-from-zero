import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";

const network = new docker.Network("guestbook-net", {
  name: "guestbook-net",
});

const image = new docker.Image("guestbook-image", {
  imageName: "guestbook-app:v1",
  build: { context: "../app" },
  skipPush: true,
});

const container = new docker.Container("guestbook-web", {
  name: "guestbook-web",
  image: image.imageName,
  ports: [{ internal: 8080, external: 8081 }],
  envs: ["TITLE=Guestbook on Docker"],
  networksAdvanced: [{ name: network.name }],
});

export const containerName = container.name;
export const url = "http://localhost:8081";
