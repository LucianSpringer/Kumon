/**
 * NewtonianIntegrator - Discrete Time Integration Engine
 * 
 * Implements numerical integration for particle dynamics.
 * Separated from force calculation for Single Responsibility.
 * 
 * Supports:
 * - Semi-implicit Euler (default)
 * - Velocity Verlet (optional)
 */

import { Vector2D } from '../Vector2D';

// ════════════════════════════════════════════════════════════════════════════
// Kinetic State Interface
// ════════════════════════════════════════════════════════════════════════════

export interface KineticState {
    position: Vector2D;
    velocity: Vector2D;
    acceleration: Vector2D;
    mass: number;
    damping: number;
    radius: number;
}

// ════════════════════════════════════════════════════════════════════════════
// Integration Method Enum
// ════════════════════════════════════════════════════════════════════════════

export const IntegrationMethod = {
    EULER: 'EULER',
    SEMI_IMPLICIT_EULER: 'SEMI_IMPLICIT_EULER',
    VELOCITY_VERLET: 'VELOCITY_VERLET',
} as const;

export type IntegrationMethod = typeof IntegrationMethod[keyof typeof IntegrationMethod];

// ════════════════════════════════════════════════════════════════════════════
// Newtonian Integrator Class
// ════════════════════════════════════════════════════════════════════════════

export class NewtonianIntegrator {
    private readonly method: IntegrationMethod;
    private readonly maxVelocity: number;
    private readonly minVelocityThreshold: number;

    constructor(
        method: IntegrationMethod = IntegrationMethod.SEMI_IMPLICIT_EULER,
        maxVelocity: number = 50,
        minVelocityThreshold: number = 0.001
    ) {
        this.method = method;
        this.maxVelocity = maxVelocity;
        this.minVelocityThreshold = minVelocityThreshold;
    }

    /**
     * Integrate state forward by timestep dt
     * 
     * @param state - Mutable kinetic state
     * @param dt - Timestep (typically 1.0 for 60fps)
     */
    public integrate(state: KineticState, dt: number = 1.0): void {
        // Mass validation - prevent division by zero
        if (state.mass <= 0) {
            this.resetAcceleration(state);
            return;
        }

        switch (this.method) {
            case IntegrationMethod.EULER:
                this.integrateEuler(state, dt);
                break;
            case IntegrationMethod.SEMI_IMPLICIT_EULER:
                this.integrateSemiImplicitEuler(state, dt);
                break;
            case IntegrationMethod.VELOCITY_VERLET:
                this.integrateVerlet(state, dt);
                break;
        }

        // Apply damping (energy dissipation)
        this.applyDamping(state);

        // Clamp velocity to prevent instability
        this.clampVelocity(state);

        // Apply velocity threshold (rest state detection)
        this.applyVelocityThreshold(state);

        // Reset acceleration accumulator for next frame
        this.resetAcceleration(state);
    }

    /**
     * Forward Euler Integration
     * 
     * x(t+dt) = x(t) + v(t) * dt
     * v(t+dt) = v(t) + a(t) * dt
     * 
     * Simple but can be unstable for stiff systems
     */
    private integrateEuler(state: KineticState, dt: number): void {
        // Position update FIRST (using current velocity)
        const positionDelta = state.velocity.multiply(dt);
        state.position = state.position.add(positionDelta);

        // Velocity update (using current acceleration)
        const velocityDelta = state.acceleration.multiply(dt);
        state.velocity = state.velocity.add(velocityDelta);
    }

    /**
     * Semi-Implicit Euler (Symplectic Euler)
     * 
     * v(t+dt) = v(t) + a(t) * dt
     * x(t+dt) = x(t) + v(t+dt) * dt
     * 
     * More stable than forward Euler, preserves energy better
     */
    private integrateSemiImplicitEuler(state: KineticState, dt: number): void {
        // Velocity update FIRST
        const velocityDelta = state.acceleration.multiply(dt);
        state.velocity = state.velocity.add(velocityDelta);

        // Position update using UPDATED velocity
        const positionDelta = state.velocity.multiply(dt);
        state.position = state.position.add(positionDelta);
    }

