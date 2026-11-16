// Guestbook API on Azure Static Web Apps managed functions.
const { app } = require("@azure/functions");
const { TableClient } = require("@azure/data-tables");

const table = TableClient.fromConnectionString(
  process.env.STORAGE_CONNECTION,
  "messages",
);

app.http("messages", {
  route: "messages",
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (request) => {
    if (request.method === "GET") {
      const items = [];
      for await (const e of table.listEntities()) {
        items.push({ name: e.name, text: e.text, at: e.rowKey });
      }
      return { jsonBody: items };
    }
    let msg = {};
    try { msg = await request.json(); } catch {}
    if (!msg.name || !msg.text) {
      const error = "name and text are required";
      return { status: 400, jsonBody: { error } };
    }
    const at = new Date().toISOString();
    const { name, text } = msg;
    const entity = { partitionKey: "messages", rowKey: at, name, text };
    await table.createEntity(entity);
    return { status: 201, jsonBody: { name, text, at } };
  },
});
