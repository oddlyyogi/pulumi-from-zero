import * as assert from "assert";
import { execSync } from "child_process";
import { LocalWorkspace, Stack } from "@pulumi/pulumi/automation";

describe("Guestbook on Docker", function () {
  this.timeout(10 * 60 * 1000);
  let stack: Stack;
  let url: string;

  before(async () => {
    stack = await LocalWorkspace.createOrSelectStack({
      stackName: "ci", workDir: ".",
    });
    await stack.setConfig("port", { value: "8091" });
    await stack.setConfig("limits.memoryMb", { value: "64" }, true);
    const result = await stack.up();
    url = result.outputs.url.value;
  });

  after(async () => {
    await stack.destroy();
    await stack.workspace.removeStack("ci");
  });

  it("stores and returns a message", async () => {
    const post = await fetch(`${url}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "CI", text: "hello from a test" }),
    });
    assert.strictEqual(post.status, 201);
    const list = await (await fetch(`${url}/api/messages`)).json();
    assert.strictEqual(list[0].text, "hello from a test");
  });

  it("restarts the preview copy unless stopped", () => {
    const id = execSync("docker ps -q --filter label=guestbook.stack=ci"
      + " --filter name=preview-web").toString().trim();
    const policy = execSync(
      `docker inspect ${id} --format "{{.HostConfig.RestartPolicy.Name}}"`);
    assert.strictEqual(policy.toString().trim(), "unless-stopped");
  });
});
