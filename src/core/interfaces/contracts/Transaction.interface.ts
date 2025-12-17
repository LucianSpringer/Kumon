/**
 * Transaction Contract Interface
 */

import { TransactionId, TutorId, StudentId, Price, Timestamp } from '../../../@types/branded.types';
import { WrappableEntity } from '../wrappers/GenericWrapper.interface';
import { WeeklySchedule } from '../../bitwise/types';
import { TransactionState } from '../../enums/TransactionState.enum';
import { TeachingMode } from '../../enums/TeachingMode.enum';
import { PaymentMethod } from '../../enums/PaymentMethod.enum';
import { SubjectCategory } from '../../enums/SubjectCategory.enum';

export interface TransactionContract extends WrappableEntity {
    readonly id: TransactionId;
    readonly tutorId: TutorId;
    readonly studentId: StudentId;

    // Schedule - Result of bitwise collision
    readonly agreedSlots: WeeklySchedule;
    readonly totalHours: number;

    // Subject & Mode
    readonly subject: SubjectCategory;
    readonly sessionMode: TeachingMode;

    // Pricing
    readonly pricePerHour: Price;
    readonly totalPrice: Price;
    readonly platformFee: Price;
    readonly tutorPayout: Price;

    // Payment
    readonly paymentMethod: PaymentMethod | null;
    readonly paidAt: Timestamp | null;

    // State
    readonly state: TransactionState;

    // Timestamps
    readonly createdAt: Timestamp;
    readonly expiresAt: Timestamp;
}
