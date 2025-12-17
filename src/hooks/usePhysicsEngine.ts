/**
 * usePhysicsEngine - Force-Directed Graph Physics Hook
 * 
 * Simulates particle physics at 60 FPS using requestAnimationFrame.
 * Uses Refs for mutable state to avoid React re-renders.
 * 
 * Architecture:
 * 1. CortexEngine: AI decision trees for behavioral steering
 * 2. Force Calculation: Coulomb repulsion + Hooke attraction
 * 3. NewtonianIntegrator: Velocity/position updates
 * 4. ChronosBuffer: Frame-perfect time travel recording
 */

import { useRef, useEffect, useCallback } from 'react';
import { Vector2D } from '../physics/Vector2D';
import { CortexEngine, CognitivePacket, CognitiveEntity } from '../ai/CortexEngine';
import { ChronosBuffer } from '../core/time/ChronosBuffer';
import { KineticState } from '../physics/core/NewtonianIntegrator';

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

export interface PhysicsNode {
    readonly id: string;
    readonly xSeed: number;
    readonly mass: number;
    readonly color: number;
    readonly type?: 'tutor' | 'student' | 'subject';
}

interface Particle extends KineticState {
    id: string;
    color: number;
    type: 'tutor' | 'student' | 'subject';
    isConnected: boolean;
}

export interface PhysicsConfig {
    readonly repulsionStrength: number;
    readonly attractionStrength: number;
    readonly damping: number;
    readonly targetDistance: number;
    readonly centerGravity: number;
}

export interface ParticlePosition {
    readonly id: string;
    readonly x: number;
    readonly y: number;
    readonly radius: number;
    readonly color: number;
    readonly type: 'tutor' | 'student' | 'subject';
}

// ════════════════════════════════════════════════════════════════════════════
// Configuration Constants
// ════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: PhysicsConfig = {
    repulsionStrength: 5000,
    attractionStrength: 0.01,
    damping: 0.85,
    targetDistance: 100,
    centerGravity: 0.01,
};

