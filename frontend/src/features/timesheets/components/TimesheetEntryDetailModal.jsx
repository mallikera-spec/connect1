import { useState } from 'react'
import { X, Clock, Calendar, User, FolderKanban, MessageSquare, ShieldCheck, AlertCircle } from 'lucide-react'
import QAFeedbackTrail from '../../../components/common/QAFeedbackTrail'
import { formatDate } from '../../../utils/formatters'

export default function TimesheetEntryDetailModal({
    isOpen,
    onClose,
    entry,
    onUpdateFeedback,
    saving = false
}) {
    const [feedback, setFeedback] = useState(entry?.admin_feedback || '')

    if (!isOpen || !entry) return null

    const isTaskEntry = !!entry.task_id
    const itemId = isTaskEntry ? entry.task_id : entry.id
    const itemType = isTaskEntry ? 'task' : 'todo'

    const handleSaveFeedback = (e) => {
        e.preventDefault()
        // FIX: Wrap feedback in an object as the backend expects an object of updates
        onUpdateFeedback(entry.id, { admin_feedback: feedback })
    }

    const STATUS_BADGE = {
        todo: 'badge-blue',
        in_progress: 'badge-yellow',
        done: 'badge-green',
        blocked: 'badge-red',
        verified: 'badge-purple',
        failed: 'badge-red'
    }

    return (
        <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
            <div className="modal glass-card animate-fade-in" style={{ width: '90%', maxWidth: 1000, borderRadius: 28, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', padding: '24px 40px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: 'var(--accent-bg)', color: 'var(--accent)', padding: 12, borderRadius: '16px', display: 'flex', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}>
                            <Clock size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Entry Details</h2>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-dim)', fontWeight: 500, opacity: 0.8 }}>
                                Activity Review & Communication History
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-icon" onClick={onClose} style={{ color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}><X size={22} /></button>
                </div>

                <div className="modal-body" style={{ padding: 0, height: 'min(700px, 80vh)', display: 'grid', gridTemplateColumns: 'minmax(380px, 1.2fr) 1fr' }}>
                    {/* History Pane */}
                    <div className="history-pane custom-scrollbar" style={{ padding: '32px 40px', background: 'rgba(0,0,0,0.15)', borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
                        <QAFeedbackTrail type={itemType} itemId={itemId} allowPost={true} />
                    </div>

                    {/* Info Pane */}
                    <div className="info-pane custom-scrollbar" style={{ padding: '32px 40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
                        <section style={{ background: 'rgba(255,255,255,0.02)', padding: '24px 28px', borderRadius: 24, border: '1px solid var(--border)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)' }}>
                            <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16, display: 'block', opacity: 0.8 }}>
                                ACTIVITY TITLE
                            </label>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.6, marginBottom: entry.notes ? 20 : 0, letterSpacing: '-0.01em' }}>{entry.title}</h3>
                            {entry.notes && (
                                <div style={{ padding: 20, background: 'rgba(var(--accent-rgb), 0.05)', borderRadius: 16, border: '1px solid rgba(var(--accent-rgb), 0.1)', fontSize: 13, color: 'var(--text-dim)', fontStyle: 'italic', lineHeight: 1.7, borderLeft: '4px solid var(--accent)' }}>
                                    {entry.notes}
                                </div>
                            )}
                        </section>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, padding: '0 8px' }}>
                            <div className="detail-item">
                                <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <FolderKanban size={13} className="text-accent" /> PROJECT
                                </label>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', paddingLeft: 2 }}>
                                    {entry.project?.name || 'In-House'}
                                </div>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <User size={13} className="text-accent" /> EMPLOYEE
                                </label>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', paddingLeft: 2 }}>
                                    {entry.userName}
                                </div>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Calendar size={13} className="text-accent" /> WORKING DATE
                                </label>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', paddingLeft: 2 }}>
                                    {formatDate(entry.date)}
                                </div>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Clock size={13} className="text-accent" /> TIME RECORDED
                                </label>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', paddingLeft: 2 }}>
                                    {entry.hours_spent} hours
                                </div>
                            </div>
                        </div>

                        <div className="detail-item" style={{ borderTop: '1px solid var(--border)', paddingTop: 24, paddingLeft: 8 }}>
                            <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 16, display: 'block' }}>CURRENT STATUS</label>
                            <span className={`badge ${STATUS_BADGE[entry.status] || ''}`} style={{ fontSize: 11, padding: '8px 20px', fontWeight: 800, borderRadius: '12px', letterSpacing: '0.05em' }}>
                                {entry.status?.toUpperCase().replace('_', ' ')}
                            </span>
                        </div>

                        <section style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.01)', padding: 28, borderRadius: 24, border: '1px solid var(--border)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)' }}>
                            <form onSubmit={handleSaveFeedback}>
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', marginBottom: 16 }}>
                                    <MessageSquare size={16} className="text-accent" /> ADMIN FEEDBACK
                                </label>
                                <textarea 
                                    className="form-textarea"
                                    placeholder="Add private review feedback for the developer..."
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    rows={3}
                                    style={{ background: 'var(--bg-card-hover)', borderRadius: 18, border: '1px solid var(--border)', padding: 20, fontSize: 14, marginBottom: 20, color: 'var(--text)', width: '100%', resize: 'none', lineHeight: 1.6, transition: 'all 0.2s ease' }}
                                />
                                <button 
                                    type="submit" 
                                    className="btn btn-primary w-full" 
                                    disabled={saving || feedback === entry.admin_feedback}
                                    style={{ height: 52, borderRadius: 16, fontWeight: 800, fontSize: 15, boxShadow: '0 8px 20px -6px rgba(var(--accent-rgb), 0.4)', letterSpacing: '0.02em' }}
                                >
                                    {saving ? 'Updating...' : 'Update Feedback'}
                                </button>
                            </form>
                        </section>
                    </div>
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
                .text-accent { color: var(--accent); }
                .badge { display: inline-flex; align-items: center; justify-content: center; }
            `}</style>
        </div>
    )
}
