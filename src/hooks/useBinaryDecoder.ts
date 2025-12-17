/**
 * useBinaryDecoder - Bitmask to Visual Transformation Hook
 * 
 * Transforms compressed backend tuples into Canvas-ready visuals.
 * NO intermediate JSON storage - direct tuple → visual mapping.
 */

import { useCallback, useRef } from 'react';
import { WeeklySchedule, DAYS_PER_WEEK, HOURS_PER_DAY } from '../core/bitwise/types';
import { SubjectCategoryColor, SubjectCategory } from '../core/enums/SubjectCategory.enum';

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

/**
 * Backend transmission tuple format
 * [id, xSeed, availability_json, subjectId, rating*100, price_cents]
 */
export type TutorTuple = readonly [
    id: string,
    xSeed: number,
    availabilityJson: string,
    subjectId: number,
    ratingCents: number,
    priceCents: number
];

/**
 * Visual representation for Canvas rendering
 */
export interface VisualNode {
    readonly id: string;
    readonly xSeed: number;
    readonly color: number;
    readonly opacity: number;
    readonly mass: number;
    readonly pulseRate: number;
}

// ════════════════════════════════════════════════════════════════════════════
// Hook Implementation
// ════════════════════════════════════════════════════════════════════════════

export function useBinaryDecoder() {
    // Cache to avoid redundant decoding
    const cacheRef = useRef<Map<string, VisualNode>>(new Map());

    /**
     * Get color for subject category
     */
    const subjectToColor = useCallback((subjectId: number): number => {
        return SubjectCategoryColor[subjectId as SubjectCategory] ?? 0x888888;
    }, []);

    /**
     * Count set bits (available hours) - Brian Kernighan's Algorithm
     */
    const countAvailableHours = useCallback((schedule: WeeklySchedule): number => {
        let count = 0;
        for (let i = 0; i < DAYS_PER_WEEK; i++) {
            let value = schedule[i];
            while (value !== 0) {
                value &= (value - 1);
                count++;
            }
        }
        return count;
    }, []);

    /**
     * Decode single tuple to visual node
     */
    const decodeTuple = useCallback((tuple: TutorTuple): VisualNode => {
        const [id, xSeed, availabilityJson, subjectId, ratingCents, _priceCents] = tuple;

        // Check cache first
        const cached = cacheRef.current.get(id);
        if (cached) return cached;

        // Parse availability and count hours
        const schedule = JSON.parse(availabilityJson) as WeeklySchedule;
        const availableHours = countAvailableHours(schedule);
        const rating = ratingCents / 100;

        const node: VisualNode = {
            id,
            xSeed,
            color: subjectToColor(subjectId),
            opacity: Math.min(1, availableHours / 40), // Max 40 hours = fully opaque
            mass: 1 + rating, // 1.0 - 6.0 mass range
            pulseRate: 0.5 + (5 - rating) * 0.1, // Higher rating = slower pulse
        };

        cacheRef.current.set(id, node);
        return node;
    }, [subjectToColor, countAvailableHours]);

    /**
     * Batch decode tuples for initial load
     */
    const decodeBatch = useCallback((tuples: readonly TutorTuple[]): VisualNode[] => {
        return tuples.map(decodeTuple);
    }, [decodeTuple]);

    /**
     * Decode availability bitmask to visual grid (Uint8Array)
     * 7×24 = 168 cells, each 0 or 1
     */
    const decodeAvailabilityToGrid = useCallback((schedule: WeeklySchedule): Uint8Array => {
        const grid = new Uint8Array(DAYS_PER_WEEK * HOURS_PER_DAY);

        for (let day = 0; day < DAYS_PER_WEEK; day++) {
            const dayMask = schedule[day];
            for (let hour = 0; hour < HOURS_PER_DAY; hour++) {
                const index = day * HOURS_PER_DAY + hour;
                grid[index] = (dayMask & (1 << hour)) !== 0 ? 1 : 0;
            }
        }

        return grid;
    }, []);

    /**
     * Decode to human-readable schedule (for overlay display)
     * Only called on hover/selection - not in hot path
     */
    const decodeToReadableSchedule = useCallback((schedule: WeeklySchedule): string[] => {
        const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const result: string[] = [];

        for (let day = 0; day < DAYS_PER_WEEK; day++) {
            const dayMask = schedule[day];
            if (dayMask === 0) continue;

            const ranges: string[] = [];
            let rangeStart: number | null = null;

            for (let hour = 0; hour <= HOURS_PER_DAY; hour++) {
                const isSet = hour < HOURS_PER_DAY && (dayMask & (1 << hour)) !== 0;

                if (isSet && rangeStart === null) {
                    rangeStart = hour;
                } else if (!isSet && rangeStart !== null) {
                    ranges.push(`${rangeStart.toString().padStart(2, '0')}:00-${hour.toString().padStart(2, '0')}:00`);
                    rangeStart = null;
                }
            }

            if (ranges.length > 0) {
                result.push(`${dayLabels[day]}: ${ranges.join(', ')}`);
            }
        }

        return result;
    }, []);

    /**
     * Clear cache (call on data refresh)
     */
    const clearCache = useCallback(() => {
        cacheRef.current.clear();
    }, []);

    /**
     * Get cache size for debugging
     */
    const getCacheSize = useCallback(() => {
        return cacheRef.current.size;
    }, []);

    return {
        decodeTuple,
        decodeBatch,
        decodeAvailabilityToGrid,
        decodeToReadableSchedule,
        clearCache,
        getCacheSize,
    };
}
