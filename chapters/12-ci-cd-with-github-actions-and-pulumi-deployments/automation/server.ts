import * as http from "http";
import { ConcurrentUpdateError } from "@pulumi/pulumi/automation";
import * as copies from "./copies";

function send(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  const [, root, name] = (req.url ?? "").split("/");
  if (root !== "copies") return send(res, 404, { error: "not found" });
  if (name && !/^[a-z][a-z0-9-]{1,20}$/.test(name)) {
    return send(res, 400, { error: "bad name" });
  }
  try {
    if (req.method === "GET" && !name) {
      return send(res, 200, await copies.listCopies());
    }
    if (req.method === "POST" && name) {
      return send(res, 201, await copies.upCopy(name));
    }
    if (req.method === "DELETE" && name) {
      await copies.downCopy(name);
      return send(res, 200, { removed: name });
    }
    send(res, 405, { error: "method not allowed" });
  } catch (e) {
    const busy = e instanceof ConcurrentUpdateError;
    send(res, busy ? 409 : 500, { error: String(e).split("\n")[0] });
  }
});
server.listen(7070, () => console.log("copies service on port 7070"));
