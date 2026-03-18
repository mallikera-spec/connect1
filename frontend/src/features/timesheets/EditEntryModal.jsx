import { useState } from 'react'
import { X, Save } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import QAFeedbackTrail from '../../components/common/QAFeedbackTrail'
import { useAuth } from '../../context/AuthContext'

export default function EditEntryModal({ entry, myProjects, onClose, onSaved }) {
    const { user } = useAuth()
    const [title, setTitle] = useState(entry.title || '')
    const [projectId, setProjectId] = useState(entry.project_id || '')
    const [time, setTime] = useState(entry.hours_spent || '00:00')
    const [notes, setNotes] = useState(entry.notes || '')
    const [status, setStatus] = useState(entry.status || 'in_progress')
    const [saving, setSaving] = useState(false)

    const handleSave = async (e) => {
        e.preventDefault()
        if (!title.trim() || !projectId || !notes.trim() || !time || time === '00:00') {
            return toast.error('Please fill all mandatory fields.')
        }

        setSaving(true)
        try {
            const isResubmitting = entry.status === 'failed' && status === 'done';
            
            const res = await api.patch(`/timesheets/entries/${entry.id}`, {
                title: title.trim(),
                project_id: projectId,
                hours_spent: time,
                notes: notes.trim(),
                status: status
            })

            if (isResubmitting) {
                await api.post(`/timesheets/entries/${entry.id}/feedback`, {
                    content: 'Resubmitted for QA (from Detail View)',
                    new_status: 'done'
                });
            }

            toast.success('Activity updated!')
            onSaved(res.data.data)
            onClose()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">Edit Activity</h2>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>
                <form id="edit-entry-form" onSubmit={handleSave} className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', padding: 0, overflow: 'hidden', flex: 1 }}>
                    {(() => {
                        const isLocked = !['admin', 'super_admin', 'director'].some(r => user?.roles?.some(ur => (typeof ur === 'string' ? ur : ur.name).toLowerCase().includes(r))) && ['done', 'verified'].includes(entry.status);
                        const isFailed = entry.status === 'failed';
                        const isEditable = !isLocked; 

                        return (
                            <>
                                {/* Left Side: History */}
                                <div className="history-pane" style={{ padding: '24px', background: 'rgba(0,0,0,0.1)', borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
                                    <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '16px', letterSpacing: '0.05em' }}>
                                        Communication Logs
                                    </h4>
                                    <QAFeedbackTrail 
                                        type={entry.task_id ? "task" : "todo"} 
                                        itemId={entry.task_id || entry.id} 
                                        allowPost={true} 
                                    />
                                </div>

                                {/* Right Side: Form */}
                                <div style={{ padding: '24px', overflowY: 'auto' }}>
                                    <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '16px', letterSpacing: '0.05em' }}>
                                        Activity Details
                                    </h4>

                                    <div className="form-group">
                                        <label className="form-label">Project</label>
                                        <select
                                            className="form-select"
                                            value={projectId}
                                            onChange={e => setProjectId(e.target.value)}
                                            required
                                            disabled={!isEditable}
                                        >
                                            <option value="">Select Project...</option>
                                            {myProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Activity Title</label>
                                        <input
                                            className="form-input"
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            placeholder="e.g. Building login screen"
                                            required
                                            disabled={!isEditable}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Time Commitment (hh:mm)</label>
                                        <input
                                            type="time"
                                            className="form-input"
                                            value={time}
                                            onChange={e => setTime(e.target.value)}
                                            required
                                            disabled={!isEditable}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            value={status}
                                            onChange={e => setStatus(e.target.value)}
                                            disabled={!isEditable}
                                        >
                                            <option value="todo">TODO</option>
                                            <option value="in_progress">IN PROGRESS</option>
                                            <option value="done">DONE</option>
                                            {isFailed && <option value="done">DONE (RESUBMIT)</option>}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Notes</label>
                                        <textarea
                                            className="form-textarea"
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            rows={6}
                                            placeholder="Brief details..."
                                            required
                                            disabled={!isEditable}
                                        />
                                    </div>


                                    {isLocked && !isFailed && (
                                        <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)', marginTop: 12 }}>
                                            <p style={{ margin: 0, fontSize: 12, color: '#34d399', textAlign: 'center' }}>
                                                This activity is locked while under review.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </form>

                <div className="modal-footer">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button type="submit" form="edit-entry-form" className="btn btn-primary" disabled={saving}>
                        {saving ? <span className="spinner-sm" /> : <><Save size={16} /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    )
}
