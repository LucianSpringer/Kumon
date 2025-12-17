/**
 * SubjectCategory Enum
 * 
 * Hierarchical subject categories with numeric IDs.
 * ID ranges indicate category groups (100s = Primary, 200s = Secondary, etc.)
 */

export const SubjectCategory = {
    // ═══════════════════════════════════════════════════════════════════
    // Primary School (100-199)
    // ═══════════════════════════════════════════════════════════════════
    MATH_PRIMARY: 100,
    INDONESIAN_PRIMARY: 101,
    ENGLISH_PRIMARY: 102,
    SCIENCE_PRIMARY: 103,
    SOCIAL_PRIMARY: 104,

    // ═══════════════════════════════════════════════════════════════════
    // Secondary - Sciences (200-209)
    // ═══════════════════════════════════════════════════════════════════
    MATH_SECONDARY: 200,
    PHYSICS: 201,
    CHEMISTRY: 202,
    BIOLOGY: 203,
    COMPUTER_SCIENCE: 204,

    // ═══════════════════════════════════════════════════════════════════
    // Secondary - Languages (210-219)
    // ═══════════════════════════════════════════════════════════════════
    INDONESIAN_SECONDARY: 210,
    ENGLISH_SECONDARY: 211,
    JAPANESE: 212,
    MANDARIN: 213,
    KOREAN: 214,
    GERMAN: 215,
    FRENCH: 216,
    ARABIC: 217,

    // ═══════════════════════════════════════════════════════════════════
    // Secondary - Social (220-229)
    // ═══════════════════════════════════════════════════════════════════
    HISTORY: 220,
    GEOGRAPHY: 221,
    ECONOMICS: 222,
    SOCIOLOGY: 223,
    ACCOUNTING: 224,

    // ═══════════════════════════════════════════════════════════════════
    // Exam Prep (300-399)
    // ═══════════════════════════════════════════════════════════════════
    UTBK_SAINTEK: 300,
    UTBK_SOSHUM: 301,
    SBMPTN: 302,
    SIMAK_UI: 303,
    TOEFL: 310,
    IELTS: 311,
    TOEIC: 312,
    JLPT: 320,
    HSK: 321,

    // ═══════════════════════════════════════════════════════════════════
    // Skills (400-499)
    // ═══════════════════════════════════════════════════════════════════
    PROGRAMMING: 400,
    WEB_DEVELOPMENT: 401,
    MOBILE_DEVELOPMENT: 402,
    DATA_SCIENCE: 403,
    DESIGN_GRAPHIC: 410,
    DESIGN_UI_UX: 411,
    MUSIC_PIANO: 420,
    MUSIC_GUITAR: 421,
    MUSIC_VOCAL: 422,
} as const;

export type SubjectCategory = typeof SubjectCategory[keyof typeof SubjectCategory];

/**
 * Display labels (Indonesian)
 */
export const SubjectCategoryLabel: Partial<Record<SubjectCategory, string>> = {
    [SubjectCategory.MATH_PRIMARY]: 'Matematika SD',
    [SubjectCategory.MATH_SECONDARY]: 'Matematika SMP/SMA',
    [SubjectCategory.PHYSICS]: 'Fisika',
    [SubjectCategory.CHEMISTRY]: 'Kimia',
    [SubjectCategory.BIOLOGY]: 'Biologi',
    [SubjectCategory.ENGLISH_SECONDARY]: 'Bahasa Inggris',
    [SubjectCategory.PROGRAMMING]: 'Pemrograman',
    [SubjectCategory.UTBK_SAINTEK]: 'UTBK Saintek',
    [SubjectCategory.TOEFL]: 'TOEFL',
    [SubjectCategory.IELTS]: 'IELTS',
};

/**
 * Color mapping for Canvas visualization (Constellation HUD)
 */
