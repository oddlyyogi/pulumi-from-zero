import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
import * as random from "@pulumi/random";

export interface GuestbookArgs {
  image: pulumi.Input<string>;
  network: pulumi.Input<string>;
  port: number;
  title: string;
  memoryMb: number;
  adminToken?: pulumi.Input<string>;
}

export class Guestbook extends pulumi.ComponentResource {
  public readonly url: pulumi.Output<string>;
  public readonly containerName: pulumi.Output<string>;
  public readonly token: pulumi.Output<string>;

  constructor(
    name: string,
    args: GuestbookArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super("guestbook:app:Guestbook", name, {}, opts);
    if (args.memoryMb < 32) {
      throw new Error(`${name}: memoryMb must be at least 32`);
    }
    const child = { parent: this };

    const data = new docker.Volume(`${name}-data`, {}, child);

    const generated = new random.RandomPassword(`${name}-token`, {
      length: 24,
      special: false,
    }, child);
    this.token = pulumi.output(args.adminToken ?? generated.result);

    const container = new docker.Container(`${name}-web`, {
      image: args.image,
      ports: [{ internal: 8080, external: args.port }],
      memory: args.memoryMb,
      envs: [
        `TITLE=${args.title}`,
        pulumi.interpolate`ADMIN_TOKEN=${this.token}`,
      ],
      networksAdvanced: [{ name: args.network }],
      volumes: [{ volumeName: data.name, containerPath: "/data" }],
      labels: [{
        label: "guestbook.stack",
        value: pulumi.getStack(),
      }, {
        label: "guestbook.info",
        value: pulumi.jsonStringify({
          network: args.network,
          port: args.port,
        }),
      }],
    }, {
      ...child,
      ignoreChanges: ["memorySwap"],
      deleteBeforeReplace: true,
    });

    this.containerName = container.name;
    this.url = pulumi.interpolate`http://localhost:${args.port}`;
    this.registerOutputs({
      url: this.url,
      containerName: this.containerName,
    });
  }
}
