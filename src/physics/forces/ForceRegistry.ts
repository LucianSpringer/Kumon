/**
 * ForceRegistry - Pairwise Force Generators
 * 
 * Implements classical physics force models:
 * - Coulomb's Law (electrostatic/repulsion)
 * - Hooke's Law (spring/attraction)
 * - Gravitational (center attraction)
 */

import { Vector2D } from '../Vector2D';
import { KineticState } from '../core/NewtonianIntegrator';

// ════════════════════════════════════════════════════════════════════════════
// Force Generator Interface
// ════════════════════════════════════════════════════════════════════════════

export interface ForceGenerator {
    calculate(p1: KineticState, p2: KineticState): Vector2D;
}

// ════════════════════════════════════════════════════════════════════════════
// Coulomb Force Generator (Repulsion)
// ════════════════════════════════════════════════════════════════════════════

/**
 * CoulombForceGenerator
 * 
 * Implements electrostatic repulsion: F = k * (m1 * m2) / r²
 * 
 * Force is proportional to product of masses and inversely
 * proportional to the square of distance.
 */
export class CoulombForceGenerator implements ForceGenerator {
    private readonly k: number;
    private readonly minDistance: number;
    private readonly maxDistance: number;
    private readonly softening: number;

    constructor(
        k: number = 5000,
        minDistance: number = 1.0,
        maxDistance: number = 500,
        softening: number = 10
    ) {
        this.k = k;
        this.minDistance = minDistance;
        this.maxDistance = maxDistance;
        this.softening = softening; // Plummer softening parameter
    }

    /**
     * Calculate repulsion force from p2 acting on p1
     * 
     * @param p1 - Target particle (receives force)
     * @param p2 - Source particle (exerts force)
     * @returns Force vector pointing away from p2
     */
    public calculate(p1: KineticState, p2: KineticState): Vector2D {
        // Calculate displacement vector
        const delta = p1.position.subtract(p2.position);
        const distanceSquared = delta.magnitudeSquared();
        const distance = Math.sqrt(distanceSquared);

        // Singularity prevention - minimum distance
        if (distance < this.minDistance) {
            return Vector2D.zero();
        }

        // Maximum effective range
        if (distance > this.maxDistance) {
            return Vector2D.zero();
        }

        // Plummer softening to avoid explosion at small distances
        // F = k * m1 * m2 / (r² + ε²)
        const softenedDistSq = distanceSquared + this.softening * this.softening;

        // Force magnitude calculation
        const forceMagnitude = (this.k * p1.mass * p2.mass) / softenedDistSq;

        // Direction: away from p2 (repulsion)
        const forceDirection = delta.normalize();

        return forceDirection.multiply(forceMagnitude);
    }

    /**
     * Get force constant k
     */
    public getK(): number {
        return this.k;
    }

    /**
     * Create new generator with modified k
     */
    public withK(newK: number): CoulombForceGenerator {
        return new CoulombForceGenerator(newK, this.minDistance, this.maxDistance, this.softening);
    }
}

// ════════════════════════════════════════════════════════════════════════════
// Hooke Force Generator (Spring/Attraction)
// ════════════════════════════════════════════════════════════════════════════

/**
 * HookeForceGenerator
 * 
 * Implements spring force: F = -k * (|r| - r₀)
 * 
 * Force is proportional to displacement from rest length.
 * Negative when stretched, positive when compressed.
 */
export class HookeForceGenerator implements ForceGenerator {
    private readonly k: number;
    private readonly restLength: number;
    private readonly dampingCoefficient: number;

    constructor(
        k: number = 0.01,
        restLength: number = 100,
        dampingCoefficient: number = 0.1
    ) {
        this.k = k;
        this.restLength = restLength;
        this.dampingCoefficient = dampingCoefficient;
    }

