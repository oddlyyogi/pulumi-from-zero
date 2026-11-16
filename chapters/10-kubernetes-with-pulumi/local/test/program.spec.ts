import * as assert from "assert";
import { created, value, registered } from "./mocks";

describe("Guestbook program", function () {
  let infra: typeof import("../index");
  before(() => {
    infra = require("../index");
  });

  it("uses the configured port", async () => {
    assert.strictEqual(await value(infra.url), "http://localhost:8100");
    assert.strictEqual(await value(infra.previewUrl),
      "http://localhost:8101");
  });

  it("joins the platform network", async () => {
    const web = await registered("guestbook-web");
    assert.deepStrictEqual(web.inputs.networksAdvanced,
      [{ name: "shared-net" }]);
  });

  it("gives every container a memory limit", async () => {
    await registered("preview-web");
    const containers = created.filter(
      (r) => r.type === "docker:index/container:Container");
    for (const c of containers) {
      assert.ok(c.inputs.memory > 0, `${c.name} has no memory limit`);
    }
  });

});
