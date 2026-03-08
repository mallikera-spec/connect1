import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Key, X, Download, FileText } from 'lucide-react'
import api from '../../lib/api'
import DataTable from '../../components/common/DataTable'
import toast from 'react-hot-toast'

function Modal({ title, onClose, onSubmit, loading, children }) {
    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="modal-body">{children}</div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function PermissionsModal({ role, allPermissions, onClose, onSaved }) {
    const assigned = new Set((role.role_permissions || []).map(rp => rp.permission?.id).filter(Boolean))
    const [selected, setSelected] = useState(new Set(assigned))
    const [saving, setSaving] = useState(false)

    const toggle = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const toAdd = [...selected].filter(id => !assigned.has(id))
            const toRemove = [...assigned].filter(id => !selected.has(id))
            await Promise.all([
                ...toAdd.map(pid => api.post('/role-permissions', { role_id: role.id, permission_id: pid })),
                ...toRemove.map(pid => api.delete('/role-permissions', { data: { role_id: role.id, permission_id: pid } })),
            ])
            toast.success('Permissions updated')
            onSaved()
            onClose()
        } catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <div className="modal-header">
                    <h2 className="modal-title">Permissions — {role.name}</h2>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSave}>
                    <div className="modal-body">
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Check permissions to assign them to this role.</p>
                        <div className="checkbox-list">
                            {allPermissions.map(p => (
                                <div key={p.id} className="checkbox-item" onClick={() => toggle(p.id)}>
                                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} onClick={e => e.stopPropagation()} />
                                    <label>
                                        <div>{p.name}</div>
                                        {p.description && <div className="perm-desc">{p.description}</div>}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Save Permissions'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const EMPTY = { name: '', description: '' }

export default function RolesPage() {
    const [roles, setRoles] = useState([])
    const [allPerms, setAllPerms] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null)
    const [selected, setSelected] = useState(null)
    const [form, setForm] = useState(EMPTY)

    const load = () => {
        setLoading(true)
        Promise.all([api.get('/roles'), api.get('/permissions')])
            .then(([r, p]) => { setRoles(r.data.data); setAllPerms(p.data.data) })
            .catch(err => toast.error(err.message))
            .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    const openCreate = () => { setForm(EMPTY); setModal('create') }
    const openEdit = (r) => { setSelected(r); setForm({ name: r.name, description: r.description || '' }); setModal('edit') }
    const openPerms = (r) => { setSelected(r); setModal('perms') }
    const openDelete = (r) => { setSelected(r); setModal('delete') }
    const closeModal = () => { setModal(null); setSelected(null) }

    const handleCreate = async (e) => {
        e.preventDefault(); setSaving(true)
        try { await api.post('/roles', form); toast.success('Role created'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleEdit = async (e) => {
        e.preventDefault(); setSaving(true)
        try { await api.patch(`/roles/${selected.id}`, form); toast.success('Role updated'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleDelete = async () => {
        setSaving(true)
        try { await api.delete(`/roles/${selected.id}`); toast.success('Role deleted'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))



    return (
        <div>
            <div className="page-header">
                <div><h1>Roles</h1><p>Define roles and their permission sets</p></div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />New Role</button>
                </div>
            </div>

            <div className="table-wrapper">
                <DataTable
                    data={roles}
                    loading={loading}
                    fileName="roles"
                    columns={[
                        { label: 'Role', key: 'name' },
                        { label: 'Description', key: 'description' },
                        { label: 'Permissions', key: 'permissions_count', sortKey: 'role_permissions.length' },
                        { label: 'Actions', key: 'actions' }
                    ]}
                    renderRow={(r, idx) => (
                        <tr key={r.id}>
                            <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: 12 }}>{idx + 1}</td>
                            <td style={{ padding: '12px 16px' }}><strong>{r.name}</strong></td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13 }}>{r.description || '—'}</td>
                            <td style={{ padding: '12px 16px' }}>
                                <span className="badge badge-purple">{(r.role_permissions || []).length} permissions</span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <div className="actions-cell">
                                    <button className="btn btn-ghost btn-sm" onClick={() => openPerms(r)}><Key size={14} />Permissions</button>
                                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => openDelete(r)}><Trash2 size={14} /></button>
                                </div>
                            </td>
                        </tr>
                    )}
                />
            </div>

            {modal === 'create' && (
                <Modal title="New Role" onClose={closeModal} onSubmit={handleCreate} loading={saving}>
                    <div className="form-group"><label className="form-label">Role Name</label><input className="form-input" value={form.name} onChange={f('name')} required placeholder="e.g. project_manager" /></div>
                    <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={f('description')} placeholder="Optional description" /></div>
                </Modal>
            )}

            {modal === 'edit' && (
                <Modal title="Edit Role" onClose={closeModal} onSubmit={handleEdit} loading={saving}>
                    <div className="form-group"><label className="form-label">Role Name</label><input className="form-input" value={form.name} onChange={f('name')} required /></div>
                    <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={f('description')} /></div>
                </Modal>
            )}

            {modal === 'perms' && selected && (
                <PermissionsModal role={selected} allPermissions={allPerms} onClose={closeModal} onSaved={load} />
            )}

            {modal === 'delete' && selected && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal" style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h2 className="modal-title">Delete Role</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <div className="modal-body"><p style={{ fontSize: 14 }}>Delete role <strong>{selected.name}</strong>? This will remove it from all users.</p></div>
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