    /**
     * Calculate spring force between connected particles
     * 
     * @param p1 - First connected particle
     * @param p2 - Second connected particle
     * @returns Force vector acting on p1 (toward/away from p2)
     */
    public calculate(p1: KineticState, p2: KineticState): Vector2D {
        // Calculate displacement vector (p1 to p2)
        const delta = p2.position.subtract(p1.position);
        const currentLength = delta.magnitude();

        // Prevent division by zero
        if (currentLength < 0.001) {
            return Vector2D.zero();
        }

        // Displacement from rest length
        const displacement = currentLength - this.restLength;

        // Spring force magnitude: F = k * x
        const springForce = this.k * displacement;

        // Spring damping (velocity-proportional)
        const relativeVelocity = p2.velocity.subtract(p1.velocity);
        const dampingForce = relativeVelocity.multiply(this.dampingCoefficient);

        // Combined force direction
        const direction = delta.normalize();

        // Total force = spring + damping (projected on spring axis)
        const dampingProjection = direction.dot(dampingForce);
        const totalMagnitude = springForce + dampingProjection;

        return direction.multiply(totalMagnitude);
    }

    /**
     * Get spring constant k
     */
    public getK(): number {
        return this.k;
    }

    /**
     * Get rest length
     */
    public getRestLength(): number {
        return this.restLength;
    }

    /**
     * Create new generator with modified rest length
     */
    public withRestLength(newRestLength: number): HookeForceGenerator {
        return new HookeForceGenerator(this.k, newRestLength, this.dampingCoefficient);
    }
}

// ════════════════════════════════════════════════════════════════════════════
// Center Gravity Force Generator
// ════════════════════════════════════════════════════════════════════════════

/**
 * CenterGravityForceGenerator
 * 
 * Pulls particles toward a central point.
 * Prevents particle drift to infinity.
 */
export class CenterGravityForceGenerator {
    private readonly g: number;
    private center: Vector2D;

    constructor(g: number = 0.01, center: Vector2D = Vector2D.zero()) {
        this.g = g;
        this.center = center;
    }

    /**
     * Calculate gravity force pulling particle toward center
     */
    public calculate(state: KineticState): Vector2D {
        // Vector from particle to center
        const toCenter = this.center.subtract(state.position);

        // Force proportional to mass and gravity constant
        return toCenter.multiply(this.g * state.mass);
    }

    /**
     * Update center position
     */
    public setCenter(newCenter: Vector2D): void {
        this.center = newCenter;
    }

    /**
     * Get current center
     */
    public getCenter(): Vector2D {
        return this.center;
    }

    /**
     * Get gravity constant
     */
    public getG(): number {
        return this.g;
    }

    /**
     * Create new generator with modified g
     */
    public withG(newG: number): CenterGravityForceGenerator {
        return new CenterGravityForceGenerator(newG, this.center);
    }
}

// ════════════════════════════════════════════════════════════════════════════
// Force Registry (Composite Pattern)
// ════════════════════════════════════════════════════════════════════════════

/**
 * ForceRegistry
 * 
 * Manages multiple force generators and aggregates forces.
 */
export class ForceRegistry {
    private readonly coulomb: CoulombForceGenerator;
    private readonly hooke: HookeForceGenerator;
    private readonly gravity: CenterGravityForceGenerator;

    constructor(
        coulomb: CoulombForceGenerator = new CoulombForceGenerator(),
        hooke: HookeForceGenerator = new HookeForceGenerator(),
        gravity: CenterGravityForceGenerator = new CenterGravityForceGenerator()
    ) {
        this.coulomb = coulomb;
        this.hooke = hooke;
        this.gravity = gravity;
    }

    /**
     * Calculate repulsion between two particles
     */
    public calculateRepulsion(p1: KineticState, p2: KineticState): Vector2D {
        return this.coulomb.calculate(p1, p2);
    }

    /**
     * Calculate spring force between connected particles
     */
    public calculateSpring(p1: KineticState, p2: KineticState): Vector2D {
        return this.hooke.calculate(p1, p2);
    }

    /**
     * Calculate center gravity for a particle
     */
    public calculateGravity(state: KineticState): Vector2D {
        return this.gravity.calculate(state);
    }

    /**
     * Update gravity center
     */
    public setGravityCenter(center: Vector2D): void {
        this.gravity.setCenter(center);
    }

    /**
     * Get force generators for configuration
     */
    public getCoulomb(): CoulombForceGenerator {
        return this.coulomb;
    }

    public getHooke(): HookeForceGenerator {
        return this.hooke;
    }

    public getGravity(): CenterGravityForceGenerator {
        return this.gravity;
    }
}
