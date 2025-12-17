/**
 * Tutor Entity Interface
 * 
 * Defines the complete structure for a tutor profile.
 * Uses branded types and bitwise schedule.
 */

import { TutorId, Price, Rating, GeoHash } from '../../../@types/branded.types';
import { WrappableEntity } from '../wrappers/GenericWrapper.interface';
import { WeeklySchedule } from '../../bitwise/types';
import { TeachingMode } from '../../enums/TeachingMode.enum';
import { SubjectCategory } from '../../enums/SubjectCategory.enum';

// ════════════════════════════════════════════════════════════════════════════
// Sub-Interfaces
// ════════════════════════════════════════════════════════════════════════════

export interface TutorCredentials {
    readonly degreeLevel: 'S1' | 'S2' | 'S3' | 'D3' | 'SMA';
    readonly institution: string;
    readonly graduationYear: number;
    readonly certifications: readonly string[];
    readonly isVerified: boolean;
}

export interface TutorPricing {
    readonly baseRate: Price;           // IDR per hour
    readonly groupDiscount: number;     // 0-100 percentage
    readonly travelSurcharge: Price;    // Additional cost for travel
    readonly minimumHours: number;      // Minimum booking duration
}

export interface TutorStats {
    readonly totalSessions: number;
    readonly totalStudents: number;
    readonly totalHours: number;
    readonly completionRate: number;    // 0-100 percentage
    readonly responseTime: number;      // Average minutes to respond
}

// ════════════════════════════════════════════════════════════════════════════
// Main Entity
// ════════════════════════════════════════════════════════════════════════════

export interface TutorEntity extends WrappableEntity {
    readonly id: TutorId;
    readonly fullName: string;
    readonly email: string;
    readonly phone: string;
    readonly avatarUrl: string | null;
    readonly bio: string;

    // Availability - BITWISE SCHEDULE
    readonly availability: WeeklySchedule;

    // Teaching info
    readonly subjects: readonly SubjectCategory[];
    readonly teachingModes: readonly TeachingMode[];
    readonly maxConcurrentStudents: number;

    // Credentials & Pricing
    readonly credentials: TutorCredentials;
    readonly pricing: TutorPricing;

    // Ratings & Stats
    readonly rating: Rating;
    readonly stats: TutorStats;

    // Location
    readonly geoHash: GeoHash;
    readonly city: string;
    readonly district: string;

    // Status
    readonly isActive: boolean;
    readonly isVerified: boolean;
    readonly isPremium: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// Transmission Tuple (Ultra-Compressed for Network)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Compressed tuple for transmission
 * [id, xSeed, availability[], subjectId, rating*100, price]
 */
export type TutorTransmissionTuple = readonly [
    id: string,              // [0] Tutor ID
    xSeed: number,           // [1] X coordinate seed for physics
    availability: string,    // [2] JSON stringified WeeklySchedule
    subjectId: number,       // [3] Primary subject enum ID
    ratingCents: number,     // [4] Rating × 100 as integer
    priceCents: number,      // [5] Base rate in cents
];

/**
 * Convert TutorEntity to transmission tuple
 */
export function toTransmissionTuple(
    tutor: TutorEntity,
    xSeed: number
): TutorTransmissionTuple {
    return [
        tutor.id,
        xSeed,
        JSON.stringify(tutor.availability),
        tutor.subjects[0] ?? 100,
        Math.round((tutor.rating as number) * 100),
        tutor.pricing.baseRate as number,
    ];
}

/**
 * Parse transmission tuple (partial data)
 */
export function fromTransmissionTuple(tuple: TutorTransmissionTuple): {
    id: string;
    xSeed: number;
    availability: WeeklySchedule;
    subjectId: number;
    rating: number;
    price: number;
} {
    return {
        id: tuple[0],
        xSeed: tuple[1],
        availability: JSON.parse(tuple[2]) as WeeklySchedule,
        subjectId: tuple[3],
        rating: tuple[4] / 100,
        price: tuple[5],
    };
}
