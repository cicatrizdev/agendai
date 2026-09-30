/** pnpm break --bug=<id>: injects a catalogued bug into the Agendaí. */
import { applyBug, readBrokenState, writeBrokenState } from "./lib/bugs";
import { readFlag } from "./lib/run";

const root = process.cwd();
const bugId = readFlag("bug");

if (!bugId) {
  console.error("Uso: pnpm break --bug=<id>   (ex.: pnpm break --bug=bug-001)");
  process.exit(1);
}

const applied = readBrokenState(root);
if (applied.length > 0) {
  console.error(`Já existe bug aplicado (${applied.join(", ")}). Rode "pnpm restore" antes.`);
  process.exit(1);
}

const result = applyBug(root, bugId);
if (!result.ok) {
  console.error(result.error);
  process.exit(1);
}

writeBrokenState(root, [bugId]);
console.log(`Bug ${bugId} aplicado. Use "pnpm restore" para desfazer.`);
