/**
 * CortexEngine - Artificial Intelligence Layer
 * 
 * Replaces randomness with complex, conditional decision trees.
 * Implements Reynolds' steering behaviors with state machine transitions.
 * 
 * State Machine:
 * - IDLE_DRIFT: Minimal movement, Perlin-like noise
 * - HUNTING_TARGET: Pursuit of user-selected entity
 * - EVADING_CROWD: Reynolds separation behavior
 * - ORBITAL_LOCK: Circular motion around target
 * - ERRANT_WANDER: High-velocity random walk
 */

import { Vector2D } from '../physics/Vector2D';
import { KineticState } from '../physics/core/NewtonianIntegrator';

// ════════════════════════════════════════════════════════════════════════════
// State Definitions (The Vocabulary of Behavior)
// ════════════════════════════════════════════════════════════════════════════

export const CortexState = {
    IDLE_DRIFT: 0,
    HUNTING_TARGET: 1,
    EVADING_CROWD: 2,
    ORBITAL_LOCK: 3,
    ERRANT_WANDER: 4,
} as const;

export type CortexState = typeof CortexState[keyof typeof CortexState];

/**
 * Cognitive Packet - Per-entity brain state
 */
export interface CognitivePacket {
    state: CortexState;
    targetId: string | null;
    anxietyLevel: number; // 0.0 to 1.0
    lastDecisionTick: number;
    wanderAngle: number; // Persistent angle for wander behavior
    memory: number[]; // Short-term memory buffer
}

/**
 * Extended Kinetic State with entity ID
 */
