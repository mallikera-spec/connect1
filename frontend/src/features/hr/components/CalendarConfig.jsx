import React, { useState, useEffect } from 'react';
import { 
    Calendar as CalendarIcon, 
    ChevronLeft, 
    ChevronRight, 
    Plus, 
    Trash2, 
    Save, 
    Loader2, 
    AlertCircle,
    Info,
    CalendarCheck,
    Coffee,
    X
} from 'lucide-react';
import { HRService } from '../HRService';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

export default function CalendarConfig() {
    const { user } = useAuth();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        date: '',
        type: 'Holiday',
        label: ''
    });

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const res = await HRService.getCalendarConfigs(month, year);
            setConfigs(res.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load holiday configurations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, [month, year]);

    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await HRService.updateCalendarConfig(form);
            toast.success("Configuration updated successfully");
            setIsModalOpen(false);
            setForm({ date: '', type: 'Holiday', label: '' });
            fetchConfigs();
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to save configuration");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (type) => {
        switch (type) {
            case 'Holiday': return <span className="badge badge-purple" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.2)' }}>Holiday</span>;
            case 'Week Off': return <span className="badge badge-ghost" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>Week Off</span>;
            case 'Working': return <span className="badge badge-blue" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>Working Day</span>;
            case 'WFH': return <span className="badge badge-teal" style={{ background: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6', border: '1px solid rgba(20, 184, 166, 0.2)' }}>WFH</span>;
            default: return <span className="badge">{type}</span>;
        }
    };

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Calendar Configuration</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0, marginTop: 4 }}>Manage custom holidays, week-offs, and working day overrides.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--card-bg-light)', padding: '6px 12px', borderRadius: 12, border: '1px solid var(--border)' }}>
                        <button 
                            onClick={handlePrevMonth}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center' }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span style={{ fontWeight: 700, fontSize: 14, minWidth: 120, textAlign: 'center' }}>
                            {monthNames[month - 1]} {year}
                        </span>
                        <button 
                            onClick={handleNextMonth}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center' }}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => setIsModalOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <Plus size={18} />
                        Declare Special Day
                    </button>
                </div>
            </div>

            <div className="card polished-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--card-bg-light)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Date</th>
                            <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Type</th>
                            <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Reason / Label</th>
                            <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4" style={{ padding: 48, textAlign: 'center' }}>
                                    <Loader2 className="spinner" size={32} style={{ margin: '0 auto', opacity: 0.5 }} />
                                    <p style={{ marginTop: 12, color: 'var(--text-dim)', fontSize: 14 }}>Loading configurations...</p>
                                </td>
                            </tr>
                        ) : configs.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ padding: 64, textAlign: 'center' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                        <CalendarCheck size={32} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>No special days declared yet</h3>
                                    <p style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 4, maxWidth: 300, margin: '8px auto 24px' }}>Standard week-offs (Sundays, 2nd & 4th Saturdays) are applied by default.</p>
                                    <button className="btn btn-ghost" onClick={() => setIsModalOpen(true)}>Declare a Day</button>
                                </td>
                            </tr>
                        ) : configs.map(config => (
                            <tr key={config.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                                <td style={{ padding: '16px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ padding: 8, background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)', borderRadius: 8 }}>
                                            <CalendarIcon size={18} />
                                        </div>
                                        <span style={{ fontWeight: 600 }}>{new Date(config.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                    {getStatusBadge(config.type)}
                                </td>
                                <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: 14 }}>
                                    {config.label || '---'}
                                </td>
                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                    <button 
                                        className="btn btn-icon btn-ghost" 
                                        onClick={() => {
                                            setForm({ date: config.date, type: config.type, label: config.label || '' });
                                            setIsModalOpen(true);
                                        }}
                                        style={{ color: 'var(--text-dim)', marginRight: 8 }}
                                    >
                                        <Save size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: 24, padding: 20, background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 16, display: 'flex', gap: 16 }}>
                <Info size={24} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>Standard Policies Applied</h4>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        By default, Sundays and the 2nd & 4th Saturdays are treated as <strong>Week Offs</strong>. 
                        Declaring a <strong>Holiday</strong> will mark it as an off-day (paid). 
                        Declaring a Saturday as a <strong>Working Day</strong> will override the default week-off rule.
                    </p>
                </div>
            </div>

            {/* Config Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                    <div className="modal" style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Declare Special Day</h2>
                            <button className="btn-icon" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input 
                                        type="date" 
                                        className="form-input" 
                                        required
                                        value={form.date}
                                        onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select 
                                        className="form-select"
                                        value={form.type}
                                        onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                    >
                                        <option value="Holiday">Government / Public Holiday</option>
                                        <option value="Week Off">Additional Week Off</option>
                                        <option value="Working">Working Day (Override Week Off)</option>
                                        <option value="WFH">Work From Home (WFH) Day</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Label / Reason</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder="e.g. Independence Day, Annual Meet..."
                                        value={form.label}
                                        required
                                        onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: 12, borderRadius: 12, fontSize: 13 }}>
                                    <AlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                                    <span>Careful: Changes here will immediately reflect in all attendance calendars and affect payroll calculations.</span>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? <Loader2 className="spinner" size={18} /> : 'Save Configuration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .table-row-hover:hover {
                    background: rgba(255, 255, 255, 0.02) !important;
                }
            `}</style>
        </div>
    );
}
