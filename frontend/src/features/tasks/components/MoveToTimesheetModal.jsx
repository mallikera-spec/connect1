import { useState } from 'react';
import { Clock, Calendar, CheckCircle2, X } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { getISTTodayString } from '../../../lib/dateUtils';

export default function MoveToTimesheetModal({ tasks, onClose, onSaved }) {
    const [date, setDate] = useState(getISTTodayString());
    const [taskHours, setTaskHours] = useState(
        tasks.reduce((acc, t) => ({ ...acc, [t.id]: '01:00' }), {})
    );
    const [status, setStatus] = useState('in_progress');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const handleHourChange = (taskId, value) => {
        setTaskHours(prev => ({ ...prev, [taskId]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                tasks: tasks.map(t => ({
                    id: t.id,
                    hours_spent: taskHours[t.id] || '01:00'
                })),
                date,
                status,
                notes: notes || `Batch log for ${tasks.length} tasks`
            };

            await api.post('/timesheets/batch-log-tasks', payload);
            toast.success(`${tasks.length} tasks logged to your timesheet!`);
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Failed to log tasks');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal glass-card animate-fade-in" style={{ maxWidth: 480, height: 'auto', borderRadius: 24, margin: '20px', alignSelf: 'center', position: 'relative' }}>
                <div className="modal-header" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ background: 'var(--accent-bg)', color: 'var(--accent)', padding: 10, borderRadius: '14px', display: 'flex' }}>
                            <Clock size={22} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Move to Timesheet</h2>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-dim)', fontWeight: 500 }}>
                                Logging {tasks.length} activity entries
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-icon" onClick={onClose} style={{ color: 'var(--text-dim)' }}><X size={22} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ gap: 20, padding: '24px 32px' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontSize: 11, letterSpacing: '0.05em', fontWeight: 900 }}>
                                <Calendar size={14} /> CHOOSE WORKING DATE
                            </label>
                            <input 
                                type="date" 
                                className="form-input custom-vibrant-input" 
                                style={{ fontSize: 16, height: 52, fontWeight: 700, background: 'var(--bg-card-hover)', border: '2px solid var(--accent-light)', borderRadius: 14, color: 'var(--text)', padding: '0 16px' }}
                                value={date} 
                                onChange={e => setDate(e.target.value)} 
                                required 
                            />
                        </div>

                        {/* Task List with Individual Hours */}
                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', marginBottom: 8 }}>
                                RECORD TIME PER TASK
                            </label>
                            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 14, background: 'rgba(0,0,0,0.05)' }}>
                                {tasks.map((t, idx) => (
                                    <div key={t.id} style={{ padding: '10px 16px', borderBottom: idx === tasks.length - 1 ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Task ID: {t.id.slice(0, 8)}...</div>
                                        </div>
                                        <input 
                                            type="time" 
                                            className="form-input custom-vibrant-input" 
                                            style={{ width: 100, height: 36, fontSize: 13, background: 'var(--bg-card-hover)', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text)' }}
                                            value={taskHours[t.id]} 
                                            onChange={e => handleHourChange(t.id, e.target.value)} 
                                            required 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 900, color: 'var(--text-muted)' }}>
                                    <CheckCircle2 size={12} /> UPDATE STATUS TO
                                </label>
                                <select 
                                    className="form-select status-select-vibrant" 
                                    style={{ background: 'var(--bg-card-hover)', height: 44, borderRadius: 10, border: '1px solid var(--border)', color: 'var(--text)' }}
                                    value={status} 
                                    onChange={e => setStatus(e.target.value)}
                                >
                                    <option value="todo">TO DO</option>
                                    <option value="in_progress">IN PROGRESS</option>
                                    <option value="done">DONE</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)' }}>NOTES (OPTIONAL)</label>
                            <textarea 
                                className="form-textarea" 
                                style={{ background: 'var(--bg-card-hover)', borderRadius: 14, border: '1px solid var(--border)', padding: 16, color: 'var(--text)', fontSize: 14 }}
                                placeholder="What did you work on?" 
                                value={notes} 
                                onChange={e => setNotes(e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>

                    <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', padding: '20px 32px' }}>
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving} style={{ borderRadius: 12, fontWeight: 600 }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 14, fontWeight: 800, borderRadius: 12 }} disabled={saving}>
                            {saving ? <span className="spinner-sm" /> : `Log ${tasks.length} Activities`}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                .modal-overlay { z-index: 10000; }
                [data-theme='dark'] .custom-vibrant-input::-webkit-calendar-picker-indicator,
                [data-theme='midnight'] .custom-vibrant-input::-webkit-calendar-picker-indicator,
                [data-theme='forest'] .custom-vibrant-input::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                }
                .spinner-sm { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .animate-fade-in { animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            `}</style>
        </div>
    );
}
