/**
 * usePhysicsEngine - Force-Directed Graph Physics Hook
 * 
 * Simulates particle physics at 60 FPS using requestAnimationFrame.
 * Uses Refs for mutable state to avoid React re-renders.
 * 
 * Algorithm:
 * 1. Each node REPELS every other node (Coulomb's Law)
 * 2. Connected nodes are ATTRACTED (Hooke's Law)
 * 3. All nodes pulled toward CENTER (prevents drift)
 * 4. Velocity DAMPENED each frame (energy dissipation)
 */

import { useRef, useEffect, useCallback } from 'react';
import { Vector2D } from '../physics/Vector2D';

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

interface Particle {
    id: string;
    position: Vector2D;
    velocity: Vector2D;
    acceleration: Vector2D;
    mass: number;
    color: number;
    radius: number;
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
// Default Configuration
// ════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: PhysicsConfig = {
    repulsionStrength: 5000,
    attractionStrength: 0.01,
    damping: 0.85,
    targetDistance: 100,
    centerGravity: 0.01,
};

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
    const connectionsRef = useRef<Set<string>>(new Set());

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
                const radius = Math.random() * Math.min(canvasWidth, canvasHeight) * 0.3;

                updated.set(node.id, {
                    id: node.id,
                    position: new Vector2D(
                        canvasWidth / 2 + Math.cos(angle) * radius,
                        canvasHeight / 2 + Math.sin(angle) * radius
                    ),
                    velocity: Vector2D.zero(),
                    acceleration: Vector2D.zero(),
                    mass: node.mass,
                    color: node.color,
                    radius: 20 + node.mass * 2,
                    type: node.type ?? 'tutor',
                    isConnected: false,
                });
            }
        }

        particlesRef.current = updated;
    }, [canvasWidth, canvasHeight]);

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

        // Reset accelerations
        for (const p of particles) {
            p.acceleration = Vector2D.zero();
        }

        // ═══════════════════════════════════════════════════════════════════
        // A. REPULSION (O(n²) - optimize with QuadTree for large n)
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
        // B. ATTRACTION (only for connected nodes)
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
        // C. CENTER GRAVITY + INTEGRATION
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

    return {
        getPositions,
        findParticleAt,
        getDistance,
        connect,
        disconnect,
        pause,
        resume,
        setParticlePosition,
        getConnections: () => Array.from(connectionsRef.current),
    };
}
