/**
 * ScheduleHeatmap - Binary Time-Strip Visualization
 * 
 * Renders 7×24 grid directly from bitwise data.
 * NO JSON conversion - direct bit shift rendering.
 */

import { WeeklySchedule } from '../../core/bitwise/types';
import './ScheduleHeatmap.css';

interface ScheduleHeatmapProps {
    schedule: WeeklySchedule;
    highlightMatches?: WeeklySchedule;
    compact?: boolean;
}

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function ScheduleHeatmap({
    schedule,
    highlightMatches,
    compact = false
}: ScheduleHeatmapProps) {
    return (
        <div className={`schedule-heatmap ${compact ? 'compact' : ''}`}>
            {/* Day Labels */}
            <div className="schedule-heatmap__labels">
                {DAY_LABELS.map((label, i) => (
                    <span key={i} className="schedule-heatmap__day-label">{label}</span>
                ))}
            </div>

            {/* Hour Grid */}
            <div className="schedule-heatmap__grid">
                {schedule.map((dayMask, dayIndex) => (
                    <div key={dayIndex} className="schedule-heatmap__row">
                        {Array.from({ length: 24 }, (_, hour) => {
                            // ════════════════════════════════════════════════════════════
                            // DIRECT BITWISE CHECK - No intermediate conversion
                            // ════════════════════════════════════════════════════════════
                            const isAvailable = (dayMask & (1 << hour)) !== 0;
                            const isMatched = highlightMatches
                                ? ((highlightMatches[dayIndex] ?? 0) & (1 << hour)) !== 0
                                : false;

                            return (
                                <div
                                    key={hour}
                                    className={`schedule-heatmap__cell ${isMatched ? 'matched' : isAvailable ? 'available' : 'busy'
                                        }`}
                                    title={`${DAY_LABELS[dayIndex]} ${hour.toString().padStart(2, '0')}:00`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Hour Labels (only if not compact) */}
            {!compact && (
                <div className="schedule-heatmap__hour-labels">
                    {[0, 6, 12, 18].map(h => (
                        <span key={h} className="schedule-heatmap__hour-label">
                            {h.toString().padStart(2, '0')}:00
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
