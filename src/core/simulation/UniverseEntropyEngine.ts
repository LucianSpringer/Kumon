/**
 * UniverseEntropyEngine - Stochastic Entity Synthesizer
 * 
 * Replaces naive mock data generation with entropy-driven
 * entity synthesis based on Gaussian demand distributions.
 * 
 * Design Philosophy: We do not "make" tutors - we synthesize
 * entities based on subject demand curves and time-slot entropy.
 */

import { SubjectCategory, SubjectCategoryColor } from '../enums/SubjectCategory.enum';
import { PhysicsNode } from '../../hooks/usePhysicsEngine';

// ════════════════════════════════════════════════════════════════════════════
// LFSR-based PRNG: Shift Register Sequence Generator
// 32-bit Xorshift for deterministic chaos with high period
// ════════════════════════════════════════════════════════════════════════════

export class ShiftRegisterSequence {
    private state: number;
    private readonly initialSeed: number;

    constructor(seed: number) {
        // Ensure non-zero state via bitwise coercion
        this.state = (seed | 0) || 0xDEADBEEF;
        this.initialSeed = this.state;
    }

    /**
     * Xorshift32 Algorithm
     * Period: 2^32 - 1
     * 
     * Bit manipulation sequence:
     * 1. XOR with left-shift by 13
     * 2. XOR with right-shift by 17  
     * 3. XOR with left-shift by 5
     */
    public next(): number {
        let t = this.state;

        // Triple XOR cascade for maximal bit diffusion
        t ^= t << 13;
        t ^= t >> 17;
        t ^= t << 5;

        this.state = t;

        // Normalize to [0, 1) via unsigned right shift
        return (t >>> 0) / 4294967296;
    }

    /**
     * Generate value in specified range [min, max)
     */
    public range(min: number, max: number): number {
        return min + this.next() * (max - min);
    }

    /**
     * Generate integer in range [min, max]
     */
    public rangeInt(min: number, max: number): number {
        return Math.floor(this.range(min, max + 1));
    }

    /**
     * Box-Muller Transform for Gaussian distribution
     * Returns value with mean=0, stddev=1
     */
    public gaussian(): number {
        const u1 = this.next();
        const u2 = this.next();

        // Avoid log(0) singularity
        const safeU1 = Math.max(u1, 1e-10);

        // Box-Muller formula
        const magnitude = Math.sqrt(-2.0 * Math.log(safeU1));
        const angle = 2.0 * Math.PI * u2;

        return magnitude * Math.cos(angle);
    }

    /**
     * Gaussian with specified mean and standard deviation
     */
    public gaussianRange(mean: number, stddev: number): number {
        return mean + this.gaussian() * stddev;
    }

    /**
     * Reset to initial seed state
     */
    public reset(): void {
        this.state = this.initialSeed;
    }

    /**
     * Get current internal state (for serialization)
     */
    public getState(): number {
        return this.state;
    }
}

// ════════════════════════════════════════════════════════════════════════════
// Trait Synthesizer: Weighted Distribution Sampler
// ════════════════════════════════════════════════════════════════════════════

class TraitSynthesizer {
    // Subject demand weights (market-driven distribution)
    private static readonly SUBJECT_WEIGHTS: readonly number[] = [
        0.28,  // MATH - Highest demand
        0.18,  // PHYSICS
        0.12,  // CHEMISTRY
        0.15,  // ENGLISH
        0.12,  // PROGRAMMING
        0.08,  // TOEFL/EXAM
        0.07,  // ARTS/MUSIC
    ] as const;

    private static readonly SUBJECT_MAPPING: readonly SubjectCategory[] = [
        SubjectCategory.MATH_SECONDARY,
        SubjectCategory.PHYSICS,
        SubjectCategory.CHEMISTRY,
        SubjectCategory.ENGLISH_SECONDARY,
        SubjectCategory.PROGRAMMING,
        SubjectCategory.TOEFL,
        SubjectCategory.MUSIC_PIANO,
    ] as const;

    /**
     * Weighted random selection using cumulative distribution
     */
    static synthesizeSubject(prng: ShiftRegisterSequence): SubjectCategory {
        const threshold = prng.next();
        let cumulative = 0;

        // Manual unrolled loop for explicit control flow
        for (let i = 0; i < this.SUBJECT_WEIGHTS.length; i++) {
            const weight = this.SUBJECT_WEIGHTS[i];
            if (weight !== undefined) {
                cumulative += weight;
            }
            if (cumulative > threshold) {
                return this.SUBJECT_MAPPING[i] ?? SubjectCategory.MATH_SECONDARY;
            }
        }

        // Fallback (should never reach due to weights summing to 1)
        return SubjectCategory.MATH_SECONDARY;
    }

