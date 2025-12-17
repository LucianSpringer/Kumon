/**
 * Branded Types (Nominal Typing)
 * 
 * Prevents accidental mixing of ID types at compile-time.
 * Example: TutorId cannot be assigned to StudentId even though both are strings.
 */

declare const __brand: unique symbol;

/**
 * Branded type pattern for compile-time type safety
 * Creates a nominal type from a structural type
 */
export type Brand<T, TBrand extends string> = T & {
    readonly [__brand]: TBrand;
};

// ════════════════════════════════════════════════════════════════════════════
// Entity IDs - Compile-time type safety
// ════════════════════════════════════════════════════════════════════════════

export type TutorId = Brand<string, 'TutorId'>;
export type StudentId = Brand<string, 'StudentId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type TransactionId = Brand<string, 'TransactionId'>;
export type UserId = Brand<string, 'UserId'>;

// ════════════════════════════════════════════════════════════════════════════
// Numeric Brands - Prevent unit confusion
// ════════════════════════════════════════════════════════════════════════════

/** Price in IDR cents (Rp 50.000 = 5000000) */
export type Price = Brand<number, 'Price'>;

/** Rating 0-5 scale */
export type Rating = Brand<number, 'Rating'>;

/** Unix timestamp in milliseconds */
export type Timestamp = Brand<number, 'Timestamp'>;

/** GeoHash for location-based queries */
export type GeoHash = Brand<string, 'GeoHash'>;

// ════════════════════════════════════════════════════════════════════════════
// Factory Functions - Create branded values safely
// ════════════════════════════════════════════════════════════════════════════

export const createTutorId = (id: string): TutorId => id as TutorId;
export const createStudentId = (id: string): StudentId => id as StudentId;
export const createSessionId = (id: string): SessionId => id as SessionId;
export const createTransactionId = (id: string): TransactionId => id as TransactionId;
export const createUserId = (id: string): UserId => id as UserId;

export const createPrice = (value: number): Price => value as Price;
export const createRating = (value: number): Rating => {
    if (value < 0 || value > 5) {
        throw new RangeError('Rating must be between 0 and 5');
    }
    return value as Rating;
};
export const createTimestamp = (value: number): Timestamp => value as Timestamp;
export const createGeoHash = (value: string): GeoHash => value as GeoHash;

// ════════════════════════════════════════════════════════════════════════════
// Type Guards - Runtime validation
// ════════════════════════════════════════════════════════════════════════════

export const isTutorId = (value: unknown): value is TutorId =>
    typeof value === 'string' && value.startsWith('tutor_');

export const isStudentId = (value: unknown): value is StudentId =>
    typeof value === 'string' && value.startsWith('student_');

export const isValidPrice = (value: unknown): value is Price =>
    typeof value === 'number' && value >= 0 && Number.isInteger(value);

export const isValidRating = (value: unknown): value is Rating =>
    typeof value === 'number' && value >= 0 && value <= 5;
