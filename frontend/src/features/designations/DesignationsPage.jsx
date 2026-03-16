import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Briefcase } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import DataTable from '../../components/common/DataTable'

export default function DesignationsPage() {
    const [designations, setDesignations] = useState([])
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null)
    const [selected, setSelected] = useState(null)
    const [form, setForm] = useState({ name: '', description: '', department_id: '' })

    const load = () => {
        setLoading(true)
        Promise.all([
            api.get('/designations'),
            api.get('/departments')
        ])
            .then(([dsgRes, deptRes]) => {
                setDesignations(dsgRes.data.data)
                setDepartments(deptRes.data.data)
            })
            .catch(err => toast.error(err.message))
            .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    const openCreate = () => { setForm({ name: '', description: '', department_id: '' }); setModal('create') }
    const openEdit = (d) => {
        setSelected(d)
        setForm({
            name: d.name,
            description: d.description || '',
            department_id: d.department_id || ''
        })
        setModal('edit')
    }
    const openDelete = (d) => { setSelected(d); setModal('delete') }
    const closeModal = () => { setModal(null); setSelected(null) }

    const handleCreate = async (e) => {
        e.preventDefault();
        if (/^\d+$/.test(form.name)) return toast.error('Designation name cannot be purely numeric');
        setSaving(true)
        try {
            await api.post('/designations', form);
            toast.success('Designation created');
            load();
            closeModal()
        }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleEdit = async (e) => {
        e.preventDefault();
        if (/^\d+$/.test(form.name)) return toast.error('Designation name cannot be purely numeric');
        setSaving(true)
        try {
            await api.patch(`/designations/${selected.id}`, form);
            toast.success('Designation updated');
            load();
            closeModal()
        }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleDelete = async () => {
        setSaving(true)
        try {
            await api.delete(`/designations/${selected.id}`);
            toast.success('Designation deleted');
            load();
            closeModal()
        }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

    const formFields = (
        <>
            <div className="form-group">
                <label className="form-label">Designation Name</label>
                <input className="form-input" value={form.name} onChange={f('name')} placeholder="e.g. Senior Developer" required />
            </div>
            <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-select" value={form.department_id} onChange={f('department_id')}>
                    <option value="">No Department</option>
                    {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} value={form.description} onChange={f('description')} placeholder="Optional description…" style={{ resize: 'vertical' }} />
            </div>
        </>
    )

    const columns = [
        { label: 'Name', key: 'name', sortable: true, render: (val) => <div style={{ fontWeight: 600 }}>{val}</div> },
        {
            label: 'Department',
            key: 'department.name',
            sortable: true,
            render: (val) => val ? (
                <div className="badge badge-blue">{val}</div>
            ) : <span style={{ opacity: 0.3 }}>--</span>
        },
        { label: 'Description', key: 'description', render: (val) => <div style={{ color: 'var(--text-dim)', fontSize: '13px' }}>{val || '--'}</div> },
        {
            label: 'Actions',
            key: 'id',
            render: (_, d) => (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(d)}><Pencil size={14} /></button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => openDelete(d)}><Trash2 size={14} /></button>
                </div>
            )
        }
    ];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Designations</h1>
                    <p>Manage employee job titles and roles</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />New Designation</button>
            </div>

            <div className="card polished-card" style={{ padding: 0 }}>
                <DataTable
                    data={designations}
                    columns={columns}
                    fileName="designations"
                    loading={loading}
                    emptyMessage="No designations found. Create the first one."
                    onAdd={openCreate}
                />
            </div>

            {(modal === 'create' || modal === 'edit') && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">{modal === 'create' ? 'New Designation' : 'Edit Designation'}</h2>
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
                        <div className="modal-header"><h2 className="modal-title">Delete Designation</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <div className="modal-body">
                            <p style={{ fontSize: 14 }}>Delete <strong>{selected.name}</strong>? Employees assigned this designation will not be removed.</p>
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