    /**
     * Calculate entity mass based on subject category and entropy
     * 
     * Physics interpretation:
     * - STEM subjects: Higher mass (more "gravity" in the system)
     * - Arts subjects: Lower mass (more "agile" movement)
     */
    static calculateMass(subject: SubjectCategory, prng: ShiftRegisterSequence): number {
        const baseMass = 1.0;
        const volatility = prng.next();

        // Subject-specific mass modulation
        switch (subject) {
            case SubjectCategory.PHYSICS:
            case SubjectCategory.CHEMISTRY:
                // Heavy STEM nodes
                return baseMass + (volatility * 2.5);

            case SubjectCategory.MATH_SECONDARY:
                // Medium-heavy
                return baseMass + (volatility * 2.0);

            case SubjectCategory.MUSIC_PIANO:
            case SubjectCategory.DESIGN_GRAPHIC:
                // Light artistic nodes
                return baseMass * 0.7 + (volatility * 0.5);

            case SubjectCategory.TOEFL:
            case SubjectCategory.IELTS:
                // Test prep - medium volatility
                return baseMass + (volatility * 1.2);

            default:
                return baseMass + volatility;
        }
    }

    /**
     * Generate initial velocity bias based on subject affinity
     */
    static calculateVelocityBias(subject: SubjectCategory, prng: ShiftRegisterSequence): number {
        const baseVelocity = prng.gaussian() * 0.5;

        // Subject clusters tend to have correlated initial velocities
        const subjectGroup = Math.floor(subject / 100);
        const groupBias = (subjectGroup - 2) * 0.1;

        return baseVelocity + groupBias;
    }
}

// ════════════════════════════════════════════════════════════════════════════
// Universe Entropy Engine: Main Entity Factory
// ════════════════════════════════════════════════════════════════════════════

export class UniverseEntropyEngine {
    private readonly prng: ShiftRegisterSequence;
    private readonly entityCount: number;
    private readonly epochSeed: number;
    private generationCount: number;

    constructor(seed: number, entityCount: number) {
        this.prng = new ShiftRegisterSequence(seed);
        this.entityCount = entityCount;
        this.epochSeed = seed;
        this.generationCount = 0;
    }

    /**
     * Ignite the universe - generate all entities
     * 
     * @returns Array of synthesized physics nodes
     */
    public ignite(): PhysicsNode[] {
        const nodes: PhysicsNode[] = [];

        // Pre-heat PRNG to avoid seed correlation artifacts
        for (let i = 0; i < 10; i++) {
            this.prng.next();
        }

        for (let i = 0; i < this.entityCount; i++) {
            nodes.push(this.forgeSingularity(i));
        }

        this.generationCount++;
        return nodes;
    }

    /**
     * Forge a single entity (singularity) from entropy
     */
    private forgeSingularity(index: number): PhysicsNode {
        const subject = TraitSynthesizer.synthesizeSubject(this.prng);
        const mass = TraitSynthesizer.calculateMass(subject, this.prng);
        const velocityBias = TraitSynthesizer.calculateVelocityBias(subject, this.prng);

        // Procedural ID generation with entropy component
        const entropyBits = Math.floor(this.prng.next() * 0xFFFF);
        const uniqueId = this.generateEntityId(index, subject, entropyBits);

        // XSeed determines initial angular position in spawn ring
        const xSeed = this.prng.next();

        return {
            id: uniqueId,
            xSeed: xSeed + velocityBias * 0.1, // Slight bias injection
            mass: mass,
            color: SubjectCategoryColor[subject],
            type: 'tutor',
        };
    }

    /**
     * Generate deterministic yet unique entity ID
     * 
     * Format: E_[hex index]_[subject prefix]_[entropy hex]
     */
    private generateEntityId(
        index: number,
        subject: SubjectCategory,
        entropyBits: number
    ): string {
        const hexIndex = index.toString(16).toUpperCase().padStart(4, '0');
        const subjectPrefix = this.getSubjectPrefix(subject);
        const entropyHex = entropyBits.toString(16).toUpperCase().padStart(4, '0');

        return `E_${hexIndex}_${subjectPrefix}_${entropyHex}`;
    }

    /**
     * Map subject category to 3-character prefix
     */
    private getSubjectPrefix(subject: SubjectCategory): string {
        const prefixMap: Partial<Record<SubjectCategory, string>> = {
            [SubjectCategory.MATH_SECONDARY]: 'MTH',
            [SubjectCategory.PHYSICS]: 'PHY',
            [SubjectCategory.CHEMISTRY]: 'CHM',
            [SubjectCategory.ENGLISH_SECONDARY]: 'ENG',
            [SubjectCategory.PROGRAMMING]: 'PRG',
            [SubjectCategory.TOEFL]: 'TFL',
            [SubjectCategory.MUSIC_PIANO]: 'MUS',
        };

        return prefixMap[subject] ?? 'UNK';
    }

    /**
     * Get entropy metrics for debugging/analytics
     */
    public getEntropyMetrics(): {
        seed: number;
        generationCount: number;
        currentState: number;
    } {
        return {
            seed: this.epochSeed,
            generationCount: this.generationCount,
            currentState: this.prng.getState(),
        };
    }

    /**
     * Reset engine to initial state
     */
    public reset(): void {
        this.prng.reset();
        this.generationCount = 0;
    }
}
