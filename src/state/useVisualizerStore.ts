/**
 * useVisualizerStore - Zustand Global State
 * 
 * Bridges React UI (z-index: 50+) with Canvas (z-index: 1).
 * Canvas reads from store via RAF loop, React components write.
 */

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { SubjectCategory } from '../core/enums/SubjectCategory.enum';

// ════════════════════════════════════════════════════════════════════════════
// State Types
// ════════════════════════════════════════════════════════════════════════════

interface VisualizerState {
    // Physics Controls
    repulsionStrength: number;
    centerGravity: number;
    damping: number;
    viewMode: 'galaxy' | 'grid';

    // Interaction State
    hoveredNodeId: string | null;
    selectedNodeId: string | null;
    draggedNodeId: string | null;

    // Viewport
    zoomLevel: number;
    panOffset: { x: number; y: number };

    // Filters
    activeSubjectFilter: SubjectCategory | null;
    showOnlyAvailable: boolean;

    // UI State
    isControlDeckOpen: boolean;
    isDetailCardVisible: boolean;

    // Actions
    setRepulsion: (value: number) => void;
    setCenterGravity: (value: number) => void;
    setDamping: (value: number) => void;
    setViewMode: (mode: 'galaxy' | 'grid') => void;

    setHoveredNode: (id: string | null) => void;
    setSelectedNode: (id: string | null) => void;
    setDraggedNode: (id: string | null) => void;

    setZoom: (level: number) => void;
    setPan: (offset: { x: number; y: number }) => void;

    filterBySubject: (subject: SubjectCategory | null) => void;
    toggleAvailableFilter: () => void;

    toggleControlDeck: () => void;
    showDetailCard: () => void;
    hideDetailCard: () => void;

    reset: () => void;
}

// ════════════════════════════════════════════════════════════════════════════
// Initial State
// ════════════════════════════════════════════════════════════════════════════

const initialState = {
    // Physics
    repulsionStrength: 5000,
    centerGravity: 0.01,
    damping: 0.85,
    viewMode: 'galaxy' as const,

    // Interaction
    hoveredNodeId: null,
    selectedNodeId: null,
    draggedNodeId: null,

    // Viewport
    zoomLevel: 1,
    panOffset: { x: 0, y: 0 },

    // Filters
    activeSubjectFilter: null,
    showOnlyAvailable: false,

    // UI
    isControlDeckOpen: true,
    isDetailCardVisible: false,
};

// ════════════════════════════════════════════════════════════════════════════
// Store Implementation
// ════════════════════════════════════════════════════════════════════════════

export const useVisualizerStore = create<VisualizerState>((set) => ({
    ...initialState,

    // Physics Actions
    setRepulsion: (value) => set({ repulsionStrength: value }),
    setCenterGravity: (value) => set({ centerGravity: value }),
    setDamping: (value) => set({ damping: value }),
    setViewMode: (mode) => set({ viewMode: mode }),

    // Interaction Actions
    setHoveredNode: (id) => set({ hoveredNodeId: id }),
    setSelectedNode: (id) => set({
        selectedNodeId: id,
        isDetailCardVisible: id !== null,
    }),
    setDraggedNode: (id) => set({ draggedNodeId: id }),

    // Viewport Actions
    setZoom: (level) => set({
        zoomLevel: Math.max(0.5, Math.min(3, level))
    }),
    setPan: (offset) => set({ panOffset: offset }),

    // Filter Actions
    filterBySubject: (subject) => set({ activeSubjectFilter: subject }),
    toggleAvailableFilter: () => set((state) => ({
        showOnlyAvailable: !state.showOnlyAvailable
    })),

    // UI Actions
    toggleControlDeck: () => set((state) => ({
        isControlDeckOpen: !state.isControlDeckOpen
    })),
    showDetailCard: () => set({ isDetailCardVisible: true }),
    hideDetailCard: () => set({ isDetailCardVisible: false }),

    // Reset
    reset: () => set(initialState),
}));

// ════════════════════════════════════════════════════════════════════════════
// Selector Hooks - Using useShallow for object comparisons
// ════════════════════════════════════════════════════════════════════════════

export const usePhysicsConfig = () => useVisualizerStore(
    useShallow((state) => ({
        repulsionStrength: state.repulsionStrength,
        centerGravity: state.centerGravity,
        damping: state.damping,
        attractionStrength: 0.01,
        targetDistance: 100,
    }))
);

export const useInteractionState = () => useVisualizerStore(
    useShallow((state) => ({
        hoveredNodeId: state.hoveredNodeId,
        selectedNodeId: state.selectedNodeId,
        draggedNodeId: state.draggedNodeId,
    }))
);

export const useViewport = () => useVisualizerStore(
    useShallow((state) => ({
        zoomLevel: state.zoomLevel,
        panOffset: state.panOffset,
    }))
);