const CHRONOS_CONFIG = {
    MAX_FRAMES: 600,    // 10 seconds at 60fps
    ENABLED: true,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// Hook Implementation
// ════════════════════════════════════════════════════════════════════════════

export function usePhysicsEngine(
    nodes: readonly PhysicsNode[],
    canvasWidth: number,
    canvasHeight: number,
    config: Partial<PhysicsConfig> = {}
) {
    const settings = { ...DEFAULT_CONFIG, ...config };

    // ═══════════════════════════════════════════════════════════════════════
    // Mutable Refs (NOT React state - no re-renders!)
    // ═══════════════════════════════════════════════════════════════════════
    const particlesRef = useRef<Map<string, Particle>>(new Map());
    const isRunningRef = useRef(true);
    const frameIdRef = useRef<number>(0);
    const tickRef = useRef<number>(0);
    const connectionsRef = useRef<Set<string>>(new Set());

    // AI Cortex: Per-entity cognitive state
    const cortexRef = useRef<Map<string, CognitivePacket>>(new Map());

    // Time Travel: Chronos Buffer for frame recording
    const chronosRef = useRef<ChronosBuffer | null>(null);

    // ═══════════════════════════════════════════════════════════════════════
    // Initialize / Update Particles
    // ═══════════════════════════════════════════════════════════════════════
    const initializeParticles = useCallback((newNodes: readonly PhysicsNode[]) => {
        const existing = particlesRef.current;
        const updated = new Map<string, Particle>();

        for (const node of newNodes) {
            const existingParticle = existing.get(node.id);

            if (existingParticle) {
                // Preserve position, update other properties
                updated.set(node.id, {
                    ...existingParticle,
                    mass: node.mass,
                    color: node.color,
                });
            } else {
                // Create new particle with seeded position
                const angle = node.xSeed * Math.PI * 2;
                const spawnRadius = Math.random() * Math.min(canvasWidth, canvasHeight) * 0.3;

                updated.set(node.id, {
                    id: node.id,
                    position: new Vector2D(
                        canvasWidth / 2 + Math.cos(angle) * spawnRadius,
                        canvasHeight / 2 + Math.sin(angle) * spawnRadius
                    ),
                    velocity: Vector2D.zero(),
                    acceleration: Vector2D.zero(),
                    mass: node.mass,
                    damping: settings.damping,
                    radius: 20 + node.mass * 2,
                    color: node.color,
                    type: node.type ?? 'tutor',
                    isConnected: false,
                });

                // Initialize cognitive packet for new entity
                cortexRef.current.set(node.id, CortexEngine.createCognitivePacket());
            }
        }

        particlesRef.current = updated;

        // Initialize Chronos Buffer once we know entity count
        if (CHRONOS_CONFIG.ENABLED && !chronosRef.current && newNodes.length > 0) {
            chronosRef.current = new ChronosBuffer(CHRONOS_CONFIG.MAX_FRAMES, newNodes.length);
        }
    }, [canvasWidth, canvasHeight, settings.damping]);

    // ═══════════════════════════════════════════════════════════════════════
    // Force Calculations
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Calculate repulsion force (Coulomb's Law)
     * F = k × (m1 × m2) / r²
     */
    const calculateRepulsion = useCallback((p1: Particle, p2: Particle): Vector2D => {
        const delta = p1.position.subtract(p2.position);
        const distance = Math.max(delta.magnitude(), 1);
        const forceMagnitude = (settings.repulsionStrength * p1.mass * p2.mass) / (distance * distance);
        return delta.normalize().multiply(forceMagnitude);
    }, [settings.repulsionStrength]);

    /**
     * Calculate attraction force (Hooke's Law)
     * F = k × (distance - targetDistance)
     */
    const calculateAttraction = useCallback((p1: Particle, p2: Particle): Vector2D => {
        const delta = p2.position.subtract(p1.position);
        const distance = delta.magnitude();
        const displacement = distance - settings.targetDistance;
        return delta.normalize().multiply(settings.attractionStrength * displacement);
    }, [settings.attractionStrength, settings.targetDistance]);

    /**
     * Calculate center gravity
     * Pulls all nodes toward canvas center
     */
    const calculateCenterGravity = useCallback((p: Particle): Vector2D => {
        const center = new Vector2D(canvasWidth / 2, canvasHeight / 2);
        const delta = center.subtract(p.position);
        return delta.multiply(settings.centerGravity * p.mass);
    }, [canvasWidth, canvasHeight, settings.centerGravity]);

    // ═══════════════════════════════════════════════════════════════════════
    // Simulation Step
    // ═══════════════════════════════════════════════════════════════════════
    const simulate = useCallback(() => {
        const particles = Array.from(particlesRef.current.values());
        const tick = tickRef.current++;

        // Reset accelerations
        for (const p of particles) {
            p.acceleration = Vector2D.zero();
        }

        // ═══════════════════════════════════════════════════════════════════
        // PHASE 0: AI CORTEX PROCESSING
        // Each entity thinks and generates steering impulse
        // ═══════════════════════════════════════════════════════════════════
        const cognitiveEntities: CognitiveEntity[] = particles.map(p => ({
            ...p,
            id: p.id,
        }));

        for (const p of particles) {
            let cortex = cortexRef.current.get(p.id);
            if (!cortex) {
                cortex = CortexEngine.createCognitivePacket();
                cortexRef.current.set(p.id, cortex);
            }

            // AI decides steering force based on environment
            const cogEntity: CognitiveEntity = { ...p, id: p.id };
            const steeringImpulse = CortexEngine.process(
                cogEntity,
                cortex,
                cognitiveEntities,
                tick
            );

            // Apply steering as additional force
            p.acceleration = p.acceleration.add(steeringImpulse);
        }

        // ═══════════════════════════════════════════════════════════════════
        // PHASE A: REPULSION (O(n²) - optimize with QuadTree for large n)
        // ═══════════════════════════════════════════════════════════════════
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];
                if (!p1 || !p2) continue;

                const force = calculateRepulsion(p1, p2);
                p1.acceleration = p1.acceleration.add(force.divide(p1.mass));
                p2.acceleration = p2.acceleration.subtract(force.divide(p2.mass));
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // PHASE B: ATTRACTION (only for connected nodes)
        // ═══════════════════════════════════════════════════════════════════
        for (const connectionKey of connectionsRef.current) {
            const [id1, id2] = connectionKey.split(':');
            const p1 = id1 ? particlesRef.current.get(id1) : undefined;
            const p2 = id2 ? particlesRef.current.get(id2) : undefined;

            if (p1 && p2) {
                const force = calculateAttraction(p1, p2);
                p1.acceleration = p1.acceleration.add(force.divide(p1.mass));
                p2.acceleration = p2.acceleration.subtract(force.divide(p2.mass));
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // PHASE C: CENTER GRAVITY + INTEGRATION
        // ═══════════════════════════════════════════════════════════════════
        for (const p of particles) {
            // Add center gravity
            const gravity = calculateCenterGravity(p);
            p.acceleration = p.acceleration.add(gravity.divide(p.mass));

            // Integrate velocity (with damping)
            p.velocity = p.velocity.add(p.acceleration).multiply(settings.damping);

            // Integrate position
            p.position = p.position.add(p.velocity);

            // Boundary constraints
            p.position = new Vector2D(
                Math.max(p.radius, Math.min(canvasWidth - p.radius, p.position.x)),
                Math.max(p.radius, Math.min(canvasHeight - p.radius, p.position.y))
            );
        }

        // ═══════════════════════════════════════════════════════════════════
        // PHASE D: CHRONOS RECORDING (Time Travel)
        // ═══════════════════════════════════════════════════════════════════
        if (chronosRef.current) {
            chronosRef.current.recordFrame(particles);
        }
    }, [
        calculateRepulsion,
        calculateAttraction,
        calculateCenterGravity,
        settings.damping,
        canvasWidth,
        canvasHeight
    ]);

    // ═══════════════════════════════════════════════════════════════════════
    // Animation Loop (60 FPS)
    // ═══════════════════════════════════════════════════════════════════════
    const animate = useCallback(() => {
        if (!isRunningRef.current) return;

        simulate();
        frameIdRef.current = requestAnimationFrame(animate);
    }, [simulate]);

    // Initialize on node changes
    useEffect(() => {
        initializeParticles(nodes);
    }, [nodes, initializeParticles]);

    // Start/stop animation loop
    useEffect(() => {
        isRunningRef.current = true;
        frameIdRef.current = requestAnimationFrame(animate);

        return () => {
            isRunningRef.current = false;
            cancelAnimationFrame(frameIdRef.current);
        };
    }, [animate]);

    // ═══════════════════════════════════════════════════════════════════════
    // Public API
    // ═══════════════════════════════════════════════════════════════════════

    const getPositions = useCallback((): ParticlePosition[] => {
        return Array.from(particlesRef.current.values()).map(p => ({
            id: p.id,
            x: p.position.x,
            y: p.position.y,
            radius: p.radius,
            color: p.color,
            type: p.type,
        }));
    }, []);

    const findParticleAt = useCallback((x: number, y: number): string | null => {
        for (const p of particlesRef.current.values()) {
            const dx = p.position.x - x;
            const dy = p.position.y - y;
            if (dx * dx + dy * dy <= p.radius * p.radius) {
                return p.id;
            }
        }
        return null;
    }, []);

    const getDistance = useCallback((id1: string, id2: string): number | null => {
        const p1 = particlesRef.current.get(id1);
        const p2 = particlesRef.current.get(id2);
        if (!p1 || !p2) return null;
        return p1.position.distanceTo(p2.position);
    }, []);

    const connect = useCallback((id1: string, id2: string): void => {
        const key = id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;
        connectionsRef.current.add(key);

        const p1 = particlesRef.current.get(id1);
        const p2 = particlesRef.current.get(id2);
        if (p1) p1.isConnected = true;
        if (p2) p2.isConnected = true;
    }, []);

    const disconnect = useCallback((id1: string, id2: string): void => {
        const key = id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;
        connectionsRef.current.delete(key);
    }, []);

    const pause = useCallback(() => {
        isRunningRef.current = false;
    }, []);

    const resume = useCallback(() => {
        if (!isRunningRef.current) {
            isRunningRef.current = true;
            frameIdRef.current = requestAnimationFrame(animate);
        }
    }, [animate]);

    const setParticlePosition = useCallback((id: string, x: number, y: number): void => {
        const p = particlesRef.current.get(id);
        if (p) {
            p.position = new Vector2D(x, y);
            p.velocity = Vector2D.zero();
        }
    }, []);

    // ═══════════════════════════════════════════════════════════════════════
    // Chronos (Time Travel) API
    // ═══════════════════════════════════════════════════════════════════════

    const scrubTimeline = useCallback((percentage: number): void => {
        if (!chronosRef.current) return;

        const framesBack = chronosRef.current.scrub(percentage);
        const particles = Array.from(particlesRef.current.values());
        chronosRef.current.replayFrame(framesBack, particles);
    }, []);

    const getTimelineMetrics = useCallback(() => {
        if (!chronosRef.current) return null;
        return chronosRef.current.getMetadata();
    }, []);

    // ═══════════════════════════════════════════════════════════════════════
    // Cortex (AI) API
    // ═══════════════════════════════════════════════════════════════════════

    const getCortexState = useCallback((id: string) => {
        return cortexRef.current.get(id);
    }, []);

    const setEntityTarget = useCallback((entityId: string, targetId: string): void => {
        const cortex = cortexRef.current.get(entityId);
        if (cortex) {
            CortexEngine.setTarget(cortex, targetId);
        }
    }, []);

    return {
        // Core Physics
        getPositions,
        findParticleAt,
        getDistance,
        connect,
        disconnect,
        pause,
        resume,
        setParticlePosition,
        getConnections: () => Array.from(connectionsRef.current),

        // Chronos (Time Travel)
        scrubTimeline,
        getTimelineMetrics,

        // Cortex (AI)
        getCortexState,
        setEntityTarget,
    };
}

