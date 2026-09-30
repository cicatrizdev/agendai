/** A value that is either a success (`ok: true`) or an expected failure (`ok: false`). */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Builds a successful Result. */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/** Builds a failed Result. */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
