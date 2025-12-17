/**
 * TransactionState Enum
 * 
 * State machine for transaction lifecycle.
 * Uses BITWISE values for fast state operations.
 */

export const TransactionState = {
    // Initial states (bits 0-1)
    DRAFT: 0b0000_0001,              // 1
    PENDING_PAYMENT: 0b0000_0010,    // 2

    // Active states (bits 2-4)
    PAYMENT_CONFIRMED: 0b0000_0100,  // 4
    SESSION_SCHEDULED: 0b0000_1000,  // 8
    IN_PROGRESS: 0b0001_0000,        // 16

    // Completion states (bits 5-6)
    COMPLETED: 0b0010_0000,          // 32
    RATED: 0b0100_0000,              // 64

    // Terminal states (bits 7-9)
    CANCELLED: 0b1000_0000,          // 128
    REFUNDED: 0b1_0000_0000,         // 256
    DISPUTED: 0b10_0000_0000,        // 512
} as const;

export type TransactionState = typeof TransactionState[keyof typeof TransactionState];

/**
 * Display labels
 */
export const TransactionStateLabel: Record<TransactionState, string> = {
    [TransactionState.DRAFT]: 'Draft',
    [TransactionState.PENDING_PAYMENT]: 'Menunggu Pembayaran',
    [TransactionState.PAYMENT_CONFIRMED]: 'Pembayaran Dikonfirmasi',
    [TransactionState.SESSION_SCHEDULED]: 'Sesi Terjadwal',
    [TransactionState.IN_PROGRESS]: 'Sedang Berlangsung',
    [TransactionState.COMPLETED]: 'Selesai',
    [TransactionState.RATED]: 'Sudah Dinilai',
    [TransactionState.CANCELLED]: 'Dibatalkan',
    [TransactionState.REFUNDED]: 'Dikembalikan',
    [TransactionState.DISPUTED]: 'Dalam Sengketa',
};

/**
 * State transition map
 * Defines valid next states from each state
 */
export const TransactionStateTransitions: Record<TransactionState, readonly TransactionState[]> = {
    [TransactionState.DRAFT]: [TransactionState.PENDING_PAYMENT, TransactionState.CANCELLED],
    [TransactionState.PENDING_PAYMENT]: [TransactionState.PAYMENT_CONFIRMED, TransactionState.CANCELLED],
    [TransactionState.PAYMENT_CONFIRMED]: [TransactionState.SESSION_SCHEDULED, TransactionState.REFUNDED],
    [TransactionState.SESSION_SCHEDULED]: [TransactionState.IN_PROGRESS, TransactionState.CANCELLED],
    [TransactionState.IN_PROGRESS]: [TransactionState.COMPLETED, TransactionState.DISPUTED],
    [TransactionState.COMPLETED]: [TransactionState.RATED],
    [TransactionState.RATED]: [],
    [TransactionState.CANCELLED]: [],
    [TransactionState.REFUNDED]: [],
    [TransactionState.DISPUTED]: [TransactionState.REFUNDED, TransactionState.COMPLETED],
};

/**
 * Check if state transition is valid
 */
export const canTransitionTo = (
    current: TransactionState,
    target: TransactionState
): boolean => {
    const allowedTransitions = TransactionStateTransitions[current];
    return allowedTransitions?.includes(target) ?? false;
};

/**
 * Check if state is terminal (no further transitions)
 */
export const isTerminalState = (state: TransactionState): boolean => {
    return TransactionStateTransitions[state]?.length === 0;
};

/**
 * Check if state is active (in progress)
 */
export const isActiveState = (state: TransactionState): boolean => {
    return (
        state === TransactionState.PAYMENT_CONFIRMED ||
        state === TransactionState.SESSION_SCHEDULED ||
        state === TransactionState.IN_PROGRESS
    );
};

/**
 * State groups using bitwise masks
 */
export const StateGroups = {
    INITIAL: TransactionState.DRAFT | TransactionState.PENDING_PAYMENT,
    ACTIVE: TransactionState.PAYMENT_CONFIRMED | TransactionState.SESSION_SCHEDULED | TransactionState.IN_PROGRESS,
    COMPLETED: TransactionState.COMPLETED | TransactionState.RATED,
    TERMINAL: TransactionState.CANCELLED | TransactionState.REFUNDED | TransactionState.DISPUTED,
} as const;

/**
 * Check if state belongs to a group (bitwise check)
 */
export const isInStateGroup = (state: TransactionState, group: number): boolean => {
    return (state & group) === state;
};
