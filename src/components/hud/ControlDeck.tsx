/**
 * ControlDeck - Glassmorphism Bottom Panel
 * 
 * Controls physics parameters with sliders.
 * Floats over Canvas (z-index: 50).
 */


import { useVisualizerStore } from '../../state/useVisualizerStore';
import './ControlDeck.css';

export function ControlDeck() {
    const {
        repulsionStrength,
        centerGravity,
        damping,
        viewMode,
        setRepulsion,
        setCenterGravity,
        setDamping,
        setViewMode,
        isControlDeckOpen,
        toggleControlDeck,
    } = useVisualizerStore();

    return (
        <>
            {/* Toggle Button */}
            <button
                className="control-deck-toggle"
                onClick={toggleControlDeck}
                aria-label={isControlDeckOpen ? 'Hide controls' : 'Show controls'}
            >
                {isControlDeckOpen ? '▼' : '▲'}
            </button>

            {/* Main Panel */}
            <div className={`control-deck ${isControlDeckOpen ? 'open' : 'closed'}`}>
                <div className="control-deck__header">
                    <span className="control-deck__title">PHYSICS CONTROL</span>
                    <span className="control-deck__indicator">⚡</span>
                </div>

                <div className="control-deck__controls">
                    {/* Repulsion Slider */}
                    <div className="control-deck__group">
                        <label className="control-deck__label">
                            Repulsion
                            <span className="control-deck__value">{repulsionStrength}</span>
                        </label>
                        <input
                            type="range"
                            className="control-deck__slider"
                            min="1000"
                            max="10000"
                            step="500"
                            value={repulsionStrength}
                            onChange={(e) => setRepulsion(Number(e.target.value))}
                        />
                    </div>

                    {/* Center Gravity Slider */}
                    <div className="control-deck__group">
                        <label className="control-deck__label">
                            Gravity
                            <span className="control-deck__value">{centerGravity.toFixed(3)}</span>
                        </label>
                        <input
                            type="range"
                            className="control-deck__slider"
                            min="0.001"
                            max="0.05"
                            step="0.001"
                            value={centerGravity}
                            onChange={(e) => setCenterGravity(Number(e.target.value))}
                        />
                    </div>

                    {/* Damping Slider */}
                    <div className="control-deck__group">
                        <label className="control-deck__label">
                            Damping
                            <span className="control-deck__value">{damping.toFixed(2)}</span>
                        </label>
                        <input
                            type="range"
                            className="control-deck__slider"
                            min="0.7"
                            max="0.98"
                            step="0.01"
                            value={damping}
                            onChange={(e) => setDamping(Number(e.target.value))}
                        />
                    </div>

                    {/* View Mode Toggle */}
                    <div className="control-deck__group">
                        <label className="control-deck__label">Mode</label>
                        <div className="control-deck__toggle-group">
                            <button
                                className={`control-deck__toggle-btn ${viewMode === 'galaxy' ? 'active' : ''}`}
                                onClick={() => setViewMode('galaxy')}
                            >
                                Galaxy
                            </button>
                            <button
                                className={`control-deck__toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                            >
                                Grid
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
