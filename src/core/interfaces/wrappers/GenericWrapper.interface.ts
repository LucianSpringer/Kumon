/**
 * GenericWrapper Hierarchy
 * 
 * Deep generic interfaces for type-safe data wrapping.
 * Enforces immutability and metadata tracking.
 */

import { DeepReadonly } from '../../../@types/utility.types';
import { Timestamp } from '../../../@types/branded.types';

// ════════════════════════════════════════════════════════════════════════════
// Metadata
// ════════════════════════════════════════════════════════════════════════════

/**
 * Metadata attached to every wrapped entity
 */
export interface WrapperMetadata {
    readonly createdAt: Timestamp;
    readonly updatedAt: Timestamp;
    readonly version: number;
    readonly checksum: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Base Constraint
// ════════════════════════════════════════════════════════════════════════════

/**
 * Base constraint for wrappable entities
 * Every entity must have an ID
 */
export interface WrappableEntity {
    readonly id: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Level 1: Core Generic Wrapper
// ════════════════════════════════════════════════════════════════════════════

/**
 * GenericWrapper<T>
 * 
 * The base wrapper that enforces:
 * - Deep immutability via DeepReadonly
 * - Metadata tracking (created, updated, version)
 * - Type discrimination via _type field
 */
export interface GenericWrapper<T extends WrappableEntity> {
    readonly data: DeepReadonly<T>;
    readonly meta: WrapperMetadata;
    readonly _type: 'GenericWrapper';
}

// ════════════════════════════════════════════════════════════════════════════
// Level 2: Queryable Wrapper
// ════════════════════════════════════════════════════════════════════════════

/**
 * QueryableWrapper<T, TFilter>
 * 
 * Extends GenericWrapper with filtering capabilities.
 * Used for search results and filtered lists.
 */
export interface QueryableWrapper<
    T extends WrappableEntity,
    TFilter extends Record<string, unknown> = Record<string, unknown>
> extends Omit<GenericWrapper<T>, '_type'> {
    readonly filters: DeepReadonly<TFilter>;
    readonly _type: 'QueryableWrapper';
}

// ════════════════════════════════════════════════════════════════════════════
// Level 3: Streamable Wrapper
// ════════════════════════════════════════════════════════════════════════════

/**
 * StreamableWrapper<T, TFilter, TEvent>
 * 
 * Extends QueryableWrapper with real-time update capabilities.
 * Used for WebSocket/SSE streams.
 */
export interface StreamableWrapper<
    T extends WrappableEntity,
    TFilter extends Record<string, unknown> = Record<string, unknown>,
    TEvent extends string = string
> extends Omit<QueryableWrapper<T, TFilter>, '_type'> {
    readonly streamId: string;
    readonly eventType: TEvent;
    readonly sequence: number;
    readonly _type: 'StreamableWrapper';
}

// ════════════════════════════════════════════════════════════════════════════
// Level 4: Transactional Wrapper
// ════════════════════════════════════════════════════════════════════════════

/**
 * TransactionalWrapper<T, TFilter, TEvent, TState>
 * 
 * Extends StreamableWrapper with rollback capability.
 * Used for transactions that may need to be reverted.
 */
export interface TransactionalWrapper<
    T extends WrappableEntity,
    TFilter extends Record<string, unknown> = Record<string, unknown>,
    TEvent extends string = string,
    TState extends string = string
> extends Omit<StreamableWrapper<T, TFilter, TEvent>, '_type'> {
    readonly transactionState: TState;
    readonly previousState: DeepReadonly<T> | null;
    readonly canRollback: boolean;
    readonly _type: 'TransactionalWrapper';
}

// ════════════════════════════════════════════════════════════════════════════
// Factory Functions
// ════════════════════════════════════════════════════════════════════════════

/**
 * Create a GenericWrapper from raw data
 */
export function wrapEntity<T extends WrappableEntity>(
    data: T,
    checksum: string = ''
): GenericWrapper<T> {
    const now = Date.now() as Timestamp;
    return {
        data: data as DeepReadonly<T>,
        meta: {
            createdAt: now,
            updatedAt: now,
            version: 1,
            checksum,
        },
        _type: 'GenericWrapper',
    };
}

/**
 * Create a QueryableWrapper from raw data with filters
 */
export function wrapQueryable<
    T extends WrappableEntity,
    TFilter extends Record<string, unknown>
>(
    data: T,
    filters: TFilter,
    checksum: string = ''
): QueryableWrapper<T, TFilter> {
    const now = Date.now() as Timestamp;
    return {
        data: data as DeepReadonly<T>,
        meta: {
            createdAt: now,
            updatedAt: now,
            version: 1,
            checksum,
        },
        filters: filters as DeepReadonly<TFilter>,
        _type: 'QueryableWrapper',
    };
}

// ════════════════════════════════════════════════════════════════════════════
// Type Guards
// ════════════════════════════════════════════════════════════════════════════

export function isGenericWrapper<T extends WrappableEntity>(
    value: unknown
): value is GenericWrapper<T> {
    return (
        typeof value === 'object' &&
        value !== null &&
        '_type' in value &&
        (value as { _type: string })._type === 'GenericWrapper'
    );
}

export function isQueryableWrapper<
    T extends WrappableEntity,
    TFilter extends Record<string, unknown>
>(value: unknown): value is QueryableWrapper<T, TFilter> {
    return (
        typeof value === 'object' &&
        value !== null &&
        '_type' in value &&
        (value as { _type: string })._type === 'QueryableWrapper'
    );
}

export function isStreamableWrapper<
    T extends WrappableEntity,
    TFilter extends Record<string, unknown>,
    TEvent extends string
>(value: unknown): value is StreamableWrapper<T, TFilter, TEvent> {
    return (
        typeof value === 'object' &&
        value !== null &&
        '_type' in value &&
        (value as { _type: string })._type === 'StreamableWrapper'
    );
}

export function isTransactionalWrapper<
    T extends WrappableEntity,
    TFilter extends Record<string, unknown>,
    TEvent extends string,
    TState extends string
>(value: unknown): value is TransactionalWrapper<T, TFilter, TEvent, TState> {
    return (
        typeof value === 'object' &&
        value !== null &&
        '_type' in value &&
        (value as { _type: string })._type === 'TransactionalWrapper'
    );
}
