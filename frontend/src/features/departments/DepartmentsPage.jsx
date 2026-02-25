import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Building2 } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null)
    const [selected, setSelected] = useState(null)
    const [form, setForm] = useState({ name: '', description: '' })

    const load = () => {
        setLoading(true)
        api.get('/departments')
            .then(r => setDepartments(r.data.data))
            .catch(err => toast.error(err.message))
            .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    const openCreate = () => { setForm({ name: '', description: '' }); setModal('create') }
    const openEdit = (d) => { setSelected(d); setForm({ name: d.name, description: d.description || '' }); setModal('edit') }
    const openDelete = (d) => { setSelected(d); setModal('delete') }
    const closeModal = () => { setModal(null); setSelected(null) }

    const handleCreate = async (e) => {
        e.preventDefault(); setSaving(true)
        try { await api.post('/departments', form); toast.success('Department created'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleEdit = async (e) => {
        e.preventDefault(); setSaving(true)
        try { await api.patch(`/departments/${selected.id}`, form); toast.success('Department updated'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleDelete = async () => {
        setSaving(true)
        try { await api.delete(`/departments/${selected.id}`); toast.success('Department deleted'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

    const formFields = (
        <>
            <div className="form-group">
                <label className="form-label">Department Name</label>
                <input className="form-input" value={form.name} onChange={f('name')} placeholder="e.g. Engineering" required />
            </div>
            <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} value={form.description} onChange={f('description')} placeholder="Optional description…" style={{ resize: 'vertical' }} />
            </div>
        </>
    )

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Departments</h1>
                    <p>Manage the departments of your organization</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />New Department</button>
            </div>

            {loading ? <div className="page-loader"><div className="spinner" /></div> : (
                <div className="dept-grid">
                    {departments.length === 0 && (
                        <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                            <Building2 size={40} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                            <p>No departments yet. Create the first one.</p>
                        </div>
                    )}
                    {departments.map(d => (
                        <div key={d.id} className="card dept-card">
                            <div className="dept-card-header">
                                <div className="dept-icon"><Building2 size={20} /></div>
                                <div className="actions-cell">
                                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(d)}><Pencil size={14} /></button>
                                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => openDelete(d)}><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <h3 style={{ fontWeight: 600, marginBottom: 4 }}>{d.name}</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{d.description || 'No description provided'}</p>
                        </div>
                    ))}
                </div>
            )}

            {(modal === 'create' || modal === 'edit') && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">{modal === 'create' ? 'New Department' : 'Edit Department'}</h2>
                            <button className="btn-icon" onClick={closeModal}><X size={18} /></button>
                        </div>
                        <form onSubmit={modal === 'create' ? handleCreate : handleEdit}>
                            <div className="modal-body">{formFields}</div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : modal === 'create' ? 'Create' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modal === 'delete' && selected && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal" style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h2 className="modal-title">Delete Department</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <div className="modal-body">
                            <p style={{ fontSize: 14 }}>Delete <strong>{selected.name}</strong>? Users assigned to this department will not be removed.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
