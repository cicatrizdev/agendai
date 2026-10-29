import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { runSession } from "./runner";
import { loadTask, repoRoot } from "./tasks";

const argv = process.argv.slice(2).filter((arg) => arg !== "--");

function usage(): never {
  console.error("Uso: pnpm autofix round --task=bug-001");
  process.exit(1);
}

function readFlag(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = argv.indexOf(`--${name}`);
  if (index >= 0) return argv[index + 1];
  return undefined;
}

function readBroken(root: string): string[] {
  const file = join(root, ".autofix", "broken.json");
  if (!existsSync(file)) return [];
  return JSON.parse(readFileSync(file, "utf8")) as string[];
}

function requireBroken(root: string, bug: string): void {
  if (!bug) return;
  if (!readBroken(root).includes(bug)) {
    throw new Error(`O bug ${bug} não está aplicado. Rode: pnpm break --bug=${bug}`);
  }
}

function gitDiffStat(root: string): string {
  const result = spawnSync("git", ["diff", "--stat"], {
    cwd: root,
    encoding: "utf8",
  });
  return (result.stdout ?? "").trim();
}

function round(): void {
  const id = readFlag("task");
  if (!id) usage();

  const root = repoRoot();
  const task = loadTask(id, root);
  requireBroken(root, task.bug);

  const session = runSession(root, task);
  const diff = gitDiffStat(root);

  console.log("# modelo");
  if (session) console.log(session);
  if (diff) console.log(diff);
  console.log("# parada");
  console.log("uma sessão. sem segunda chamada.");
}

try {
  if (argv[0] !== "round") usage();
  round();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
