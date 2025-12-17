/**
 * Bitwise Types for Chronology Engine
 * 
 * Weekly schedule represented as Array[7] of 32-bit integers.
 * Each element = 1 day, each bit = 1 hour slot.
 */

// ════════════════════════════════════════════════════════════════════════════
// Weekly Schedule Types
// ════════════════════════════════════════════════════════════════════════════

/**
 * Immutable weekly schedule (for storage/transmission)
 * 28 bytes total - 168 time slots
 */
export type WeeklySchedule = readonly [
    sunday: number,
    monday: number,
    tuesday: number,
    wednesday: number,
    thursday: number,
    friday: number,
    saturday: number
];

/**
 * Mutable weekly schedule (for encoding operations)
 */
export type MutableWeeklySchedule = [
    sunday: number,
    monday: number,
    tuesday: number,
    wednesday: number,
    thursday: number,
    friday: number,
    saturday: number
];

// ════════════════════════════════════════════════════════════════════════════
// Day Index Enum
// ════════════════════════════════════════════════════════════════════════════

export const DayIndex = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
} as const;

export type DayIndex = typeof DayIndex[keyof typeof DayIndex];

// ════════════════════════════════════════════════════════════════════════════
// Day Labels (for display)
// ════════════════════════════════════════════════════════════════════════════

export const DayLabel: Record<DayIndex, string> = {
    [DayIndex.SUNDAY]: 'Minggu',
    [DayIndex.MONDAY]: 'Senin',
    [DayIndex.TUESDAY]: 'Selasa',
    [DayIndex.WEDNESDAY]: 'Rabu',
    [DayIndex.THURSDAY]: 'Kamis',
    [DayIndex.FRIDAY]: 'Jumat',
    [DayIndex.SATURDAY]: 'Sabtu',
};

export const DayLabelShort: Record<DayIndex, string> = {
    [DayIndex.SUNDAY]: 'Min',
    [DayIndex.MONDAY]: 'Sen',
    [DayIndex.TUESDAY]: 'Sel',
    [DayIndex.WEDNESDAY]: 'Rab',
    [DayIndex.THURSDAY]: 'Kam',
    [DayIndex.FRIDAY]: 'Jum',
    [DayIndex.SATURDAY]: 'Sab',
};

// ════════════════════════════════════════════════════════════════════════════
// Time Range Interface
// ════════════════════════════════════════════════════════════════════════════

export interface TimeRange {
    readonly dayIndex: DayIndex;
    readonly startHour: number;  // 0-23
    readonly endHour: number;    // 1-24 (exclusive)
}

// ════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════

export const HOURS_PER_DAY = 24;
export const DAYS_PER_WEEK = 7;
export const TOTAL_SLOTS = HOURS_PER_DAY * DAYS_PER_WEEK; // 168

/**
 * Empty schedule (all slots unavailable)
 */
export const EMPTY_SCHEDULE: WeeklySchedule = [0, 0, 0, 0, 0, 0, 0];

/**
 * Full schedule (all slots available)
 * 0xFFFFFF = 24 bits all set to 1
 */
export const FULL_SCHEDULE: WeeklySchedule = [
    0xFFFFFF, 0xFFFFFF, 0xFFFFFF, 0xFFFFFF,
    0xFFFFFF, 0xFFFFFF, 0xFFFFFF
];
