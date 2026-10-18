import { pathToFileURL } from "node:url";
import { contextCode, contextCodeAndTest } from "./contexts";
import { copyLab } from "./files";
import { runLoop } from "./loop";
import { complete, completeWithTools, type Reply, type ToolReply } from "./model";
import { applyPatch, parseReplacement } from "./patch";
import { specificationPrompt } from "./prompts";
import { runOneRound } from "./round";
import { runTests } from "./run-tests";
import { tools } from "./tools";

/** Trials per layer. The printed rate is the count from this run. */
export const RUNS = 5;

export const layers = ["prompt", "contexto", "harness", "loop"] as const;

export type LayerName = (typeof layers)[number];

export interface LayerScore {
  layer: LayerName;
  passed: number;
  runs: number;
}

type TextComplete = (prompt: string) => Promise<Reply>;
type ToolComplete = (prompt: string, toolList: typeof tools) => Promise<ToolReply>;

/** Applies one OLD:/NEW: reply and reports whether the tests pass. */
export function gradeText(dir: string, text: string): boolean {
  const replacement = parseReplacement(text);
  if (!replacement) return false;
  try {
    applyPatch(dir, replacement.oldString, replacement.newString);
  } catch {
    return false;
  }
  return runTests(dir).passed;
}

async function once(layer: LayerName, textComplete: TextComplete, toolComplete: ToolComplete): Promise<boolean> {
  const lab = copyLab();
  try {
    const spec = specificationPrompt();
    if (layer === "prompt") {
      const reply = await textComplete(contextCode(spec, lab.dir));
      return gradeText(lab.dir, reply.text);
    }
    if (layer === "contexto") {
      const reply = await textComplete(contextCodeAndTest(spec, lab.dir));
      return gradeText(lab.dir, reply.text);
    }
    if (layer === "harness") return (await runOneRound(lab.dir, toolComplete)).passed;
    return (await runLoop(lab.dir, toolComplete)).passed;
  } finally {
    lab.cleanup();
  }
}

/** Runs each pillar layer several times and counts real passes. */
export async function runScoreboard(
  textComplete: TextComplete,
  toolComplete: ToolComplete,
  runs = RUNS,
): Promise<LayerScore[]> {
  const scores: LayerScore[] = [];
  for (const layer of layers) {
    let passed = 0;
    for (let trial = 0; trial < runs; trial += 1) {
      if (await once(layer, textComplete, toolComplete)) passed += 1;
    }
    scores.push({ layer, passed, runs });
  }
  return scores;
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  const scores = await runScoreboard(complete, completeWithTools);
  console.log(`\n# mini-placar\n${RUNS} rodadas por camada. a taxa é a contagem desta execução.`);
  for (const score of scores) console.log(`${score.layer.padEnd(10)} ${score.passed}/${score.runs}`);
}
