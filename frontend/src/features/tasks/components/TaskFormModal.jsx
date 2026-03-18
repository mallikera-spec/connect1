import { useState, useEffect } from 'react'
import { X, RotateCcw } from 'lucide-react'
import QAFeedbackTrail from '../../../components/common/QAFeedbackTrail'

export default function TaskFormModal({
    isOpen,
    onClose,
    initialData,
    onSubmit,
    projects = [],
    users = [],
    isManager = false,
    currentUser = {},
    saving = false,
    title = "Task"
}) {
    const [form, setForm] = useState(initialData)

    useEffect(() => {
        setForm(initialData)
    }, [initialData])

    if (!isOpen) return null

    const isEdit = !!initialData?.id
    
    // Role detection
    const userRoles = currentUser?.roles?.map(r => (typeof r === 'string' ? r : r.name || '').toLowerCase()) || []
    const isDirector = userRoles.some(r => r.includes('director') || r.includes('super admin') || r.includes('super_admin') || r.includes('admin'))
    const isTester = userRoles.includes('tester')
    const isDeveloper = userRoles.includes('developer')

    // Permission logic
    // Directors and Testers can always edit status/notes. 
    // Others are locked if task is in a final state.
    const isLocked = !isDirector && !isTester && ['done', 'ready_for_qa', 'verified', 'failed'].includes(initialData?.status)
    const isFailed = initialData?.status === 'failed'
    
    // Fields restricted for both Dev and Tester during Edit
    const isStaffRestrict = (isDeveloper || isTester) && isEdit

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit(form)
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <div className="modal-header">
                    <h2>{isEdit ? `Edit ${title}` : `New ${title}`}</h2>
                    <button onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="split-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) 1fr', minHeight: '500px' }}>
                            <div className="history-pane" style={{ padding: '24px', background: 'rgba(0,0,0,0.1)', borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
                                <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '16px', letterSpacing: '0.05em' }}>Communication Logs</h4>
                                {isEdit ? (
                                    <QAFeedbackTrail type="task" itemId={initialData.id} allowPost={true} />
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '40px 0' }}>History will appear after task creation.</div>
                                )}
                            </div>
                            <div className="form-pane" style={{ padding: '24px', overflowY: 'auto' }}>
                                <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '16px', letterSpacing: '0.05em' }}>Task Information</h4>

                                <div className="form-group">
                                    <label className="form-label">Project</label>
                                    <select
                                        className="form-select"
                                        value={form.project_id}
                                        onChange={e => setForm(p => ({ ...p, project_id: e.target.value }))}
                                        required
                                        disabled={isLocked || isStaffRestrict}
                                    >
                                        <option value="">Select project…</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Task Title</label>
                                    <input
                                        className="form-input"
                                        value={form.title}
                                        onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                        required
                                        disabled={isLocked || isStaffRestrict}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        rows={6}
                                        value={form.description}
                                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                        style={{ resize: 'vertical' }}
                                        disabled={isLocked || isStaffRestrict}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Assigned To</label>
                                        <select
                                            className="form-select"
                                            value={form.assigned_to}
                                            onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))}
                                            disabled={!isDirector || isLocked}
                                        >
                                            {isDirector ? (
                                                <>
                                                    <option value="">Unassigned</option>
                                                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                                                </>
                                            ) : (
                                                <option value={currentUser?.id}>{currentUser?.full_name}</option>
                                            )}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Est. / Actual Hours</label>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                className="form-input"
                                                value={form.estimated_hours}
                                                onChange={e => setForm(p => ({ ...p, estimated_hours: e.target.value }))}
                                                disabled={isLocked || isStaffRestrict}
                                                placeholder="Est."
                                                title="Estimated Hours"
                                            />
                                            <span style={{ color: 'var(--text-dim)' }}>/</span>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                className="form-input"
                                                value={form.actual_hours}
                                                onChange={e => setForm(p => ({ ...p, actual_hours: e.target.value }))}
                                                disabled={isLocked && !isFailed && !isTester && !isDeveloper}
                                                placeholder="Act."
                                                title="Actual Hours"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            value={form.status}
                                            onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                                            disabled={isLocked && !isFailed && !isTester && !isDeveloper}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="done">Done (Submit for QA)</option>
                                            {(isDirector || isTester) && (
                                                <>
                                                    <option value="verified">Verified</option>
                                                    <option value="failed">Failed</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Priority</label>
                                        <select
                                            className="form-select"
                                            value={form.priority}
                                            onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                                            disabled={isLocked && !isFailed && !isTester && !isDeveloper}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginTop: '14px' }}>
                                    <label className="form-label">Due Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={form.end_time}
                                        onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
                                        disabled={isLocked && !isFailed && !isTester && !isDeveloper}
                                    />
                                </div>

                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                .split-body { min-height: 500px; }
                .history-pane { overflow-y: auto; }
                .form-pane { overflow-y: auto; }
            `}</style>
        </div>
    )
}
