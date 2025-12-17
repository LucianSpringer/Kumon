/**
 * TeachingMode Enum
 * 
 * Strict numeric enum for teaching modalities.
 * No magic strings - all values are compile-time constants.
 */

export const TeachingMode = {
    ONLINE_VIDEO: 0,
    ONLINE_CHAT: 1,
    OFFLINE_HOME_STUDENT: 2,
    OFFLINE_HOME_TUTOR: 3,
    OFFLINE_PUBLIC_PLACE: 4,
    HYBRID: 5,
} as const;

export type TeachingMode = typeof TeachingMode[keyof typeof TeachingMode];

/**
 * Display labels (Indonesian)
 */
export const TeachingModeLabel: Record<TeachingMode, string> = {
    [TeachingMode.ONLINE_VIDEO]: 'Video Call',
    [TeachingMode.ONLINE_CHAT]: 'Chat Only',
    [TeachingMode.OFFLINE_HOME_STUDENT]: 'Di Rumah Siswa',
    [TeachingMode.OFFLINE_HOME_TUTOR]: 'Di Rumah Tutor',
    [TeachingMode.OFFLINE_PUBLIC_PLACE]: 'Tempat Umum',
    [TeachingMode.HYBRID]: 'Fleksibel',
};

/**
 * Icons for UI (using emoji as placeholder)
 */
export const TeachingModeIcon: Record<TeachingMode, string> = {
    [TeachingMode.ONLINE_VIDEO]: '📹',
    [TeachingMode.ONLINE_CHAT]: '💬',
    [TeachingMode.OFFLINE_HOME_STUDENT]: '🏠',
    [TeachingMode.OFFLINE_HOME_TUTOR]: '🏡',
    [TeachingMode.OFFLINE_PUBLIC_PLACE]: '☕',
    [TeachingMode.HYBRID]: '🔄',
};

/**
 * Type guard
 */
export const isTeachingMode = (value: unknown): value is TeachingMode => {
    return typeof value === 'number' && value >= 0 && value <= 5;
};

/**
 * Get all teaching modes as array
 */
export const getAllTeachingModes = (): TeachingMode[] => [
    TeachingMode.ONLINE_VIDEO,
    TeachingMode.ONLINE_CHAT,
    TeachingMode.OFFLINE_HOME_STUDENT,
    TeachingMode.OFFLINE_HOME_TUTOR,
    TeachingMode.OFFLINE_PUBLIC_PLACE,
    TeachingMode.HYBRID,
];
