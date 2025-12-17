/**
 * TimeSlotEncoder - Bitwise Chronology Engine
 * 
 * Transforms human-readable time ranges into binary bitmasks.
 * Uses bitwise OR to accumulate availability.
 * 
 * Example:
 *   "Senin 08:00 - 10:00" → Bit 8 and Bit 9 set to 1
 *   Mask = 2^8 + 2^9 = 256 + 512 = 768
 */

import {
    WeeklySchedule,
    MutableWeeklySchedule,
    TimeRange,
    DayIndex
} from './types';

export class TimeSlotEncoder {
    private schedule: MutableWeeklySchedule = [0, 0, 0, 0, 0, 0, 0];

    /**
     * Encode a single time range into the schedule
     * Uses bitwise OR to accumulate availability
     * 
     * @param dayIndex - Day of week (0=Sunday, 6=Saturday)
     * @param startHour - Start hour (0-23)
     * @param endHour - End hour exclusive (1-24)
     */
    encodeRange(dayIndex: DayIndex, startHour: number, endHour: number): this {
        if (startHour < 0 || endHour > 24 || startHour >= endHour) {
            throw new RangeError(`Invalid time range: ${startHour}-${endHour}`);
        }

        let dailyMask = 0;

        // ═══════════════════════════════════════════════════════════════════
        // BITWISE ENCODING LOGIC
        // Shift "1" left by hour position, accumulate with OR
        // ═══════════════════════════════════════════════════════════════════
        for (let hour = startHour; hour < endHour; hour++) {
            const positionMask = 1 << hour;  // 2^hour
            dailyMask = dailyMask | positionMask;
        }

        // Merge with existing day schedule using OR
        this.schedule[dayIndex] = this.schedule[dayIndex] | dailyMask;
        return this;
    }

    /**
     * Batch encode multiple time ranges
     */
    encodeRanges(ranges: readonly TimeRange[]): this {
        for (const range of ranges) {
            this.encodeRange(range.dayIndex, range.startHour, range.endHour);
        }
        return this;
    }

    /**
     * Set a single hour slot as available
     */
    setSlot(dayIndex: DayIndex, hour: number): this {
        if (hour < 0 || hour > 23) {
            throw new RangeError(`Invalid hour: ${hour}`);
        }
        this.schedule[dayIndex] = this.schedule[dayIndex] | (1 << hour);
        return this;
    }

    /**
     * Clear a specific slot (set to unavailable)
     * Uses bitwise AND with inverted mask
     */
    clearSlot(dayIndex: DayIndex, hour: number): this {
        if (hour < 0 || hour > 23) {
            throw new RangeError(`Invalid hour: ${hour}`);
        }
        const inverseMask = ~(1 << hour);
        this.schedule[dayIndex] = this.schedule[dayIndex] & inverseMask;
        return this;
    }

    /**
     * Clear an entire day
     */
    clearDay(dayIndex: DayIndex): this {
        this.schedule[dayIndex] = 0;
        return this;
    }

    /**
     * Set entire day as available (all 24 hours)
     */
    setFullDay(dayIndex: DayIndex): this {
        this.schedule[dayIndex] = 0xFFFFFF; // 24 bits all 1
        return this;
    }

    /**
     * Get the encoded schedule (immutable copy)
     */
    getSchedule(): WeeklySchedule {
        return [...this.schedule] as WeeklySchedule;
    }

    /**
     * Reset encoder to empty schedule
     */
    reset(): this {
        this.schedule = [0, 0, 0, 0, 0, 0, 0];
        return this;
    }

    /**
     * Check if a specific slot is available
     */
    isSlotAvailable(dayIndex: DayIndex, hour: number): boolean {
        return (this.schedule[dayIndex] & (1 << hour)) !== 0;
    }

    /**
     * Static factory: Create schedule from time ranges
     */
    static fromRanges(ranges: readonly TimeRange[]): WeeklySchedule {
        return new TimeSlotEncoder().encodeRanges(ranges).getSchedule();
    }

    /**
     * Static factory: Create from existing schedule (for modifications)
     */
    static from(schedule: WeeklySchedule): TimeSlotEncoder {
        const encoder = new TimeSlotEncoder();
        encoder.schedule = [...schedule] as MutableWeeklySchedule;
        return encoder;
    }

    /**
     * Parse human-readable input string
     * Format: "Senin 08:00 - 10:00" or "Monday 08:00 - 10:00"
     */
    static parseHumanInput(input: string): TimeRange {
        const dayMap: Record<string, DayIndex> = {
            'minggu': DayIndex.SUNDAY, 'sunday': DayIndex.SUNDAY, 'sun': DayIndex.SUNDAY,
            'senin': DayIndex.MONDAY, 'monday': DayIndex.MONDAY, 'mon': DayIndex.MONDAY,
            'selasa': DayIndex.TUESDAY, 'tuesday': DayIndex.TUESDAY, 'tue': DayIndex.TUESDAY,
            'rabu': DayIndex.WEDNESDAY, 'wednesday': DayIndex.WEDNESDAY, 'wed': DayIndex.WEDNESDAY,
            'kamis': DayIndex.THURSDAY, 'thursday': DayIndex.THURSDAY, 'thu': DayIndex.THURSDAY,
            'jumat': DayIndex.FRIDAY, 'friday': DayIndex.FRIDAY, 'fri': DayIndex.FRIDAY,
            'sabtu': DayIndex.SATURDAY, 'saturday': DayIndex.SATURDAY, 'sat': DayIndex.SATURDAY,
        };

        const match = input.toLowerCase().match(/(\w+)\s+(\d{1,2}):00\s*-\s*(\d{1,2}):00/);
        if (!match) {
            throw new Error(`Invalid format: "${input}". Expected: "Senin 08:00 - 10:00"`);
        }

        const [, day, start, end] = match;
        const dayIndex = day ? dayMap[day] : undefined;

        if (dayIndex === undefined) {
            throw new Error(`Unknown day: "${day}"`);
        }

        return {
            dayIndex,
            startHour: parseInt(start ?? '0', 10),
            endHour: parseInt(end ?? '0', 10),
        };
    }

    /**
     * Parse multiple lines of human input
     */
    static parseMultipleInputs(inputs: readonly string[]): TimeRange[] {
        return inputs.map(input => TimeSlotEncoder.parseHumanInput(input));
    }
}
