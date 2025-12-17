/**
 * Session Entity Interface
 */

import { SessionId, TutorId, StudentId, Price, Timestamp } from '../../../@types/branded.types';
import { WrappableEntity } from '../wrappers/GenericWrapper.interface';
import { SessionStatus } from '../../enums/SessionStatus.enum';
import { SubjectCategory } from '../../enums/SubjectCategory.enum';
import { TeachingMode } from '../../enums/TeachingMode.enum';

export interface SessionLocation {
    readonly mode: TeachingMode;
    readonly address: string | null;
    readonly geoHash: string | null;
    readonly meetingUrl: string | null;
}

export interface SessionEntity extends WrappableEntity {
    readonly id: SessionId;
    readonly tutorId: TutorId;
    readonly studentId: StudentId;

    // Scheduling
    readonly subject: SubjectCategory;
    readonly scheduledAt: Timestamp;
    readonly durationMinutes: number;

    // Location
    readonly location: SessionLocation;

    // Status
    readonly status: SessionStatus;

    // Pricing
    readonly agreedPrice: Price;
    readonly isPaid: boolean;

    // Notes
    readonly tutorNotes: string;
    readonly studentNotes: string;

    // Timestamps
    readonly startedAt: Timestamp | null;
    readonly completedAt: Timestamp | null;
}
