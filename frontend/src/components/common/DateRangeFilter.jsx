import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { toLocalISOString } from '../../utils/formatters';

/**
 * Standardized Premium DateRangeFilter Component
 * Matches the requested UI with presets like MTD, YTD, etc.
 */
const DateRangeFilter = ({ value, onChange, onApply }) => {
    const [selectedPreset, setSelectedPreset] = useState('Month to Date (MTD)');

    // Sync preset label if value matches a preset on mount
    useEffect(() => {
        const matchingPreset = presets.find(p => {
            if (p.label === 'Custom Range') return false;
            const val = p.getValue();
            return val && val.start === value.start && val.end === value.end;
        });
        if (matchingPreset) setSelectedPreset(matchingPreset.label);
        else setSelectedPreset('Custom Range');
    }, []);

    const presets = [
        { label: 'Custom Range', getValue: () => null },
        { label: 'Today', getValue: () => {
            const d = new Date();
            return { start: toLocalISOString(d), end: toLocalISOString(d) };
        }},
        { label: 'Tomorrow', getValue: () => {
            const d = new Date(); d.setDate(d.getDate() + 1);
            return { start: toLocalISOString(d), end: toLocalISOString(d) };
        }},
        { label: 'Yesterday', getValue: () => {
            const d = new Date(); d.setDate(d.getDate() - 1);
            const s = toLocalISOString(d);
            return { start: s, end: s };
        }},
        { label: 'This Week', getValue: () => {
            const now = new Date();
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
            const start = new Date(now.setDate(diff));
            return { start: toLocalISOString(start), end: toLocalISOString(new Date()) };
        }},
        { label: 'Last 7 Days', getValue: () => {
            const end = new Date();
            const start = new Date(); start.setDate(start.getDate() - 7);
            return { start: toLocalISOString(start), end: toLocalISOString(end) };
        }},
        { label: 'Last 30 Days', getValue: () => {
            const end = new Date();
            const start = new Date(); start.setDate(start.getDate() - 30);
            return { start: toLocalISOString(start), end: toLocalISOString(end) };
        }},
        { label: 'Month to Date (MTD)', getValue: () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return { start: toLocalISOString(start), end: toLocalISOString(now) };
        }},
        { label: 'Last Month', getValue: () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            return { start: toLocalISOString(start), end: toLocalISOString(end) };
        }},
        { label: 'Year to Date (YTD)', getValue: () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 1);
            return { start: toLocalISOString(start), end: toLocalISOString(now) };
        }}
    ];

    const handlePresetChange = (label) => {
        setSelectedPreset(label);
        const preset = presets.find(p => p.label === label);
        if (preset && label !== 'Custom Range') {
            const newValue = preset.getValue();
            onChange(newValue);
            // Optionally auto-apply on preset change for better UX
            // if (onApply) setTimeout(() => onApply(newValue), 0);
        }
    };

    // If dates are changed manually, switch to Custom Range
    const handleManualChange = (field, val) => {
        setSelectedPreset('Custom Range');
        onChange({ ...value, [field]: val });
    };

    return (
        <div className="premium-date-filter">
            <div className="filter-inner">
                <div className="main-icon">
                    <Calendar size={18} color="#7c3aed" />
                </div>
                
                <div className="preset-selector">
                    <select 
                        value={selectedPreset}
                        onChange={(e) => handlePresetChange(e.target.value)}
                    >
                        {presets.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                    </select>
                    <span className="preset-label">
                        {selectedPreset} <ChevronDown size={14} />
                    </span>
                </div>

                <div className="divider"></div>

                <div className="range-inputs">
                    <div className="date-input-wrap">
                        <input 
                            type="date" 
                            value={value.start}
                            onChange={(e) => handleManualChange('start', e.target.value)}
                        />
                        <Calendar size={14} className="field-icon" />
                    </div>
                    
                    <span className="to-text">to</span>

                    <div className="date-input-wrap">
                        <input 
                            type="date" 
                            value={value.end}
                            onChange={(e) => handleManualChange('end', e.target.value)}
                        />
                        <Calendar size={14} className="field-icon" />
                    </div>
                </div>
            </div>

            <button className="btn btn-primary btn-sm apply-action" onClick={() => onApply && onApply()}>
                Apply
            </button>

            <style>{`
                .premium-date-filter {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .filter-inner {
                    display: flex;
                    align-items: center;
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 4px 12px;
                    height: 48px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    transition: all 0.2s ease;
                }

                .filter-inner:hover {
                    border-color: #cbd5e1;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
                }

                .main-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 12px;
                    background: #f5f3ff;
                    padding: 6px;
                    border-radius: 8px;
                }

                .preset-selector {
                    position: relative;
                    min-width: 140px;
                    cursor: pointer;
                }

                .preset-selector select {
                    position: absolute;
                    inset: 0;
                    opacity: 0;
                    width: 100%;
                    height: 100%;
                    cursor: pointer;
                    z-index: 2;
                }

                .preset-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #1e293b;
                }

                .divider {
                    width: 1px;
                    height: 24px;
                    background: #e2e8f0;
                    margin: 0 16px;
                }

                .range-inputs {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .date-input-wrap {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .date-input-wrap input {
                    background: transparent;
                    border: none;
                    font-size: 14px;
                    font-weight: 500;
                    color: #475569;
                    padding: 4px 32px 4px 4px;
                    width: 125px;
                    cursor: pointer;
                    outline: none;
                }

                .field-icon {
                    position: absolute;
                    right: 4px;
                    color: #94a3b8;
                    pointer-events: none;
                }

                .to-text {
                    font-size: 12px;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: lowercase;
                }

                .apply-action {
                    height: 44px;
                    padding: 0 20px !important;
                    border-radius: 12px !important;
                    font-weight: 700 !important;
                    text-transform: none !important;
                    letter-spacing: 0 !important;
                }

                /* Dark mode support logic (optional if used) */
                [data-theme='dark'] .filter-inner {
                    background: #1e1e2d;
                    border-color: #2e2e42;
                }
                [data-theme='dark'] .preset-label { color: #e2e8f0; }
                [data-theme='dark'] .divider { background: #2e2e42; }
                [data-theme='dark'] .date-input-wrap input { color: #94a3b8; }
            `}</style>
        </div>
    );
};

export default DateRangeFilter;
