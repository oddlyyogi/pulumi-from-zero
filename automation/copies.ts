import * as fs from "fs";
import { LocalWorkspace, Stack } from "@pulumi/pulumi/automation";

const WORK_DIR = "../local";
const PORTS: Record<string, number> = {
  qa: 8181, demo: 8183, ada: 8185, alan: 8187, clash: 8181,
};

function open(name: string): Promise<Stack> {
  return LocalWorkspace.createOrSelectStack({
    stackName: name, workDir: WORK_DIR,
  });
}

export async function upCopy(
  name: string, log: (line: string) => void = () => {},
) {
  const stack = await open(name);
  const port = String(PORTS[name] ?? 8189);
  await stack.setConfig("port", { value: port });
  await stack.setConfig("limits.memoryMb", { value: "64" }, true);
  await stack.setConfig("title", { value: `Guestbook (${name})` });
  const res = await stack.up({
    onEvent: (e) => {
      const done = e.resOutputsEvent;
      if (done) log(`  done ${done.metadata.urn.split("::").pop()}`);
      if (e.summaryEvent) {
        log(`  took ${e.summaryEvent.durationSeconds}s`);
      }
    },
  });
  const token = res.outputs.token;
  return {
    name, result: res.summary.result,
    changes: res.summary.resourceChanges,
    url: res.outputs.url.value as string,
    token: token.secret ? "[secret]" : token.value,
  };
}

export async function previewCopy(name: string) {
  return (await (await open(name)).preview()).changeSummary;
}

export async function refreshCopy(name: string) {
  return (await (await open(name)).refresh()).summary.resourceChanges;
}

export async function historyOf(name: string) {
  const updates = await (await open(name)).history(3);
  return updates.map((u) => `${u.kind} ${u.result} ` +
    JSON.stringify(u.resourceChanges));
}

export async function backupCopy(name: string) {
  const state = await (await open(name)).exportStack();
  fs.mkdirSync("backups", { recursive: true });
  fs.writeFileSync(`backups/${name}.json`, JSON.stringify(state, null, 2));
  return state.deployment.resources.length;
}

export async function downCopy(name: string) {
  const stack = await open(name);
  await stack.destroy();
  await stack.workspace.removeStack(name);
}

export async function listCopies() {
  const ws = await LocalWorkspace.create({ workDir: WORK_DIR });
  return (await ws.listStacks()).map((s) => ({
    name: s.name, resources: s.resourceCount ?? 0,
  }));
}
