/**
 * AvailabilityMatcher - Titan Speed Collision Detection
 * 
 * Uses bitwise AND for O(1) matching per tutor.
 * 
 * Performance: 1,000 tutors × 7 days = 7,000 bitwise ops (~microseconds)
 * 
 * Logic:
 *   TutorAvailability & StudentRequest
 *   - 1 & 1 = 1 (MATCH! Both available)
 *   - 1 & 0 = 0 (Tutor available, student not)
 *   - 0 & 1 = 0 (Student wants, tutor busy)
 *   - 0 & 0 = 0 (Both unavailable)
 */

import { WeeklySchedule, MutableWeeklySchedule, DAYS_PER_WEEK } from './types';

export interface MatchResult {
    readonly matched: boolean;
    readonly collisionSchedule: WeeklySchedule;
    readonly matchCount: number;
    readonly matchedDays: readonly number[];
}

export interface BatchMatchResult {
    readonly tutorIndex: number;
    readonly matchResult: MatchResult;
}

export class AvailabilityMatcher {

    /**
     * Quick collision check - does ANY slot overlap?
     * Returns immediately on first match (early exit optimization)
     * 
     * @param tutorSchedule - Tutor's availability bitmask
     * @param studentRequest - Student's requested times bitmask
     * @returns true if at least one overlapping slot exists
     */
    static hasCollision(
        tutorSchedule: WeeklySchedule,
        studentRequest: WeeklySchedule
    ): boolean {
        for (let i = 0; i < DAYS_PER_WEEK; i++) {
            // ═══════════════════════════════════════════════════════════════════
            // CORE OPERATION: Bitwise AND (&)
            // Only bits that are 1 in BOTH operands survive
            // ═══════════════════════════════════════════════════════════════════
            if ((tutorSchedule[i] & studentRequest[i]) !== 0) {
                return true;  // Early exit on first collision
            }
        }
        return false;
    }

    /**
     * Detailed match analysis with collision schedule
     * 
     * @returns Full match result including which slots overlap
     */
    static findMatchingSlots(
        tutorSchedule: WeeklySchedule,
        studentRequest: WeeklySchedule
    ): MatchResult {
        const collisionSchedule: MutableWeeklySchedule = [0, 0, 0, 0, 0, 0, 0];
        const matchedDays: number[] = [];
        let matchCount = 0;

        for (let i = 0; i < DAYS_PER_WEEK; i++) {
            const tutorBits = tutorSchedule[i];
            const studentBits = studentRequest[i];

            // Bitwise AND - find common availability
            const commonBits = tutorBits & studentBits;

            if (commonBits > 0) {
                collisionSchedule[i] = commonBits;
                matchedDays.push(i);
                matchCount += this.popCount(commonBits);
            }
        }

        return {
            matched: matchCount > 0,
            collisionSchedule: collisionSchedule as WeeklySchedule,
            matchCount,
            matchedDays,
        };
    }

    /**
     * Batch filter: Find all tutors matching student request
     * Returns indices of tutors with available slots
     * 
     * @param tutorSchedules - Array of tutor availability schedules
     * @param studentRequest - Student's requested times
     * @returns Array of matching tutor indices
     */
    static batchFilter(
        tutorSchedules: readonly WeeklySchedule[],
        studentRequest: WeeklySchedule
    ): number[] {
        const matchingIndices: number[] = [];

        for (let i = 0; i < tutorSchedules.length; i++) {
            const schedule = tutorSchedules[i];
            if (schedule && this.hasCollision(schedule, studentRequest)) {
                matchingIndices.push(i);
            }
        }

        return matchingIndices;
    }

    /**
     * Batch filter with detailed results
     * Returns full match details for each matching tutor
     */
    static batchFilterDetailed(
        tutorSchedules: readonly WeeklySchedule[],
        studentRequest: WeeklySchedule
    ): BatchMatchResult[] {
        const results: BatchMatchResult[] = [];

        for (let i = 0; i < tutorSchedules.length; i++) {
            const schedule = tutorSchedules[i];
            if (schedule) {
                const matchResult = this.findMatchingSlots(schedule, studentRequest);
                if (matchResult.matched) {
                    results.push({ tutorIndex: i, matchResult });
                }
            }
        }

        // Sort by match count (most overlapping hours first)
        return results.sort((a, b) => b.matchResult.matchCount - a.matchResult.matchCount);
    }

    /**
     * Count set bits (available hours) - Brian Kernighan's Algorithm
     * 
     * Time Complexity: O(number of set bits)
     * Each iteration clears the lowest set bit
     */
    private static popCount(n: number): number {
        let count = 0;
        let value = n;
        while (value !== 0) {
            value &= (value - 1);  // Clear lowest set bit
            count++;
        }
        return count;
    }

    /**
     * Count total available hours in a week
     */
    static countTotalHours(schedule: WeeklySchedule): number {
        let total = 0;
        for (let i = 0; i < DAYS_PER_WEEK; i++) {
            total += this.popCount(schedule[i]);
        }
        return total;
    }

    /**
     * Calculate match percentage
     * (overlapping hours / student requested hours) × 100
     */
    static calculateMatchPercentage(
        tutorSchedule: WeeklySchedule,
        studentRequest: WeeklySchedule
    ): number {
        const matchResult = this.findMatchingSlots(tutorSchedule, studentRequest);
        const requestedHours = this.countTotalHours(studentRequest);

        if (requestedHours === 0) return 0;
        return (matchResult.matchCount / requestedHours) * 100;
    }

    /**
     * Merge two schedules using bitwise OR
     * Useful for combining multiple tutor availabilities
     */
    static mergeSchedules(
        schedule1: WeeklySchedule,
        schedule2: WeeklySchedule
    ): WeeklySchedule {
        return [
            schedule1[0] | schedule2[0],
            schedule1[1] | schedule2[1],
            schedule1[2] | schedule2[2],
            schedule1[3] | schedule2[3],
            schedule1[4] | schedule2[4],
            schedule1[5] | schedule2[5],
            schedule1[6] | schedule2[6],
        ] as WeeklySchedule;
    }

    /**
     * Invert schedule (toggle all bits)
     * Available becomes busy, busy becomes available
     */
    static invertSchedule(schedule: WeeklySchedule): WeeklySchedule {
        return [
            (~schedule[0]) & 0xFFFFFF,
            (~schedule[1]) & 0xFFFFFF,
            (~schedule[2]) & 0xFFFFFF,
            (~schedule[3]) & 0xFFFFFF,
            (~schedule[4]) & 0xFFFFFF,
            (~schedule[5]) & 0xFFFFFF,
            (~schedule[6]) & 0xFFFFFF,
        ] as WeeklySchedule;
    }
}
