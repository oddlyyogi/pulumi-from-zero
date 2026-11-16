import {
  ConcurrentUpdateError, CommandError, LocalWorkspace,
} from "@pulumi/pulumi/automation";
import * as copies from "./copies";

const [action, ...names] = process.argv.slice(2);

async function main() {
  if (action === "up") {
    for (const n of names) {
      const c = await copies.upCopy(n, console.log);
      console.log(`${n}: ${c.result} ${JSON.stringify(c.changes)}`);
      console.log(`  ${c.url}  token ${c.token}`);
    }
  } else if (action === "batch") {
    const all = await Promise.all(names.map((n) => copies.upCopy(n)));
    for (const c of all) console.log(`${c.name}: ${c.result} ${c.url}`);
  } else if (action === "preview") {
    for (const n of names) console.log(n, await copies.previewCopy(n));
  } else if (action === "refresh") {
    for (const n of names) console.log(n, await copies.refreshCopy(n));
  } else if (action === "history") {
    for (const n of names) console.log(n, await copies.historyOf(n));
  } else if (action === "backup") {
    for (const n of names) {
      console.log(`${n}: ${await copies.backupCopy(n)} resources saved`);
    }
  } else if (action === "audit") {
    const all = await copies.listCopies();
    const found = await Promise.all(all.map(async (c) =>
      [c.name, await copies.refreshCopy(c.name)] as const));
    for (const [n, ch] of found) {
      const drifted = Object.keys(ch ?? {}).some((k) => k !== "same");
      console.log(`${n.padEnd(6)} ${drifted ? "DRIFT " : "ok    "}`,
        JSON.stringify(ch));
    }
  } else if (action === "info") {
    const ws = await LocalWorkspace.create({ workDir: "../local" });
    const who = await ws.whoAmI();
    console.log(`backend: ${who.url}`);
    console.log(`pulumi:  ${ws.pulumiVersion}`);
  } else if (action === "down") {
    for (const n of names) {
      await copies.downCopy(n);
      console.log(`${n}: removed`);
    }
  } else if (action === "list") {
    console.table(await copies.listCopies());
  } else {
    console.log("usage: cli.ts <action> <names>");
  }
}

main().catch((e) => {
  if (e instanceof ConcurrentUpdateError) {
    console.error("Someone else is updating this copy; try again later.");
  } else if (e instanceof CommandError) {
    const lines = e.message.split("\n").filter((l) => l.includes("error:"));
    console.error("The update failed:\n" + lines.slice(0, 2).join("\n"));
  } else {
    console.error(e);
  }
  process.exit(1);
});
