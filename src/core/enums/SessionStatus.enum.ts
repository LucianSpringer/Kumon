/**
 * SessionStatus Enum
 * 
 * Tracks the lifecycle of a tutoring session.
 */

export const SessionStatus = {
    SCHEDULED: 'SCHEDULED',
    TUTOR_CONFIRMED: 'TUTOR_CONFIRMED',
    STUDENT_CONFIRMED: 'STUDENT_CONFIRMED',
    READY: 'READY',
    IN_SESSION: 'IN_SESSION',
    COMPLETED: 'COMPLETED',
    CANCELLED_BY_TUTOR: 'CANCELLED_BY_TUTOR',
    CANCELLED_BY_STUDENT: 'CANCELLED_BY_STUDENT',
    NO_SHOW_TUTOR: 'NO_SHOW_TUTOR',
    NO_SHOW_STUDENT: 'NO_SHOW_STUDENT',
    RESCHEDULED: 'RESCHEDULED',
} as const;

export type SessionStatus = typeof SessionStatus[keyof typeof SessionStatus];

/**
 * Display labels
 */
export const SessionStatusLabel: Record<SessionStatus, string> = {
    [SessionStatus.SCHEDULED]: 'Terjadwal',
    [SessionStatus.TUTOR_CONFIRMED]: 'Dikonfirmasi Tutor',
    [SessionStatus.STUDENT_CONFIRMED]: 'Dikonfirmasi Siswa',
    [SessionStatus.READY]: 'Siap Dimulai',
    [SessionStatus.IN_SESSION]: 'Sedang Berlangsung',
    [SessionStatus.COMPLETED]: 'Selesai',
    [SessionStatus.CANCELLED_BY_TUTOR]: 'Dibatalkan oleh Tutor',
    [SessionStatus.CANCELLED_BY_STUDENT]: 'Dibatalkan oleh Siswa',
    [SessionStatus.NO_SHOW_TUTOR]: 'Tutor Tidak Hadir',
    [SessionStatus.NO_SHOW_STUDENT]: 'Siswa Tidak Hadir',
    [SessionStatus.RESCHEDULED]: 'Dijadwalkan Ulang',
};

/**
 * Status colors for UI
 */
export const SessionStatusColor: Record<SessionStatus, string> = {
    [SessionStatus.SCHEDULED]: '#FBBF24',      // Yellow
    [SessionStatus.TUTOR_CONFIRMED]: '#60A5FA', // Blue
    [SessionStatus.STUDENT_CONFIRMED]: '#60A5FA',
    [SessionStatus.READY]: '#34D399',           // Green
    [SessionStatus.IN_SESSION]: '#00D4FF',      // Cyan
    [SessionStatus.COMPLETED]: '#4ADE80',       // Green
    [SessionStatus.CANCELLED_BY_TUTOR]: '#EF4444',  // Red
    [SessionStatus.CANCELLED_BY_STUDENT]: '#EF4444',
    [SessionStatus.NO_SHOW_TUTOR]: '#F97316',   // Orange
    [SessionStatus.NO_SHOW_STUDENT]: '#F97316',
    [SessionStatus.RESCHEDULED]: '#A78BFA',     // Purple
};

/**
 * Check if session is cancelable
 */
export const isCancelable = (status: SessionStatus): boolean => {
    return (
        status === SessionStatus.SCHEDULED ||
        status === SessionStatus.TUTOR_CONFIRMED ||
        status === SessionStatus.STUDENT_CONFIRMED ||
        status === SessionStatus.READY
    );
};

/**
 * Check if session is complete (terminal state)
 */
export const isTerminated = (status: SessionStatus): boolean => {
    return (
        status === SessionStatus.COMPLETED ||
        status === SessionStatus.CANCELLED_BY_TUTOR ||
        status === SessionStatus.CANCELLED_BY_STUDENT ||
        status === SessionStatus.NO_SHOW_TUTOR ||
        status === SessionStatus.NO_SHOW_STUDENT
    );
};

/**
 * Type guard
 */
export const isSessionStatus = (value: unknown): value is SessionStatus => {
    return typeof value === 'string' && Object.values(SessionStatus).includes(value as SessionStatus);
};
