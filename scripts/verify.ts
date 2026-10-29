/**
 * The course oracle: typecheck → lint → unit tests → database tests.
 * Stops at the first failing step and exits with a non-zero code.
 */
import { runInherit } from './lib/run';
import { VERIFY_STEPS } from './lib/verify-steps';

for (const step of VERIFY_STEPS) {
	console.log(`\n▶ verify: ${step.name}`);
	const code = runInherit(step.command, step.args);
	if (code !== 0) {
		console.error(`\n✖ verify falhou em "${step.name}" (código ${code})`);
		process.exit(code);
	}
}

console.log('\n✔ verify: tudo verde');
