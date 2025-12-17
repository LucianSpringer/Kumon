/**
 * Student Entity Interface
 */

import { StudentId, GeoHash } from '../../../@types/branded.types';
import { WrappableEntity } from '../wrappers/GenericWrapper.interface';
import { WeeklySchedule } from '../../bitwise/types';
import { SubjectCategory } from '../../enums/SubjectCategory.enum';
import { TeachingMode } from '../../enums/TeachingMode.enum';

export interface StudentPreferences {
    readonly preferredSubjects: readonly SubjectCategory[];
    readonly preferredModes: readonly TeachingMode[];
    readonly maxBudget: number;
    readonly preferredGender: 'male' | 'female' | 'any';
    readonly maxDistance: number;  // kilometers
}

export interface StudentEntity extends WrappableEntity {
    readonly id: StudentId;
    readonly fullName: string;
    readonly email: string;
    readonly phone: string;
    readonly avatarUrl: string | null;

    // Education
    readonly gradeLevel: string;
    readonly school: string;

    // Schedule request - BITWISE
    readonly requestedSlots: WeeklySchedule;

    // Preferences
    readonly preferences: StudentPreferences;

    // Location
    readonly geoHash: GeoHash;
    readonly city: string;
    readonly district: string;

    // Parent/Guardian
    readonly parentName: string;
    readonly parentPhone: string;
    readonly parentEmail: string;

    // Status
    readonly isActive: boolean;
}
