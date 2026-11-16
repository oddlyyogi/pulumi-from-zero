// Guestbook API on AWS Lambda: messages are stored in DynamoDB.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand }
  from "@aws-sdk/lib-dynamodb";

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;

const reply = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.requestContext.http.method === "GET") {
    const out = await db.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": "messages" },
    }));
    return reply(200, out.Items.map(({ pk, ...m }) => m));
  }
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body ?? "", "base64").toString()
    : event.body ?? "";
  let msg = {};
  try { msg = JSON.parse(raw); } catch {}
  if (!msg.name || !msg.text) {
    return reply(400, { error: "name and text are required" });
  }
  const at = new Date().toISOString();
  if (msg.text.length > 200) {
    return reply(400, { error: "text is limited to 200 characters" });
  }
  const entry = { name: msg.name, text: msg.text, at };
  const item = { pk: "messages", ...entry };
  await db.send(new PutCommand({ TableName: TABLE, Item: item }));
  return reply(201, entry);
};
