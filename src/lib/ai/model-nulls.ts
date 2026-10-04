/**
 * Model response schemas mark "may be absent" fields as `.nullable()`, never
 * `.optional()`: OpenAI's strict structured outputs require every key to be
 * present, so a missing value has to come back as `null`. The client-facing
 * shape is unchanged, though — those keys used to be optional — so the
 * server drops the nulls again before answering.
 */

type Primitive = string | number | boolean | bigint | symbol | undefined;

/** `{ a: string | null }` → `{ a?: string }`, recursively. */
export type NullsToOptional<T> = T extends Primitive
  ? T
  : T extends (infer U)[]
    ? NullsToOptional<U>[]
    : T extends object
      ? {
          [K in keyof T as null extends T[K] ? never : K]: NullsToOptional<T[K]>;
        } & {
          [K in keyof T as null extends T[K] ? K : never]?: NullsToOptional<Exclude<T[K], null>>;
        } extends infer O
        ? { [K in keyof O]: O[K] }
        : never
      : T;

/** Deletes every object key whose value is `null`, recursively. */
export function stripNulls<T>(value: T): NullsToOptional<T> {
  if (Array.isArray(value)) {
    return value.map((item) => stripNulls(item)) as NullsToOptional<T>;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (child === null) continue;
      out[key] = stripNulls(child);
    }
    return out as NullsToOptional<T>;
  }
  return value as NullsToOptional<T>;
}
