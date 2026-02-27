import { useState, useEffect } from 'react'
import { X, Save, Clock, Calendar, FileText } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function EditEntryModal({ entry, myProjects, onClose, onSaved }) {
    const [title, setTitle] = useState(entry.title || '')
    const [projectId, setProjectId] = useState(entry.project_id || '')
    const [time, setTime] = useState(entry.hours_spent || '00:00')
    const [notes, setNotes] = useState(entry.notes || '')
    const [saving, setSaving] = useState(false)

    const handleSave = async (e) => {
        e.preventDefault()
        if (!title.trim() || !projectId || !notes.trim() || !time || time === '00:00') {
            return toast.error('Please fill all mandatory fields.')
        }

        setSaving(true)
        try {
            const res = await api.patch(`/timesheets/entries/${entry.id}`, {
                title: title.trim(),
                project_id: projectId,
                hours_spent: time,
                notes: notes.trim()
            })
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
                <form onSubmit={handleSave} className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Project</label>
                        <select
                            className="form-select"
                            value={projectId}
                            onChange={e => setProjectId(e.target.value)}
                            required
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
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Notes</label>
                        <textarea
                            className="form-textarea"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Brief details..."
                            required
                        />
                    </div>

                    <div className="modal-footer" style={{ marginTop: 20 }}>
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <span className="spinner-sm" /> : <><Save size={16} /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
