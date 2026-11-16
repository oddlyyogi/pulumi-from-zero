import * as assert from "assert";
import { restartUnlessStopped } from "../transforms";

describe("restartUnlessStopped", function () {
  it("sets the restart policy on containers", () => {
    const result = restartUnlessStopped({
      type: "docker:index/container:Container", name: "web",
      custom: true, props: { image: "img" }, opts: {},
    });
    assert.deepStrictEqual(result?.props,
      { image: "img", restart: "unless-stopped" });
  });

  it("leaves other resources alone", () => {
    const result = restartUnlessStopped({
      type: "docker:index/volume:Volume", name: "data",
      custom: true, props: {}, opts: {},
    });
    assert.strictEqual(result, undefined);
  });
});
