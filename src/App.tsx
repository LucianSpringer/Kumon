/**
 * App.tsx - Main Application Entry
 * 
 * The Constellation HUD: Canvas-based tutoring platform visualization
 * 
 * Architecture:
 * - UniverseEntropyEngine → PhysicsCore → CanvasRenderer
 */

import { useMemo, useEffect } from 'react';
import { TutorCanvas } from './components/TutorCanvas';
import { ControlDeck } from './components/hud/ControlDeck';
import { UniverseEntropyEngine } from './core/simulation/UniverseEntropyEngine';
import { TimeSlotEncoder } from './core/bitwise/TimeSlotEncoder';
import { DayIndex } from './core/bitwise/types';
import './App.css';

// ════════════════════════════════════════════════════════════════════════════
// Entropy Configuration
// ════════════════════════════════════════════════════════════════════════════

const UNIVERSE_CONFIG = {
    EPOCH_SEED: 0xCAFEBABE, // Deterministic seed for reproducibility
    ENTITY_COUNT: 50,       // Number of tutor entities to synthesize
} as const;

// ════════════════════════════════════════════════════════════════════════════
// Demo: Show bitwise encoding and entropy metrics in console
// ════════════════════════════════════════════════════════════════════════════

const runSystemDiagnostics = () => {
    // Bitwise Chronology Engine Demo
    const encoder = new TimeSlotEncoder();
    encoder.encodeRange(DayIndex.MONDAY, 8, 12);
    encoder.encodeRange(DayIndex.WEDNESDAY, 14, 17);
    encoder.encodeRange(DayIndex.FRIDAY, 9, 18);

    const schedule = encoder.getSchedule();

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║          JASA LES PRIVAT - SYSTEM DIAGNOSTICS                 ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log('║                                                               ║');
    console.log('║  BITWISE CHRONOLOGY ENGINE                                    ║');
    console.log('║  ─────────────────────────                                    ║');
    console.log(`║  Schedule Array: [${schedule.join(', ')}]`);
    console.log(`║  Monday (binary):    ${schedule[1].toString(2).padStart(24, '0')}`);
    console.log(`║  Wednesday (binary): ${schedule[3].toString(2).padStart(24, '0')}`);
    console.log(`║  Friday (binary):    ${schedule[5].toString(2).padStart(24, '0')}`);
    console.log('║                                                               ║');
    console.log('║  UNIVERSE ENTROPY ENGINE                                      ║');
    console.log('║  ─────────────────────────                                    ║');
    console.log(`║  Epoch Seed: 0x${UNIVERSE_CONFIG.EPOCH_SEED.toString(16).toUpperCase()}`);
    console.log(`║  Entity Count: ${UNIVERSE_CONFIG.ENTITY_COUNT}`);
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
};

// ════════════════════════════════════════════════════════════════════════════
// Main App Component
// ════════════════════════════════════════════════════════════════════════════

function App() {
    // Initialize Universe Entropy Engine with deterministic seed
    const universeEngine = useMemo(() => {
        return new UniverseEntropyEngine(
            UNIVERSE_CONFIG.EPOCH_SEED,
            UNIVERSE_CONFIG.ENTITY_COUNT
        );
    }, []);

    // Ignite universe - synthesize entities from entropy
    const entities = useMemo(() => {
        const nodes = universeEngine.ignite();

        // Log entropy metrics
        const metrics = universeEngine.getEntropyMetrics();
        console.log('Universe Ignited:', {
            entityCount: nodes.length,
            ...metrics,
        });

        return nodes;
    }, [universeEngine]);

    // Run system diagnostics on mount
    useEffect(() => {
        runSystemDiagnostics();
    }, []);

    return (
        <div className="app">
            {/* Canvas Layer (z-index: 1) */}
            <TutorCanvas nodes={entities} />

            {/* HUD Layer (z-index: 50+) */}
            <div className="hud-container">
                <ControlDeck />
            </div>

            {/* Title Overlay */}
            <div className="app-title">
                <h1>JASA LES PRIVAT</h1>
                <p className="app-subtitle">The Constellation HUD</p>
                <p className="app-metrics">
                    Entities: {entities.length} |
                    Seed: 0x{UNIVERSE_CONFIG.EPOCH_SEED.toString(16).toUpperCase()}
                </p>
            </div>
        </div>
    );
}

export default App;

