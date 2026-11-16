import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
import { LocalWorkspace } from "@pulumi/pulumi/automation";

const [name, action = "up"] = process.argv.slice(2);

const program = async () => {
  const web = new docker.Container(`review-${name}`, {
    image: "guestbook-app:v3",
    ports: [{ internal: 8080, external: 8190 }],
    envs: [`TITLE=Review copy for ${name}`],
  });
  return {
    url: pulumi.interpolate`http://localhost:8190`,
    container: web.name,
  };
};

async function main() {
  const stack = await LocalWorkspace.createOrSelectStack({
    stackName: name,
    projectName: "guestbook-review",
    program,
  });
  if (action === "destroy") {
    await stack.destroy();
    await stack.workspace.removeStack(name);
    console.log(`removed review copy ${name}`);
    return;
  }
  const res = await stack.up();
  const { url, container } = res.outputs;
  console.log(`${res.summary.result}: ${url.value} (${container.value})`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
