import { useState, useEffect } from 'react'
import { Calendar, Filter, DollarSign, Clock, Users, Briefcase, FileText } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function DeveloperCalendar() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState([])
    const [projects, setProjects] = useState([])

    // Filters
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().slice(0, 10)) // 1st of current month
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
    const [selectedProjectId, setSelectedProjectId] = useState('')

    const load = async () => {
        setLoading(true)
        try {
            const [calendarRes, projectsRes] = await Promise.all([
                api.get('/reports/calendar', { params: { startDate, endDate, projectId: selectedProjectId } }),
                api.get('/projects')
            ])
            setData(calendarRes.data.data)
            setProjects(projectsRes.data.data)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [startDate, endDate, selectedProjectId])

    const totalDays = data.reduce((sum, item) => sum + item.manDays, 0)
    const totalCost = data.reduce((sum, item) => sum + item.estimatedCost, 0)

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val)

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div className="page-header">
                <div>
                    <h1>Developer Calendar</h1>
                    <p>Track project allocations, working days, and development costs</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 }}>
                <div className="card shadow-sm" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20, background: 'linear-gradient(135deg, var(--accent) 0%, #a855f7 100%)', color: '#fff', border: 'none' }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 12 }}>
                        <Clock size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, opacity: 0.9 }}>Total Man-Days</div>
                        <div style={{ fontSize: 28, fontWeight: 800 }}>{totalDays.toFixed(1)} <span style={{ fontSize: 14, fontWeight: 500 }}>Days</span></div>
                    </div>
                </div>

                <div className="card shadow-sm" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20, borderLeft: '4px solid var(--success)' }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', padding: 12, borderRadius: 12 }}>
                        <DollarSign size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Estimated Cost</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-bold)' }}>{formatCurrency(totalCost)}</div>
                    </div>
                </div>

                <div className="card shadow-sm" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20, borderLeft: '4px solid var(--warning)' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: 12, borderRadius: 12 }}>
                        <Users size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Active Developers</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-bold)' }}>{new Set(data.map(d => d.userId)).size}</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card shadow-sm" style={{ marginBottom: 24, padding: 20 }}>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label"><Calendar size={14} style={{ marginRight: 6 }} /> Range Start</label>
                        <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Range End</label>
                        <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
                        <label className="form-label"><Briefcase size={14} style={{ marginRight: 6 }} /> Filter Project</label>
                        <select className="form-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                            <option value="">All Projects</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <button className="btn btn-ghost" onClick={() => { setStartDate(''); setEndDate(''); setSelectedProjectId(''); }} style={{ height: 42 }}>Clear Filters</button>
                </div>
            </div>

            {/* Main Table */}
            <div className="table-wrapper shadow-sm">
                {loading ? <div className="page-loader"><div className="spinner" /></div> : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Developer</th>
                                <th>Project</th>
                                <th style={{ width: 120 }}>Duration</th>
                                <th style={{ width: 150 }}>Man-Days <span style={{ fontSize: 10, textTransform: 'lowercase', opacity: 0.7 }}>(8h)</span></th>
                                <th style={{ width: 180 }}>Est. Cost</th>
                                <th style={{ textAlign: 'right' }}>Avg Rate/Day</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr><td colSpan={6}><div className="empty-state">No duration data found for this period</div></td></tr>
                            ) : data.map((item, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-v2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--accent)', fontSize: 12 }}>
                                                {item.userName[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{item.userName}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{item.userEmail}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                                            <strong>{item.projectName}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                                            <Clock size={14} />
                                            {Math.floor(item.totalHours)}h {Math.round((item.totalHours % 1) * 60)}m
                                        </div>
                                    </td>
                                    <td>
                                        <div className="badge badge-purple" style={{ fontSize: 13, padding: '4px 12px' }}>
                                            {item.manDays.toFixed(2)} Days
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 700, color: 'var(--text-bold)', fontSize: 15 }}>
                                            {formatCurrency(item.estimatedCost)}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-dim)' }}>
                                        {formatCurrency(item.userCTC / 22)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <style>{`
                .modern-table { width: 100%; border-collapse: separate; border-spacing: 0; }
                .modern-table th { background: var(--surface-v2); padding: 16px; text-align: left; font-size: 11px; text-transform: uppercase; color: var(--text-dim); border-bottom: 2px solid var(--border); }
                .modern-table td { padding: 20px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
                .modern-table tr:hover { background: var(--surface-v2); }
                .badge-purple { background: rgba(124, 58, 237, 0.1); color: var(--accent-light); border: 1px solid rgba(124, 58, 237, 0.2); }
            `}</style>
        </div>
    )
}