    /**
     * Velocity Verlet Integration
     * 
     * x(t+dt) = x(t) + v(t)*dt + 0.5*a(t)*dt²
     * v(t+dt) = v(t) + 0.5*(a(t) + a(t+dt))*dt
     * 
     * Most accurate, but requires storing previous acceleration
     */
    private integrateVerlet(state: KineticState, dt: number): void {
        const dtSquared = dt * dt;

        // Position update with second-order term
        const positionDelta = state.velocity.multiply(dt)
            .add(state.acceleration.multiply(0.5 * dtSquared));
        state.position = state.position.add(positionDelta);

        // For full Verlet, we'd need a(t+dt) here
        // Using simplified version with current acceleration only
        const velocityDelta = state.acceleration.multiply(dt);
        state.velocity = state.velocity.add(velocityDelta);
    }

    /**
     * Apply damping factor to velocity
     * Simulates energy dissipation (friction, drag)
     */
    private applyDamping(state: KineticState): void {
        // Explicit vector construction for clarity
        state.velocity = new Vector2D(
            state.velocity.x * state.damping,
            state.velocity.y * state.damping
        );
    }

    /**
     * Clamp velocity to maximum magnitude
     */
    private clampVelocity(state: KineticState): void {
        const speed = state.velocity.magnitude();
        if (speed > this.maxVelocity) {
            state.velocity = state.velocity.normalize().multiply(this.maxVelocity);
        }
    }

    /**
     * Apply velocity threshold - stop very slow particles
     */
    private applyVelocityThreshold(state: KineticState): void {
        const speed = state.velocity.magnitude();
        if (speed < this.minVelocityThreshold) {
            state.velocity = Vector2D.zero();
        }
    }

    /**
     * Reset acceleration accumulator
     */
    private resetAcceleration(state: KineticState): void {
        state.acceleration = Vector2D.zero();
    }

    /**
     * Apply external force to state
     * 
     * F = ma → a = F/m
     */
    public applyForce(state: KineticState, force: Vector2D): void {
        if (state.mass <= 0) return;

        const accelerationUpdate = force.divide(state.mass);
        state.acceleration = state.acceleration.add(accelerationUpdate);
    }

    /**
     * Apply impulse (instantaneous velocity change)
     * 
     * J = m*Δv → Δv = J/m
     */
    public applyImpulse(state: KineticState, impulse: Vector2D): void {
        if (state.mass <= 0) return;

        const velocityChange = impulse.divide(state.mass);
        state.velocity = state.velocity.add(velocityChange);
    }

    /**
     * Constrain position within rectangular bounds
     * Implements elastic collision with walls
     */
    public constrain(
        state: KineticState,
        width: number,
        height: number,
        bounceFactor: number = 0.5
    ): void {
        const radius = state.radius;
        const bounce = -bounceFactor;

        // Left boundary
        if (state.position.x < radius) {
            state.position = new Vector2D(radius, state.position.y);
            state.velocity = new Vector2D(state.velocity.x * bounce, state.velocity.y);
        }

        // Right boundary
        if (state.position.x > width - radius) {
            state.position = new Vector2D(width - radius, state.position.y);
            state.velocity = new Vector2D(state.velocity.x * bounce, state.velocity.y);
        }

        // Top boundary
        if (state.position.y < radius) {
            state.position = new Vector2D(state.position.x, radius);
            state.velocity = new Vector2D(state.velocity.x, state.velocity.y * bounce);
        }

        // Bottom boundary
        if (state.position.y > height - radius) {
            state.position = new Vector2D(state.position.x, height - radius);
            state.velocity = new Vector2D(state.velocity.x, state.velocity.y * bounce);
        }
    }

    /**
     * Calculate kinetic energy of state
     * KE = 0.5 * m * v²
     */
    public kineticEnergy(state: KineticState): number {
        const speedSquared = state.velocity.magnitudeSquared();
        return 0.5 * state.mass * speedSquared;
    }

    /**
     * Get integration method
     */
    public getMethod(): IntegrationMethod {
        return this.method;
    }
}
