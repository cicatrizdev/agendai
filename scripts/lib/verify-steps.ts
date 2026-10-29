export interface VerifyStep {
	name: string;
	command: string;
	args: string[];
	/** Steps that need the local Supabase stack. */
	needsDb: boolean;
}

/** The oracle, in order. `pnpm verify` stops at the first failure. */
export const VERIFY_STEPS: VerifyStep[] = [
	{ name: 'typecheck', command: 'pnpm', args: ['typecheck'], needsDb: false },
	{ name: 'lint', command: 'pnpm', args: ['lint'], needsDb: false },
	{ name: 'test', command: 'pnpm', args: ['test'], needsDb: false },
	// Resetting applies the migrations of this working tree before testing them.
	{ name: 'db reset', command: 'supabase', args: ['db', 'reset'], needsDb: true },
	{ name: 'db test', command: 'supabase', args: ['test', 'db'], needsDb: true },
];
