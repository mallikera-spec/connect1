import { useEffect, useState } from 'react'
import { Plus, Trash2, X, Download, FileText } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function PermissionsPage() {
    const [permissions, setPermissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null)
    const [selected, setSelected] = useState(null)
    const [form, setForm] = useState({ name: '', description: '' })

    const load = () => {
        setLoading(true)
        api.get('/permissions')
            .then(r => setPermissions(r.data.data))
            .catch(err => toast.error(err.message))
            .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    const openCreate = () => { setForm({ name: '', description: '' }); setModal('create') }
    const openDelete = (p) => { setSelected(p); setModal('delete') }
    const closeModal = () => { setModal(null); setSelected(null) }

    const handleCreate = async (e) => {
        e.preventDefault(); setSaving(true)
        try { await api.post('/permissions', form); toast.success('Permission created'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleDelete = async () => {
        setSaving(true)
        try { await api.delete(`/permissions/${selected.id}`); toast.success('Permission deleted'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleExportCSV = () => {
        if (!permissions.length) return
        const headers = ['Name', 'Description']
        const rows = permissions.map(p => [`"${p.name}"`, `"${p.description || ''}"`])
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
        const link = document.createElement('a')
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
        link.download = `permissions_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }

    const handleExportPDF = () => window.print()

    return (
        <div>
            <div className="page-header">
                <div><h1>Permissions</h1><p>Define granular permission slugs for your RBAC system</p></div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button className="btn btn-outline btn-sm" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Download size={14} /> CSV</button>
                    <button className="btn btn-outline btn-sm" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={14} /> PDF</button>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />New Permission</button>
                </div>
            </div>

            <div className="table-wrapper">
                {loading ? <div className="page-loader"><div className="spinner" /></div> : (
                    <table>
                        <thead><tr><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
                        <tbody>
                            {permissions.length === 0 && <tr><td colSpan={3}><div className="empty-state"><p>No permissions yet</p></div></td></tr>}
                            {permissions.map(p => (
                                <tr key={p.id}>
                                    <td><code style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--accent-light)', padding: '2px 8px', borderRadius: 5, fontSize: 12 }}>{p.name}</code></td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{p.description || '—'}</td>
                                    <td>
                                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => openDelete(p)}><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modal === 'create' && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal">
                        <div className="modal-header"><h2 className="modal-title">New Permission</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Permission Name <span style={{ color: 'var(--text-dim)' }}>(lowercase_underscore)</span></label>
                                    <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. create_user" pattern="[a-z_]+" title="Lowercase letters and underscores only" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <input className="form-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What this permission allows" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modal === 'delete' && selected && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal" style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h2 className="modal-title">Delete Permission</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <div className="modal-body"><p style={{ fontSize: 14 }}>Delete permission <strong>{selected.name}</strong>? It will be removed from all roles.</p></div>
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
