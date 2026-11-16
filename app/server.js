// Guestbook web server: plain Node.js, no packages needed.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 8080);
const DATA_FILE = process.env.DATA_FILE || "/data/messages.json";
const TITLE = process.env.TITLE || "Guestbook";

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function save(list) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

function json(res, status, value) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(value));
}

const server = http.createServer((req, res) => {
  if (req.url === "/api/messages" && req.method === "GET") {
    return json(res, 200, load());
  }
  if (req.url === "/api/messages" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    return req.on("end", () => {
      let msg = {};
      try { msg = JSON.parse(body); } catch {}
      if (!msg.name || !msg.text) {
        return json(res, 400, { error: "name and text are required" });
      }
      const entry = { name: msg.name, text: msg.text, at: new Date() };
      const list = load();
      list.push(entry);
      save(list);
      json(res, 201, entry);
    });
  }
  if (req.url === "/api/messages" && req.method === "DELETE") {
    const token = process.env.ADMIN_TOKEN;
    if (!token || req.headers["x-admin-token"] !== token) {
      return json(res, 403, { error: "admin token required" });
    }
    const deleted = load().length;
    save([]);
    return json(res, 200, { deleted });
  }
  if (req.url === "/config.js") {
    res.writeHead(200, { "content-type": "text/javascript" });
    return res.end(`window.TITLE = ${JSON.stringify(TITLE)};`);
  }
  res.writeHead(200, { "content-type": "text/html" });
  res.end(fs.readFileSync(path.join(__dirname, "public", "index.html")));
});

server.listen(PORT, () => console.log(`Guestbook listening on ${PORT}`));
