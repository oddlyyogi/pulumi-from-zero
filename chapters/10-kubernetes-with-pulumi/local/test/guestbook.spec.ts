import * as assert from "assert";
import { value, registered } from "./mocks";
import { Guestbook } from "../guestbook";

describe("Guestbook component", function () {
  it("serves on the port we ask for", async () => {
    const gb = new Guestbook("t1", {
      image: "img", network: "net", port: 8101, title: "T", memoryMb: 64,
    });
    assert.strictEqual(await value(gb.url), "http://localhost:8101");
    const web = await registered("t1-web");
    assert.deepStrictEqual(web.inputs.ports,
      [{ internal: 8080, external: 8101 }]);
  });

  it("refuses less than 32 MB", () => {
    assert.throws(() => new Guestbook("t2", {
      image: "img", network: "net", port: 8102, title: "T", memoryMb: 16,
    }), /at least 32/);
  });

  it("generates a 24 character token", async () => {
    const gb = new Guestbook("t3", {
      image: "img", network: "net", port: 8103, title: "T", memoryMb: 64,
    });
    assert.strictEqual((await value(gb.token)).length, 24);
  });

  it("mounts its own volume", async () => {
    new Guestbook("t5", {
      image: "img", network: "net", port: 8105, title: "T", memoryMb: 64,
    });
    const web = await registered("t5-web");
    assert.strictEqual(web.inputs.volumes[0].volumeName,
      "t5-data-vol");
  });
});
