/** pnpm restore: removes the bug injected by `pnpm break`. */
import { readBrokenState, revertBug, writeBrokenState } from "./lib/bugs";

const root = process.cwd();
const applied = readBrokenState(root);

if (applied.length === 0) {
  console.log("Nenhum bug aplicado. Nada a restaurar.");
  process.exit(0);
}

for (const bugId of [...applied].reverse()) {
  const result = revertBug(root, bugId);
  if (!result.ok) {
    console.error(`Não foi possível reverter ${bugId}. O código foi alterado depois do break?\n${result.error}`);
    process.exit(1);
  }
  console.log(`Bug ${bugId} revertido.`);
}

writeBrokenState(root, []);
