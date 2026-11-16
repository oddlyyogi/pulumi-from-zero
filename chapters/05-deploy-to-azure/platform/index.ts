import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";

const network = new docker.Network("shared-net", {
  name: "guestbook-shared",
});

export const networkName = network.name;
