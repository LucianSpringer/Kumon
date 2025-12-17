/**
 * App.tsx - Main Application Entry
 * 
 * The Constellation HUD: Canvas-based tutoring platform visualization
 */

import { useMemo } from 'react';
import { TutorCanvas } from './components/TutorCanvas';
import { ControlDeck } from './components/hud/ControlDeck';
import { PhysicsNode } from './hooks/usePhysicsEngine';
import { TimeSlotEncoder } from './core/bitwise/TimeSlotEncoder';
import { SubjectCategory, SubjectCategoryColor } from './core/enums/SubjectCategory.enum';
import { DayIndex } from './core/bitwise/types';
import './App.css';

// ════════════════════════════════════════════════════════════════════════════
// Mock Data - Replace with real API data
// ════════════════════════════════════════════════════════════════════════════

const generateMockTutors = (): PhysicsNode[] => {
    const subjects = [
        SubjectCategory.MATH_SECONDARY,
        SubjectCategory.PHYSICS,
        SubjectCategory.CHEMISTRY,
        SubjectCategory.ENGLISH_SECONDARY,
        SubjectCategory.PROGRAMMING,
        SubjectCategory.TOEFL,
        SubjectCategory.MUSIC_PIANO,
    ];

    const tutors: PhysicsNode[] = [];

    for (let i = 0; i < 30; i++) {
        const subject = subjects[i % subjects.length] ?? SubjectCategory.MATH_SECONDARY;
        tutors.push({
            id: `tutor_${i}`,
            xSeed: Math.random(),
            mass: 1 + Math.random() * 2,
            color: SubjectCategoryColor[subject],
            type: 'tutor',
        });
    }

    return tutors;
};

// ════════════════════════════════════════════════════════════════════════════
// Demo: Show bitwise encoding in console
// ════════════════════════════════════════════════════════════════════════════

const demoEncoder = () => {
    const encoder = new TimeSlotEncoder();

    // Encode "Senin 08:00 - 12:00"
    encoder.encodeRange(DayIndex.MONDAY, 8, 12);

    // Encode "Rabu 14:00 - 17:00"
    encoder.encodeRange(DayIndex.WEDNESDAY, 14, 17);

    const schedule = encoder.getSchedule();
    console.log('═══════════════════════════════════════');
    console.log('BITWISE CHRONOLOGY ENGINE');
    console.log('═══════════════════════════════════════');
    console.log('Encoded Schedule:', schedule);
    console.log('Monday (binary):', schedule[1].toString(2).padStart(24, '0'));
    console.log('Wednesday (binary):', schedule[3].toString(2).padStart(24, '0'));
    console.log('═══════════════════════════════════════');
};

// Run demo on app start
demoEncoder();

// ════════════════════════════════════════════════════════════════════════════
// Main App Component
// ════════════════════════════════════════════════════════════════════════════

function App() {
    const tutors = useMemo(() => generateMockTutors(), []);

    return (
        <div className="app">
            {/* Canvas Layer (z-index: 1) */}
            <TutorCanvas nodes={tutors} />

            {/* HUD Layer (z-index: 50+) */}
            <div className="hud-container">
                <ControlDeck />
            </div>

            {/* Title Overlay */}
            <div className="app-title">
                <h1>JASA LES PRIVAT</h1>
                <p>The Constellation HUD</p>
            </div>
        </div>
    );
}

export default App;
