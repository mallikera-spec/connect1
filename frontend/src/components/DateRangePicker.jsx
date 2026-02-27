import { useState, useEffect } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'

export default function DateRangePicker({ startDate, endDate, onRangeChange }) {
    const [isShrunk, setIsShrunk] = useState(false)
    const [selectedPreset, setSelectedPreset] = useState('custom')

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) setIsShrunk(true)
            else setIsShrunk(false)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handlePresetChange = (preset) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        let start = new Date(today)
        let end = new Date(today)

        switch (preset) {
            case 'today':
                break
            case 'yesterday':
                start.setDate(today.getDate() - 1)
                end.setDate(today.getDate() - 1)
                break
            case 'this_week':
                const day = today.getDay()
                const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
                start.setDate(diff)
                break
            case 'last_7_days':
                start.setDate(today.getDate() - 7)
                break
            case 'last_30_days':
                start.setDate(today.getDate() - 30)
                break
            case 'mtd':
                start.setDate(1)
                break
            case 'last_month':
                start.setMonth(today.getMonth() - 1)
                start.setDate(1)
                end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
                break
            case 'ytd':
                start.setMonth(0, 1)
                break
            default:
                return
        }

        const format = (d) => d.toISOString().split('T')[0]
        onRangeChange({ startDate: format(start), endDate: format(end) })
        setSelectedPreset(preset)
    }

    return (
        <div className={`sticky-date-picker-container ${isShrunk ? 'shrunk' : ''}`}>
            <div className="card sticky-date-picker">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar size={isShrunk ? 14 : 18} color="var(--accent-light)" />

                    {/* Presets Dropdown */}
                    <div className="preset-selector-wrap">
                        <select
                            className="preset-select"
                            value={selectedPreset}
                            onChange={(e) => handlePresetChange(e.target.value)}
                        >
                            <option value="custom">Custom Range</option>
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="this_week">This Week</option>
                            <option value="last_7_days">Last 7 Days</option>
                            <option value="last_30_days">Last 30 Days</option>
                            <option value="mtd">Month to Date (MTD)</option>
                            <option value="last_month">Last Month</option>
                            <option value="ytd">Year to Date (YTD)</option>
                        </select>
                        <ChevronDown size={12} className="select-arrow" />
                    </div>

                    <div className="date-inputs-divider" />

                    <div style={{ display: 'flex', alignItems: 'center', gap: isShrunk ? '4px' : '8px' }}>
                        <input
                            type="date"
                            className="input date-input"
                            value={startDate}
                            onChange={(e) => {
                                onRangeChange({ startDate: e.target.value, endDate })
                                setSelectedPreset('custom')
                            }}
                        />
                        <span style={{ color: 'var(--text-dim)', fontSize: isShrunk ? '11px' : '13px' }}>to</span>
                        <input
                            type="date"
                            className="input date-input"
                            value={endDate}
                            onChange={(e) => {
                                onRangeChange({ startDate, endDate: e.target.value })
                                setSelectedPreset('custom')
                            }}
                        />
                    </div>
                </div>
            </div>

            <style>{`
                .preset-selector-wrap {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .preset-select {
                    appearance: none;
                    background: transparent;
                    border: none;
                    color: var(--text);
                    font-size: 13px;
                    font-weight: 600;
                    padding-right: 20px;
                    cursor: pointer;
                    outline: none;
                }
                .shrunk .preset-select {
                    font-size: 11px;
                }
                .select-arrow {
                    position: absolute;
                    right: 0;
                    pointer-events: none;
                    color: var(--text-dim);
                }
                .date-inputs-divider {
                    width: 1px;
                    height: 20px;
                    background: var(--border);
                    margin: 0 4px;
                }
                .shrunk .date-inputs-divider {
                    height: 14px;
                }
            `}</style>
        </div>
    )
}
