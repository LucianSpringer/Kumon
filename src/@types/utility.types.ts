/**
 * Utility Types for Deep Type Manipulation
 * 
 * These types enable complex type transformations used throughout
 * the GenericWrapper hierarchy.
 */

// ════════════════════════════════════════════════════════════════════════════
// Deep Transformations
// ════════════════════════════════════════════════════════════════════════════

/**
 * Make all properties deeply readonly (recursive)
 */
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Function
    ? T[P]
    : DeepReadonly<T[P]>
    : T[P];
};

/**
 * Make all properties deeply partial (recursive)
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object
    ? T[P] extends Function
    ? T[P]
    : DeepPartial<T[P]>
    : T[P];
};

/**
 * Make all properties deeply required (recursive)
 */
export type DeepRequired<T> = {
    [P in keyof T]-?: T[P] extends object
    ? T[P] extends Function
    ? T[P]
    : DeepRequired<T[P]>
    : T[P];
};

// ════════════════════════════════════════════════════════════════════════════
// Key Manipulation
// ════════════════════════════════════════════════════════════════════════════

/**
 * Make specific properties required
 */
export type RequireKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Make specific properties optional
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract non-nullable keys from type
 */
export type NonNullableKeys<T> = {
    [K in keyof T]-?: undefined extends T[K] ? never : K;
}[keyof T];

/**
 * Extract nullable keys from type
 */
export type NullableKeys<T> = {
    [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];

/**
 * Strict omit that errors on invalid keys
 */
export type StrictOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Strict pick that errors on invalid keys
 */
export type StrictPick<T, K extends keyof T> = Pick<T, K>;

// ════════════════════════════════════════════════════════════════════════════
// Union/Tuple Utilities
// ════════════════════════════════════════════════════════════════════════════

/**
 * Convert tuple type to union type
 */
export type TupleToUnion<T extends readonly unknown[]> = T[number];

/**
 * Get length of tuple
 */
export type TupleLength<T extends readonly unknown[]> = T['length'];

/**
 * Get first element of tuple
 */
export type Head<T extends readonly unknown[]> = T extends readonly [infer H, ...unknown[]] ? H : never;

/**
 * Get all elements except first
 */
export type Tail<T extends readonly unknown[]> = T extends readonly [unknown, ...infer R] ? R : never;

// ════════════════════════════════════════════════════════════════════════════
// Object Utilities
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get all values of an object as union
 */
export type ValueOf<T> = T[keyof T];

/**
 * Create type from entries (inverse of Object.entries)
 */
export type FromEntries<T extends readonly [string, unknown][]> = {
    [K in T[number]as K[0]]: K[1];
};

/**
 * Merge two types, with second overriding first
 */
export type Merge<T, U> = Omit<T, keyof U> & U;

/**
 * Make all properties mutable (remove readonly)
 */
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};

// ════════════════════════════════════════════════════════════════════════════
// Function Utilities
// ════════════════════════════════════════════════════════════════════════════

/**
 * Extract return type of async function
 */
export type AsyncReturnType<T extends (...args: unknown[]) => Promise<unknown>> =
    T extends (...args: unknown[]) => Promise<infer R> ? R : never;

/**
 * Make function parameters optional
 */
export type OptionalParameters<T extends (...args: unknown[]) => unknown> =
    T extends (...args: infer P) => infer R
    ? (...args: Partial<P>) => R
    : never;
