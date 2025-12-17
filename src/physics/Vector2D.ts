/**
 * Vector2D - 2D Vector Math Primitives
 * 
 * Immutable vector class for physics calculations.
 * All operations return new Vector2D instances.
 */

export class Vector2D {
    constructor(
        public readonly x: number,
        public readonly y: number
    ) { }

    // ════════════════════════════════════════════════════════════════════════
    // Static Factories
    // ════════════════════════════════════════════════════════════════════════

    static zero(): Vector2D {
        return new Vector2D(0, 0);
    }

    static one(): Vector2D {
        return new Vector2D(1, 1);
    }

    static fromAngle(angle: number, magnitude: number = 1): Vector2D {
        return new Vector2D(
            Math.cos(angle) * magnitude,
            Math.sin(angle) * magnitude
        );
    }

    static random(scale: number = 1): Vector2D {
        return new Vector2D(
            (Math.random() - 0.5) * 2 * scale,
            (Math.random() - 0.5) * 2 * scale
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // Basic Operations (Immutable - return new Vector2D)
    // ════════════════════════════════════════════════════════════════════════

    add(other: Vector2D): Vector2D {
        return new Vector2D(this.x + other.x, this.y + other.y);
    }

    subtract(other: Vector2D): Vector2D {
        return new Vector2D(this.x - other.x, this.y - other.y);
    }

    multiply(scalar: number): Vector2D {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    divide(scalar: number): Vector2D {
        if (scalar === 0) return Vector2D.zero();
        return new Vector2D(this.x / scalar, this.y / scalar);
    }

    negate(): Vector2D {
        return new Vector2D(-this.x, -this.y);
    }

    // ════════════════════════════════════════════════════════════════════════
    // Properties
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Calculate magnitude (length) of vector
     * √(x² + y²)
     */
    magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Calculate squared magnitude (faster, avoids sqrt)
     * x² + y²
     */
    magnitudeSquared(): number {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * Get angle of vector in radians
     */
    angle(): number {
        return Math.atan2(this.y, this.x);
    }

    // ════════════════════════════════════════════════════════════════════════
    // Normalization & Direction
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Return unit vector (magnitude = 1)
     */
    normalize(): Vector2D {
        const mag = this.magnitude();
        if (mag === 0) return Vector2D.zero();
        return this.divide(mag);
    }

    /**
     * Limit magnitude to max value
     */
    limit(max: number): Vector2D {
        const magSq = this.magnitudeSquared();
        if (magSq > max * max) {
            return this.normalize().multiply(max);
        }
        return this;
    }

    /**
     * Set magnitude to specific value
     */
    setMagnitude(magnitude: number): Vector2D {
        return this.normalize().multiply(magnitude);
    }

    // ════════════════════════════════════════════════════════════════════════
    // Vector Products
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Dot product: a·b = |a||b|cos(θ)
     */
    dot(other: Vector2D): number {
        return this.x * other.x + this.y * other.y;
    }

    /**
     * Cross product (2D returns scalar)
     * Useful for determining rotation direction
     */
    cross(other: Vector2D): number {
        return this.x * other.y - this.y * other.x;
    }

    // ════════════════════════════════════════════════════════════════════════
    // Distance & Interpolation
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Euclidean distance to another vector
     * √((x₂-x₁)² + (y₂-y₁)²)
     */
    distanceTo(other: Vector2D): number {
        return this.subtract(other).magnitude();
    }

    /**
     * Squared distance (faster, avoids sqrt)
     */
    distanceToSquared(other: Vector2D): number {
        return this.subtract(other).magnitudeSquared();
    }

    /**
     * Linear interpolation between two vectors
     * t=0 returns this, t=1 returns other
     */
    lerp(other: Vector2D, t: number): Vector2D {
        return new Vector2D(
            this.x + (other.x - this.x) * t,
            this.y + (other.y - this.y) * t
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // Rotation
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Rotate vector by angle (radians)
     */
    rotate(angle: number): Vector2D {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector2D(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }

    /**
     * Get perpendicular vector (90° rotation)
     */
    perpendicular(): Vector2D {
        return new Vector2D(-this.y, this.x);
    }

    // ════════════════════════════════════════════════════════════════════════
    // Clamping & Boundaries
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Clamp x and y within bounds
     */
    clamp(minX: number, maxX: number, minY: number, maxY: number): Vector2D {
        return new Vector2D(
            Math.max(minX, Math.min(maxX, this.x)),
            Math.max(minY, Math.min(maxY, this.y))
        );
    }

    /**
     * Clamp within rectangular bounds
     */
    clampToBounds(
        bounds: { minX: number; maxX: number; minY: number; maxY: number }
    ): Vector2D {
        return this.clamp(bounds.minX, bounds.maxX, bounds.minY, bounds.maxY);
    }

    // ════════════════════════════════════════════════════════════════════════
    // Utilities
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Check if vectors are equal (within epsilon)
     */
    equals(other: Vector2D, epsilon: number = 0.0001): boolean {
        return (
            Math.abs(this.x - other.x) < epsilon &&
            Math.abs(this.y - other.y) < epsilon
        );
    }

    /**
     * Clone vector
     */
    clone(): Vector2D {
        return new Vector2D(this.x, this.y);
    }

    /**
     * Convert to array [x, y]
     */
    toArray(): [number, number] {
        return [this.x, this.y];
    }

    /**
     * String representation
     */
    toString(): string {
        return `Vector2D(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }
}
