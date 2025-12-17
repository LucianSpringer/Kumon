/**
 * CanvasRenderer - Core Rendering Engine
 * 
 * Direct Canvas 2D rendering for particles and connections.
 * NO DOM elements for tutor list - pure Canvas.
 */

export interface RenderableNode {
    readonly id: string;
    readonly x: number;
    readonly y: number;
    readonly radius: number;
    readonly color: number;
    readonly opacity?: number;
    readonly selected?: boolean;
    readonly hovered?: boolean;
}

export class CanvasRenderer {
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private dpr: number;

    constructor(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get 2D context');

        this.ctx = ctx;
        this.dpr = window.devicePixelRatio || 1;
        this.width = canvas.width / this.dpr;
        this.height = canvas.height / this.dpr;
    }

    /**
     * Resize canvas (call on window resize)
     */
    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }

    /**
     * Clear canvas
     */
    clear(): void {
        this.ctx.clearRect(0, 0, this.width * this.dpr, this.height * this.dpr);
    }

    /**
     * Render Void Black background with subtle gradient
     */
    renderBackground(): void {
        const gradient = this.ctx.createRadialGradient(
            this.width / 2 * this.dpr,
            this.height / 2 * this.dpr,
            0,
            this.width / 2 * this.dpr,
            this.height / 2 * this.dpr,
            Math.max(this.width, this.height) * this.dpr
        );
        gradient.addColorStop(0, '#0a0a0f');  // Deep Space center
        gradient.addColorStop(1, '#050505');  // Void Black edge

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width * this.dpr, this.height * this.dpr);
    }

    /**
     * Render a single node (particle)
     */
    renderNode(node: RenderableNode): void {
        const { x, y, radius, color, opacity = 1, selected, hovered } = node;
        const scaledX = x * this.dpr;
        const scaledY = y * this.dpr;
        const scaledRadius = radius * this.dpr;

        // Glow effect for selected/hovered
        if (selected || hovered) {
            const glowRadius = scaledRadius * (selected ? 2.5 : 1.8);
            const glow = this.ctx.createRadialGradient(
                scaledX, scaledY, scaledRadius,
                scaledX, scaledY, glowRadius
            );
            glow.addColorStop(0, this.hexToRgba(color, 0.6));
            glow.addColorStop(1, this.hexToRgba(color, 0));

            this.ctx.fillStyle = glow;
            this.ctx.beginPath();
            this.ctx.arc(scaledX, scaledY, glowRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Main circle
        this.ctx.fillStyle = this.hexToRgba(color, opacity);
        this.ctx.beginPath();
        this.ctx.arc(scaledX, scaledY, scaledRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Border
        this.ctx.strokeStyle = this.hexToRgba(0xffffff, 0.2);
        this.ctx.lineWidth = 1 * this.dpr;
        this.ctx.stroke();
    }

    /**
     * Batch render all nodes
     */
    renderNodes(nodes: readonly RenderableNode[]): void {
        for (const node of nodes) {
            this.renderNode(node);
        }
    }

    /**
     * Render connection line between two points
     */
    renderConnection(
        x1: number, y1: number,
        x2: number, y2: number,
        strength: number = 0.1,
        isMatch: boolean = false
    ): void {
        const color = isMatch ? 0x00FF88 : 0xFFFFFF;
        const alpha = isMatch ? strength * 0.8 : strength * 0.3;

        this.ctx.strokeStyle = this.hexToRgba(color, alpha);
        this.ctx.lineWidth = (isMatch ? 2 : 1) * this.dpr;
        this.ctx.beginPath();
        this.ctx.moveTo(x1 * this.dpr, y1 * this.dpr);
        this.ctx.lineTo(x2 * this.dpr, y2 * this.dpr);
        this.ctx.stroke();
    }

    /**
     * Render availability grid (7×24 heatmap)
     */
    renderAvailabilityGrid(grid: Uint8Array, x: number, y: number): void {
        const cellSize = 6 * this.dpr;
        const gap = 1 * this.dpr;

        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const index = day * 24 + hour;
                const isAvailable = grid[index] === 1;

                const cellX = x * this.dpr + hour * (cellSize + gap);
                const cellY = y * this.dpr + day * (cellSize + gap);

                this.ctx.fillStyle = isAvailable ? '#4ADE80' : '#374151';
                this.ctx.fillRect(cellX, cellY, cellSize, cellSize);
            }
        }
    }

    /**
     * Render text label
     */
    renderLabel(text: string, x: number, y: number, color: string = '#ffffff'): void {
        this.ctx.font = `${12 * this.dpr}px "JetBrains Mono", monospace`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x * this.dpr, y * this.dpr);
    }

    /**
     * Convert hex color to rgba string
     */
    private hexToRgba(hex: number, alpha: number): string {
        const r = (hex >> 16) & 0xff;
        const g = (hex >> 8) & 0xff;
        const b = hex & 0xff;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
