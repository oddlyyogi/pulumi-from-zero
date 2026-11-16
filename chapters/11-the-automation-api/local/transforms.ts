import * as pulumi from "@pulumi/pulumi";

export function restartUnlessStopped(
  args: pulumi.ResourceTransformArgs,
): pulumi.ResourceTransformResult | undefined {
  if (args.type !== "docker:index/container:Container") {
    return undefined;
  }
  return {
    props: { ...args.props, restart: "unless-stopped" },
    opts: args.opts,
  };
}
