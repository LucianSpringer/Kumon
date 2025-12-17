/**
 * ChronosBuffer - Binary Time Travel System
 * 
 * Circular Ring Buffer storing raw Float32 data for frame-perfect replay.
 * Uses TypedArrays for low-level memory management.
 * 
 * Memory Layout per Entity: [x, y, vx, vy, ax, ay] (6 floats)
 * Memory Budget: 600 frames × 150 entities × 6 floats × 4 bytes ≈ 2.16 MB
 */

import { Vector2D } from '../../physics/Vector2D';
import { KineticState } from '../../physics/core/NewtonianIntegrator';

// ════════════════════════════════════════════════════════════════════════════
// Memory Layout Constants
// ════════════════════════════════════════════════════════════════════════════

const LAYOUT = {
    FLOATS_PER_ENTITY: 6, // x, y, vx, vy, ax, ay
    OFFSET_X: 0,
    OFFSET_Y: 1,
    OFFSET_VX: 2,
    OFFSET_VY: 3,
    OFFSET_AX: 4,
    OFFSET_AY: 5,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// Time Travel Metadata
// ════════════════════════════════════════════════════════════════════════════

export interface ChronosMetadata {
    readonly maxFrames: number;
    readonly entityCount: number;
    readonly bytesAllocated: number;
    readonly recordedFrames: number;
    readonly headIndex: number;
    readonly isRecording: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// The Chronos Buffer Implementation
// ════════════════════════════════════════════════════════════════════════════

export class ChronosBuffer {
    private readonly buffer: Float32Array;
    private readonly maxFrames: number;
    private readonly entityCount: number;
    private readonly floatsPerEntity: number;
    private readonly frameStride: number;

    private headIndex: number;
    private playbackIndex: number;
    private recordedFrames: number;
    private isRecording: boolean;

    constructor(maxFrames: number, entityCount: number) {
        this.maxFrames = maxFrames;
        this.entityCount = entityCount;
        this.floatsPerEntity = LAYOUT.FLOATS_PER_ENTITY;
        this.frameStride = entityCount * this.floatsPerEntity;

        // Allocate massive block of contiguous memory
        const totalFloats = maxFrames * this.frameStride;
        this.buffer = new Float32Array(totalFloats);

        // Initialize cursors
        this.headIndex = 0;
        this.playbackIndex = 0;
        this.recordedFrames = 0;
        this.isRecording = true;

        // Log memory allocation
        const bytesAllocated = totalFloats * 4;
        console.log(`╔═══════════════════════════════════════════════════╗`);
        console.log(`║  CHRONOS BUFFER INITIALIZED                       ║`);
        console.log(`╠═══════════════════════════════════════════════════╣`);
        console.log(`║  Max Frames: ${maxFrames.toString().padStart(6)}                            ║`);
        console.log(`║  Entities:   ${entityCount.toString().padStart(6)}                            ║`);
        console.log(`║  Memory:     ${(bytesAllocated / 1024 / 1024).toFixed(2).padStart(6)} MB                         ║`);
        console.log(`╚═══════════════════════════════════════════════════╝`);
    }

    /**
     * Serialize current Universe state into the buffer
     * 
     * @param entities - Array of kinetic states to record
     */
    public recordFrame(entities: KineticState[]): void {
        if (!this.isRecording) return;

        const frameOffset = this.headIndex * this.frameStride;
        const entityLimit = Math.min(entities.length, this.entityCount);

        for (let i = 0; i < entityLimit; i++) {
            const entity = entities[i];
            if (!entity) continue;

            const entityOffset = frameOffset + (i * this.floatsPerEntity);

            // Manual memory mapping - direct buffer writes
            this.buffer[entityOffset + LAYOUT.OFFSET_X] = entity.position.x;
            this.buffer[entityOffset + LAYOUT.OFFSET_Y] = entity.position.y;
            this.buffer[entityOffset + LAYOUT.OFFSET_VX] = entity.velocity.x;
            this.buffer[entityOffset + LAYOUT.OFFSET_VY] = entity.velocity.y;
            this.buffer[entityOffset + LAYOUT.OFFSET_AX] = entity.acceleration.x;
            this.buffer[entityOffset + LAYOUT.OFFSET_AY] = entity.acceleration.y;
        }

        // Advance head (circular buffer logic)
        this.headIndex = (this.headIndex + 1) % this.maxFrames;
        this.recordedFrames = Math.min(this.recordedFrames + 1, this.maxFrames);

        // Snap playback cursor to head when live
        this.playbackIndex = this.headIndex;
    }

    /**
     * Hydrate Universe state from the buffer
     * 
     * @param framesBack - Number of frames to go back (0 = most recent)
     * @param entities - Array of kinetic states to hydrate
     */
    public replayFrame(framesBack: number, entities: KineticState[]): void {
        if (this.recordedFrames === 0) return;

        // Clamp offset to valid range
        const clampedOffset = Math.min(framesBack, this.recordedFrames - 1);

        // Calculate target frame index (wrapping backwards)
        const targetFrame = (this.headIndex - 1 - clampedOffset + this.maxFrames) % this.maxFrames;
        const frameOffset = targetFrame * this.frameStride;
        const entityLimit = Math.min(entities.length, this.entityCount);

        for (let i = 0; i < entityLimit; i++) {
            const entity = entities[i];
            if (!entity) continue;

            const entityOffset = frameOffset + (i * this.floatsPerEntity);

            // Direct memory read and hydration
            const x = this.buffer[entityOffset + LAYOUT.OFFSET_X] ?? 0;
            const y = this.buffer[entityOffset + LAYOUT.OFFSET_Y] ?? 0;
            const vx = this.buffer[entityOffset + LAYOUT.OFFSET_VX] ?? 0;
            const vy = this.buffer[entityOffset + LAYOUT.OFFSET_VY] ?? 0;

            // Reconstruct Vector2D objects (immutable requirement)
            entity.position = new Vector2D(x, y);
            entity.velocity = new Vector2D(vx, vy);
            // Acceleration is typically not restored in replay
        }

        this.playbackIndex = targetFrame;
    }

    /**
     * Get frame data for a specific entity at a specific frame offset
     */
    public getEntityAtFrame(
        entityIndex: number,
        framesBack: number
    ): { x: number; y: number; vx: number; vy: number } | null {
        if (this.recordedFrames === 0 || entityIndex >= this.entityCount) return null;

        const clampedOffset = Math.min(framesBack, this.recordedFrames - 1);
        const targetFrame = (this.headIndex - 1 - clampedOffset + this.maxFrames) % this.maxFrames;
        const entityOffset = (targetFrame * this.frameStride) + (entityIndex * this.floatsPerEntity);

        return {
            x: this.buffer[entityOffset + LAYOUT.OFFSET_X] ?? 0,
            y: this.buffer[entityOffset + LAYOUT.OFFSET_Y] ?? 0,
            vx: this.buffer[entityOffset + LAYOUT.OFFSET_VX] ?? 0,
            vy: this.buffer[entityOffset + LAYOUT.OFFSET_VY] ?? 0,
        };
    }

    /**
     * Scrub to a percentage position in the timeline
     * 
     * @param percentage - 0.0 (oldest) to 1.0 (newest)
     * @returns Frame offset for replay
     */
    public scrub(percentage: number): number {
        const clampedPct = Math.max(0, Math.min(1, percentage));
        const offset = Math.floor(this.recordedFrames * (1 - clampedPct));
        return Math.max(0, Math.min(offset, this.recordedFrames - 1));
    }

    /**
     * Pause recording
     */
    public pause(): void {
        this.isRecording = false;
    }

    /**
     * Resume recording
     */
    public resume(): void {
        this.isRecording = true;
    }

    /**
     * Toggle recording state
     */
    public toggleRecording(): boolean {
        this.isRecording = !this.isRecording;
        return this.isRecording;
    }

    /**
     * Clear all recorded data
     */
    public clear(): void {
        this.buffer.fill(0);
        this.headIndex = 0;
        this.playbackIndex = 0;
        this.recordedFrames = 0;
    }

    /**
     * Get number of recorded frames
     */
    public getRecordedCount(): number {
        return this.recordedFrames;
    }

    /**
     * Get current playback position as percentage
     */
    public getPlaybackPercentage(): number {
        if (this.recordedFrames === 0) return 1;
        const distanceFromHead = (this.headIndex - this.playbackIndex + this.maxFrames) % this.maxFrames;
        return 1 - (distanceFromHead / this.recordedFrames);
    }

    /**
     * Check if currently recording
     */
    public getIsRecording(): boolean {
        return this.isRecording;
    }

    /**
     * Get metadata for debugging/UI
     */
    public getMetadata(): ChronosMetadata {
        return {
            maxFrames: this.maxFrames,
            entityCount: this.entityCount,
            bytesAllocated: this.buffer.byteLength,
            recordedFrames: this.recordedFrames,
            headIndex: this.headIndex,
            isRecording: this.isRecording,
        };
    }

    /**
     * Get raw buffer reference (for advanced analysis)
     * 
     * @internal
     */
    public getRawBuffer(): Float32Array {
        return this.buffer;
    }

    /**
     * Create trail data for visualization (last N positions)
     */
    public getTrail(entityIndex: number, trailLength: number): Vector2D[] {
        const trail: Vector2D[] = [];
        const length = Math.min(trailLength, this.recordedFrames);

        for (let i = 0; i < length; i++) {
            const data = this.getEntityAtFrame(entityIndex, i);
            if (data) {
                trail.push(new Vector2D(data.x, data.y));
            }
        }

        return trail;
    }
}