export interface CognitiveEntity extends KineticState {
    id: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Cortex Configuration Constants
// ════════════════════════════════════════════════════════════════════════════

const CORTEX_CONFIG = {
    // Decision timing
    DECISION_RATE: 15, // Frames between decisions

    // Anxiety thresholds
    ANXIETY_THRESHOLD: 0.7,
    ANXIETY_DECAY: 0.9,
    ANXIETY_ACCUMULATION: 0.1,

    // Sensor ranges
    SENSOR_RADIUS: 150,
    SEPARATION_RADIUS: 60,

    // Behavior weights
    SEPARATION_WEIGHT: 2.0,
    WANDER_STRENGTH: 1.5,
    DRIFT_STRENGTH: 0.05,
    PURSUIT_STRENGTH: 0.5,
    ORBIT_RADIUS: 80,

    // State transition probabilities
    WANDER_CHANCE: 0.05,
    RETURN_CHANCE: 0.1,
    CROWD_THRESHOLD: 0.6,
    CALM_THRESHOLD: 0.2,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// The Brain (Decision Tree Implementation)
// ════════════════════════════════════════════════════════════════════════════

export class CortexEngine {

    /**
     * Create initial cognitive packet for an entity
     */
    static createCognitivePacket(): CognitivePacket {
        return {
            state: CortexState.IDLE_DRIFT,
            targetId: null,
            anxietyLevel: 0,
            lastDecisionTick: 0,
            wanderAngle: Math.random() * Math.PI * 2,
            memory: [],
        };
    }

    /**
     * The "Think" Cycle - Call this every frame.
     * Decides whether to switch states based on environmental heuristics.
     * 
     * @param entity - The thinking entity
     * @param cortex - Mutable cognitive state
     * @param neighbors - Nearby entities for social calculations
     * @param tick - Current frame number
     * @returns Steering force to apply
     */
    static process(
        entity: CognitiveEntity,
        cortex: CognitivePacket,
        neighbors: CognitiveEntity[],
        tick: number
    ): Vector2D {

        // ═══════════════════════════════════════════════════════════════════
        // Phase 1: Perception - Calculate environmental heuristics
        // ═══════════════════════════════════════════════════════════════════

        const crowdDensity = this.calculateCrowdDensity(entity, neighbors);
        const nearestNeighbor = this.findNearestNeighbor(entity, neighbors);

        // ═══════════════════════════════════════════════════════════════════
        // Phase 2: Emotion - Update internal state
        // ═══════════════════════════════════════════════════════════════════

        this.updateAnxiety(cortex, crowdDensity);
        this.updateMemory(cortex, entity.position);

        // ═══════════════════════════════════════════════════════════════════
        // Phase 3: Decision - State transition check (throttled)
        // ═══════════════════════════════════════════════════════════════════

        if (tick - cortex.lastDecisionTick > CORTEX_CONFIG.DECISION_RATE) {
            this.evaluateStateTransition(entity, cortex, crowdDensity, nearestNeighbor);
            cortex.lastDecisionTick = tick;
        }

        // ═══════════════════════════════════════════════════════════════════
        // Phase 4: Action - Execute state behavior
        // ═══════════════════════════════════════════════════════════════════

        return this.executeBehavior(entity, cortex, neighbors, tick);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Heuristic Subroutines (Perception Layer)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Calculate crowd density using inverse square falloff
     */
    private static calculateCrowdDensity(
        entity: CognitiveEntity,
        neighbors: CognitiveEntity[]
    ): number {
        let density = 0;
        const sensorRadius = CORTEX_CONFIG.SENSOR_RADIUS;

        for (const neighbor of neighbors) {
            if (neighbor.id === entity.id) continue;

            const dist = entity.position.distanceTo(neighbor.position);
            if (dist < sensorRadius && dist > 0) {
                // Inverse square falloff for density impact
                const influence = 1.0 - (dist / sensorRadius);
                density += influence * influence;
            }
        }

        // Normalize to approximate 0-1 range
        return Math.min(1.0, density / 5.0);
    }

    /**
     * Find the nearest neighbor for targeting decisions
     */
    private static findNearestNeighbor(
        entity: CognitiveEntity,
        neighbors: CognitiveEntity[]
    ): CognitiveEntity | null {
        let nearest: CognitiveEntity | null = null;
        let nearestDist = Infinity;

        for (const neighbor of neighbors) {
            if (neighbor.id === entity.id) continue;

            const dist = entity.position.distanceTo(neighbor.position);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = neighbor;
            }
        }

        return nearest;
    }

    /**
     * Update anxiety level based on crowd density
     */
    private static updateAnxiety(cortex: CognitivePacket, crowdDensity: number): void {
        // Exponential decay + accumulation from crowd
        cortex.anxietyLevel = Math.min(
            1.0,
            cortex.anxietyLevel * CORTEX_CONFIG.ANXIETY_DECAY +
            crowdDensity * CORTEX_CONFIG.ANXIETY_ACCUMULATION
        );
    }

    /**
     * Update position memory for path analysis
     */
    private static updateMemory(cortex: CognitivePacket, position: Vector2D): void {
        // Store last 10 positions as flat array [x1, y1, x2, y2, ...]
        cortex.memory.push(position.x, position.y);

        // Limit memory size
        while (cortex.memory.length > 20) {
            cortex.memory.shift();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // State Machine (Decision Layer)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Evaluate and execute state transitions
     */
    private static evaluateStateTransition(
        entity: CognitiveEntity,
        cortex: CognitivePacket,
        density: number,
        nearestNeighbor: CognitiveEntity | null
    ): void {
        // Random factor for probabilistic transitions
        const chance = Math.random();

        switch (cortex.state) {
            case CortexState.IDLE_DRIFT:
                // High crowd → Evade
                if (density > CORTEX_CONFIG.CROWD_THRESHOLD) {
                    cortex.state = CortexState.EVADING_CROWD;
                    break;
                }
                // Random chance to wander
                if (chance < CORTEX_CONFIG.WANDER_CHANCE) {
                    cortex.state = CortexState.ERRANT_WANDER;
                    cortex.wanderAngle = Math.random() * Math.PI * 2;
                }
                break;

            case CortexState.EVADING_CROWD:
                // Low crowd → Return to idle
                if (density < CORTEX_CONFIG.CALM_THRESHOLD) {
                    cortex.state = CortexState.IDLE_DRIFT;
                    cortex.anxietyLevel = 0;
                }
                break;

            case CortexState.ERRANT_WANDER:
                // Random chance to return to idle
                if (chance < CORTEX_CONFIG.RETURN_CHANCE) {
                    cortex.state = CortexState.IDLE_DRIFT;
                }
                break;

            case CortexState.HUNTING_TARGET:
                // Target lost → Return to idle
                if (!cortex.targetId) {
                    cortex.state = CortexState.IDLE_DRIFT;
                }
                break;

            case CortexState.ORBITAL_LOCK:
                // Target lost or too far → Return to idle
                if (!cortex.targetId || !nearestNeighbor) {
                    cortex.state = CortexState.IDLE_DRIFT;
                    cortex.targetId = null;
                }
                break;
        }
    }

    /**
     * Set entity to hunt a specific target
     */
    static setTarget(cortex: CognitivePacket, targetId: string): void {
        cortex.targetId = targetId;
        cortex.state = CortexState.HUNTING_TARGET;
    }

    /**
     * Set entity to orbit a specific target
     */
    static setOrbit(cortex: CognitivePacket, targetId: string): void {
        cortex.targetId = targetId;
        cortex.state = CortexState.ORBITAL_LOCK;
    }

    /**
     * Clear target and return to idle
     */
    static clearTarget(cortex: CognitivePacket): void {
        cortex.targetId = null;
        cortex.state = CortexState.IDLE_DRIFT;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Actuation Subroutines (Steering Behaviors)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Execute behavior for current state
     */
    private static executeBehavior(
        entity: CognitiveEntity,
        cortex: CognitivePacket,
        neighbors: CognitiveEntity[],
        tick: number
    ): Vector2D {
        switch (cortex.state) {
            case CortexState.IDLE_DRIFT:
                return this.behaviorDrift(entity, tick);

            case CortexState.EVADING_CROWD:
                return this.behaviorSeparation(entity, neighbors);

            case CortexState.ERRANT_WANDER:
                return this.behaviorWander(cortex);

            case CortexState.HUNTING_TARGET:
                return this.behaviorPursuit(entity, neighbors, cortex.targetId);

            case CortexState.ORBITAL_LOCK:
                return this.behaviorOrbit(entity, neighbors, cortex.targetId, tick);

            default:
                return Vector2D.zero();
        }
    }

    /**
     * Drift: Minimal Perlin-noise-like movement
     */
    private static behaviorDrift(entity: CognitiveEntity, tick: number): Vector2D {
        // Use time and mass for unique per-entity variation
        const phase = (tick / 60) + entity.mass * 10;
        const angle = Math.sin(phase) * Math.PI;

        return new Vector2D(
            Math.cos(angle),
            Math.sin(angle)
        ).multiply(CORTEX_CONFIG.DRIFT_STRENGTH);
    }

    /**
     * Separation: Reynolds flocking - flee from neighbors
     */
    private static behaviorSeparation(
        entity: CognitiveEntity,
        neighbors: CognitiveEntity[]
    ): Vector2D {
        let steering = Vector2D.zero();
        let count = 0;
        const separationRadius = CORTEX_CONFIG.SEPARATION_RADIUS;

        for (const neighbor of neighbors) {
            if (neighbor.id === entity.id) continue;

            const dist = entity.position.distanceTo(neighbor.position);
            if (dist > 0 && dist < separationRadius) {
                // Vector pointing away from neighbor, weighted by inverse distance
                const diff = entity.position
                    .subtract(neighbor.position)
                    .normalize()
                    .divide(dist);
                steering = steering.add(diff);
                count++;
            }
        }

        if (count > 0) {
            steering = steering.divide(count);
            if (steering.magnitude() > 0) {
                // Desired velocity minus current velocity
                steering = steering
                    .normalize()
                    .multiply(3.0)
                    .subtract(entity.velocity);
            }
        }

        return steering.multiply(CORTEX_CONFIG.SEPARATION_WEIGHT);
    }

    /**
     * Wander: High-velocity random walk with persistent angle
     */
    private static behaviorWander(cortex: CognitivePacket): Vector2D {
        // Add jitter to wander angle
        cortex.wanderAngle += (Math.random() - 0.5) * 0.3;

        return new Vector2D(
            Math.cos(cortex.wanderAngle),
            Math.sin(cortex.wanderAngle)
        ).multiply(CORTEX_CONFIG.WANDER_STRENGTH);
    }

    /**
     * Pursuit: Seek toward target entity
     */
    private static behaviorPursuit(
        entity: CognitiveEntity,
        neighbors: CognitiveEntity[],
        targetId: string | null
    ): Vector2D {
        if (!targetId) return Vector2D.zero();

        const target = neighbors.find(n => n.id === targetId);
        if (!target) return Vector2D.zero();

        // Seek toward target position
        const desired = target.position.subtract(entity.position);
        return desired.normalize().multiply(CORTEX_CONFIG.PURSUIT_STRENGTH);
    }

    /**
     * Orbit: Circular motion around target
     */
    private static behaviorOrbit(
        entity: CognitiveEntity,
        neighbors: CognitiveEntity[],
        targetId: string | null,
        tick: number
    ): Vector2D {
        if (!targetId) return Vector2D.zero();

        const target = neighbors.find(n => n.id === targetId);
        if (!target) return Vector2D.zero();

        // Calculate desired orbit position
        const orbitAngle = tick * 0.02 + entity.mass; // Unique phase per entity
        const orbitRadius = CORTEX_CONFIG.ORBIT_RADIUS;

        const orbitPoint = new Vector2D(
            target.position.x + Math.cos(orbitAngle) * orbitRadius,
            target.position.y + Math.sin(orbitAngle) * orbitRadius
        );

        // Seek toward orbit point
        const desired = orbitPoint.subtract(entity.position);
        return desired.normalize().multiply(CORTEX_CONFIG.PURSUIT_STRENGTH);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Utility Methods
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get human-readable state name
     */
    static getStateName(state: CortexState): string {
        const names: Record<CortexState, string> = {
            [CortexState.IDLE_DRIFT]: 'Idle',
            [CortexState.HUNTING_TARGET]: 'Hunting',
            [CortexState.EVADING_CROWD]: 'Evading',
            [CortexState.ORBITAL_LOCK]: 'Orbiting',
            [CortexState.ERRANT_WANDER]: 'Wandering',
        };
        return names[state];
    }

    /**
     * Get debug info for an entity's cortex
     */
    static getDebugInfo(cortex: CognitivePacket): string {
        return `State: ${this.getStateName(cortex.state)}, Anxiety: ${cortex.anxietyLevel.toFixed(2)}`;
    }
}
