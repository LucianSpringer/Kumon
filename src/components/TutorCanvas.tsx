/**
 * TutorCanvas - Main Visualization Component
 * 
 * Integrates usePhysicsEngine for simulation
 * and CanvasRenderer for drawing.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { CanvasRenderer, RenderableNode } from '../canvas/CanvasRenderer';
import { usePhysicsEngine, PhysicsNode } from '../hooks/usePhysicsEngine';
import { usePhysicsConfig, useInteractionState, useVisualizerStore } from '../state/useVisualizerStore';
import './TutorCanvas.css';

interface TutorCanvasProps {
    nodes: readonly PhysicsNode[];
}

export function TutorCanvas({ nodes }: TutorCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<CanvasRenderer | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    const physicsConfig = usePhysicsConfig();
    const { hoveredNodeId, selectedNodeId } = useInteractionState();
    const { setHoveredNode, setSelectedNode } = useVisualizerStore();

    // Physics simulation
    const physics = usePhysicsEngine(
        nodes,
        dimensions.width,
        dimensions.height,
        physicsConfig
    );

    // Initialize renderer and handle resize
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const updateSize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            setDimensions({ width: rect.width, height: rect.height });

            if (rendererRef.current) {
                rendererRef.current.resize(rect.width, rect.height);
            } else {
                rendererRef.current = new CanvasRenderer(canvas);
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Main render loop
    useEffect(() => {
        let animationId: number;

        const render = () => {
            const renderer = rendererRef.current;
            if (!renderer) {
                animationId = requestAnimationFrame(render);
                return;
            }

            renderer.clear();
            renderer.renderBackground();

            // Get current positions from physics engine
            const positions = physics.getPositions();

            // Convert to renderable nodes
            const renderableNodes: RenderableNode[] = positions.map(p => ({
                id: p.id,
                x: p.x,
                y: p.y,
                radius: p.radius,
                color: p.color,
                opacity: 1,
                selected: p.id === selectedNodeId,
                hovered: p.id === hoveredNodeId,
            }));

            // Render connections
            const connections = physics.getConnections();
            for (const conn of connections) {
                const [id1, id2] = conn.split(':');
                const p1 = positions.find(p => p.id === id1);
                const p2 = positions.find(p => p.id === id2);
                if (p1 && p2) {
                    renderer.renderConnection(p1.x, p1.y, p2.x, p2.y, 0.5, true);
                }
            }

            // Render all nodes
            renderer.renderNodes(renderableNodes);

            animationId = requestAnimationFrame(render);
        };

        animationId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationId);
    }, [physics, hoveredNodeId, selectedNodeId]);

    // Mouse interaction handlers
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const nodeId = physics.findParticleAt(x, y);
        setHoveredNode(nodeId);
    }, [physics, setHoveredNode]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const nodeId = physics.findParticleAt(x, y);
        setSelectedNode(nodeId);
    }, [physics, setSelectedNode]);

    const handleMouseLeave = useCallback(() => {
        setHoveredNode(null);
    }, [setHoveredNode]);

    return (
        <canvas
            ref={canvasRef}
            className="tutor-canvas"
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onMouseLeave={handleMouseLeave}
        />
    );
}