export const SubjectCategoryColor: Record<SubjectCategory, number> = {
    // Primary - Soft Blue
    [SubjectCategory.MATH_PRIMARY]: 0x60A5FA,
    [SubjectCategory.INDONESIAN_PRIMARY]: 0x60A5FA,
    [SubjectCategory.ENGLISH_PRIMARY]: 0x60A5FA,
    [SubjectCategory.SCIENCE_PRIMARY]: 0x60A5FA,
    [SubjectCategory.SOCIAL_PRIMARY]: 0x60A5FA,

    // Sciences - Neon Cyan
    [SubjectCategory.MATH_SECONDARY]: 0x00D4FF,
    [SubjectCategory.PHYSICS]: 0x00D4FF,
    [SubjectCategory.CHEMISTRY]: 0x00D4FF,
    [SubjectCategory.BIOLOGY]: 0x00D4FF,
    [SubjectCategory.COMPUTER_SCIENCE]: 0x00D4FF,

    // Languages - Neon Amber
    [SubjectCategory.INDONESIAN_SECONDARY]: 0xFFB800,
    [SubjectCategory.ENGLISH_SECONDARY]: 0xFFB800,
    [SubjectCategory.JAPANESE]: 0xFFB800,
    [SubjectCategory.MANDARIN]: 0xFFB800,
    [SubjectCategory.KOREAN]: 0xFFB800,
    [SubjectCategory.GERMAN]: 0xFFB800,
    [SubjectCategory.FRENCH]: 0xFFB800,
    [SubjectCategory.ARABIC]: 0xFFB800,

    // Social - Neon Green
    [SubjectCategory.HISTORY]: 0x00FF88,
    [SubjectCategory.GEOGRAPHY]: 0x00FF88,
    [SubjectCategory.ECONOMICS]: 0x00FF88,
    [SubjectCategory.SOCIOLOGY]: 0x00FF88,
    [SubjectCategory.ACCOUNTING]: 0x00FF88,

    // Exam Prep - Neon Green
    [SubjectCategory.UTBK_SAINTEK]: 0x00FF88,
    [SubjectCategory.UTBK_SOSHUM]: 0x00FF88,
    [SubjectCategory.SBMPTN]: 0x00FF88,
    [SubjectCategory.SIMAK_UI]: 0x00FF88,
    [SubjectCategory.TOEFL]: 0x00FF88,
    [SubjectCategory.IELTS]: 0x00FF88,
    [SubjectCategory.TOEIC]: 0x00FF88,
    [SubjectCategory.JLPT]: 0x00FF88,
    [SubjectCategory.HSK]: 0x00FF88,

    // Skills - Neon Purple
    [SubjectCategory.PROGRAMMING]: 0x8B5CF6,
    [SubjectCategory.WEB_DEVELOPMENT]: 0x8B5CF6,
    [SubjectCategory.MOBILE_DEVELOPMENT]: 0x8B5CF6,
    [SubjectCategory.DATA_SCIENCE]: 0x8B5CF6,
    [SubjectCategory.DESIGN_GRAPHIC]: 0xFF00FF,
    [SubjectCategory.DESIGN_UI_UX]: 0xFF00FF,
    [SubjectCategory.MUSIC_PIANO]: 0xFF00FF,
    [SubjectCategory.MUSIC_GUITAR]: 0xFF00FF,
    [SubjectCategory.MUSIC_VOCAL]: 0xFF00FF,
};

/**
 * Get category group from subject ID
 */
export const getSubjectGroup = (subject: SubjectCategory): 'primary' | 'science' | 'language' | 'social' | 'exam' | 'skill' => {
    if (subject >= 100 && subject < 200) return 'primary';
    if (subject >= 200 && subject < 210) return 'science';
    if (subject >= 210 && subject < 220) return 'language';
    if (subject >= 220 && subject < 300) return 'social';
    if (subject >= 300 && subject < 400) return 'exam';
    return 'skill';
};

/**
 * Type guard
 */
export const isSubjectCategory = (value: unknown): value is SubjectCategory => {
    return typeof value === 'number' && (
        (value >= 100 && value < 500)
    );
};
