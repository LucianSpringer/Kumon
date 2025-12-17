/**
 * TimeSlotDecoder - Binary to Visual Transformation
 * 
 * Decodes bitmasks directly to Canvas-ready formats.
 * NO intermediate JSON - direct bit operations to visual data.
 */

import {
    WeeklySchedule,
    DayIndex,
    DayLabelShort,
    HOURS_PER_DAY,
    DAYS_PER_WEEK
} from './types';

export class TimeSlotDecoder {

    /**
     * Decode single day bitmask to array of active hours
     * 
     * @param dayMask - 32-bit integer representing one day
     * @returns Array of hour indices (0-23) that are available
     */
    static decodeDay(dayMask: number): number[] {
        const activeHours: number[] = [];

        for (let hour = 0; hour < HOURS_PER_DAY; hour++) {
            // ═══════════════════════════════════════════════════════════════════
            // BITWISE CHECK: Is bit at position 'hour' set?
            // (dayMask & (1 << hour)) !== 0 means bit is ON
            // ═══════════════════════════════════════════════════════════════════
            const isActive = dayMask & (1 << hour);
            if (isActive !== 0) {
                activeHours.push(hour);
            }
        }

        return activeHours;
    }

    /**
     * Decode to Uint8Array for Canvas grid rendering
     * 
     * Format: 7 days × 24 hours = 168 cells
     * Each cell is 0 (unavailable) or 1 (available)
     * 
     * Layout: [Sun0, Sun1, ..., Sun23, Mon0, Mon1, ..., Sat23]
     */
    static decodeToGrid(schedule: WeeklySchedule): Uint8Array {
        const grid = new Uint8Array(DAYS_PER_WEEK * HOURS_PER_DAY);

        for (let day = 0; day < DAYS_PER_WEEK; day++) {
            const dayMask = schedule[day];
            for (let hour = 0; hour < HOURS_PER_DAY; hour++) {
                const index = day * HOURS_PER_DAY + hour;
                grid[index] = (dayMask & (1 << hour)) !== 0 ? 1 : 0;
            }
        }

        return grid;
    }

    /**
     * Decode to 2D boolean array for easier iteration
     * 
     * Format: [day][hour] → boolean
     */
    static decodeToMatrix(schedule: WeeklySchedule): boolean[][] {
        const matrix: boolean[][] = [];

        for (let day = 0; day < DAYS_PER_WEEK; day++) {
            const dayMask = schedule[day];
            const dayRow: boolean[] = [];

            for (let hour = 0; hour < HOURS_PER_DAY; hour++) {
                dayRow.push((dayMask & (1 << hour)) !== 0);
            }

            matrix.push(dayRow);
        }

        return matrix;
    }

    /**
     * Decode to human-readable schedule strings
     * Groups consecutive hours into ranges
     * 
     * Example output: ["Sen: 08:00-12:00, 14:00-17:00", "Sel: 09:00-15:00"]
     */
    static decodeToReadable(schedule: WeeklySchedule): string[] {
        const result: string[] = [];

        for (let day = 0; day < DAYS_PER_WEEK; day++) {
            const hours = this.decodeDay(schedule[day]);
            if (hours.length === 0) continue;

            // Group consecutive hours into ranges
            const ranges = this.groupConsecutiveHours(hours);
            const dayLabel = DayLabelShort[day as DayIndex];

            result.push(`${dayLabel}: ${ranges.join(', ')}`);
        }

        return result;
    }

    /**
     * Group consecutive hours into time range strings
     * [8, 9, 10, 14, 15] → ["08:00-11:00", "14:00-16:00"]
     */
    private static groupConsecutiveHours(hours: number[]): string[] {
        if (hours.length === 0) return [];

        const ranges: string[] = [];
        let rangeStart = hours[0] ?? 0;
        let rangeEnd = hours[0] ?? 0;

        for (let i = 1; i <= hours.length; i++) {
            const currentHour = hours[i];
            if (i < hours.length && currentHour === rangeEnd + 1) {
                rangeEnd = currentHour;
            } else {
                // Format: "08:00-11:00" (endHour + 1 because exclusive)
                ranges.push(
                    `${this.formatHour(rangeStart)}-${this.formatHour(rangeEnd + 1)}`
                );
                if (i < hours.length && currentHour !== undefined) {
                    rangeStart = currentHour;
                    rangeEnd = currentHour;
                }
            }
        }

        return ranges;
    }

    /**
     * Format hour as "HH:00"
     */
    private static formatHour(hour: number): string {
        return `${hour.toString().padStart(2, '0')}:00`;
    }

    /**
     * Calculate availability percentage (0-100)
     */
    static getAvailabilityPercentage(schedule: WeeklySchedule): number {
        let totalSet = 0;

        for (let i = 0; i < DAYS_PER_WEEK; i++) {
            totalSet += this.popCount(schedule[i]);
        }

        return (totalSet / (DAYS_PER_WEEK * HOURS_PER_DAY)) * 100;
    }

    /**
     * Brian Kernighan's algorithm for counting set bits
     */
    private static popCount(n: number): number {
        let count = 0;
        let value = n;
        while (value !== 0) {
            value &= (value - 1);
            count++;
        }
        return count;
    }

    /**
     * Check if schedule is completely empty (no availability)
     */
    static isEmpty(schedule: WeeklySchedule): boolean {
        return schedule.every(day => day === 0);
    }

    /**
     * Check if schedule is completely full (24/7 availability)
     */
    static isFull(schedule: WeeklySchedule): boolean {
        return schedule.every(day => day === 0xFFFFFF);
    }

    /**
     * Get day with most available hours
     */
    static getMostAvailableDay(schedule: WeeklySchedule): { dayIndex: DayIndex; hours: number } | null {
        let maxDay: DayIndex = 0;
        let maxHours = 0;

        for (let i = 0; i < DAYS_PER_WEEK; i++) {
            const hours = this.popCount(schedule[i]);
            if (hours > maxHours) {
                maxHours = hours;
                maxDay = i as DayIndex;
            }
        }

        if (maxHours === 0) return null;
        return { dayIndex: maxDay, hours: maxHours };
    }

    /**
     * Decode to Canvas color array
     * Returns array of hex colors for direct Canvas rendering
     * 
     * @param schedule - Weekly schedule
     * @param availableColor - Color for available slots (default: green)
     * @param busyColor - Color for busy slots (default: gray)
     */
    static decodeToColorArray(
        schedule: WeeklySchedule,
        availableColor: number = 0x4ADE80,
        busyColor: number = 0x374151
    ): Uint32Array {
        const colors = new Uint32Array(DAYS_PER_WEEK * HOURS_PER_DAY);

        for (let day = 0; day < DAYS_PER_WEEK; day++) {
            const dayMask = schedule[day];
            for (let hour = 0; hour < HOURS_PER_DAY; hour++) {
                const index = day * HOURS_PER_DAY + hour;
                colors[index] = (dayMask & (1 << hour)) !== 0 ? availableColor : busyColor;
            }
        }

        return colors;
    }
}
