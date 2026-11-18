import * as pulumi from "@pulumi/pulumi";

export const created: pulumi.runtime.MockResourceArgs[] = [];

pulumi.runtime.setAllConfig({
  "guestbook-local:port": "8100",
  "guestbook-local:limits": '{"memoryMb": 96}',
});

pulumi.runtime.setMocks({
  newResource(args) {
    created.push(args);
    const state: any = { ...args.inputs };
    if (args.type === "pulumi:pulumi:StackReference") {
      state.outputs = { networkName: "shared-net" };
    }
    if (args.type === "random:index/randomPassword:RandomPassword") {
      state.result = "x".repeat(args.inputs.length);
    }
    if (args.type === "docker:index/volume:Volume") {
      state.name = `${args.name}-vol`;
    }
    return { id: `${args.name}-id`, state };
  },
  call: (args) => args.inputs,
}, "guestbook-local", "test", false);

// The mock engine cannot run resource hooks, so hooks are tested as plain
// functions; here we only let the program register them.
const callbacks: any =
  require("@pulumi/pulumi/runtime/settings").getCallbacks();
callbacks.registerResourceHook = async () => {};

export function value<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise((resolve) => output.apply(resolve));
}

export function registered(name: string) {
  return new Promise<pulumi.runtime.MockResourceArgs>((resolve) => {
    const look = () => {
      const found = created.find((r) => r.name === name);
      found ? resolve(found) : setTimeout(look, 5);
    };
    look();
  });
}
