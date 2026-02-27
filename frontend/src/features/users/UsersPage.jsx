import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, UserPlus, ShieldPlus, X, Users, FileText, Calendar } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

function Modal({ title, onClose, onSubmit, loading, children, saveLabel = 'Save' }) {
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
                            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : saveLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function RoleModal({ user, roles, onClose, onSaved }) {
    const [currentRoles, setCurrentRoles] = useState([])
    const [roleId, setRoleId] = useState('')
    const [loading, setLoading] = useState(true)
    const [assigning, setAssigning] = useState(false)
    const [removingId, setRemovingId] = useState(null)

    const loadCurrentRoles = () => {
        api.get(`/user-roles/${user.id}`)
            .then(r => setCurrentRoles(r.data.data))
            .catch(err => toast.error(err.message))
            .finally(() => setLoading(false))
    }
    useEffect(() => { loadCurrentRoles() }, [user.id])

    const assignedIds = currentRoles.map(r => r.id)
    const availableRoles = roles.filter(r => !assignedIds.includes(r.id))

    const handleAssign = async (e) => {
        e.preventDefault()
        if (!roleId) return
        setAssigning(true)
        try {
            await api.post('/user-roles', { user_id: user.id, role_id: roleId })
            toast.success('Role assigned'); setRoleId(''); loadCurrentRoles(); onSaved()
        } catch (err) { toast.error(err.message) }
        finally { setAssigning(false) }
    }
    const handleRemove = async (rid) => {
        setRemovingId(rid)
        try {
            await api.delete('/user-roles', { data: { user_id: user.id, role_id: rid } })
            toast.success('Role removed'); loadCurrentRoles(); onSaved()
        } catch (err) { toast.error(err.message) }
        finally { setRemovingId(null) }
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">Manage Roles — {user.full_name}</h2>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div>
                        <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Current Roles</label>
                        {loading ? <div className="spinner" style={{ width: 18, height: 18, margin: '8px auto' }} /> :
                            currentRoles.length === 0
                                ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No roles assigned yet.</p>
                                : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {currentRoles.map(r => (
                                        <div key={r.id} className="role-tag">
                                            <span>{r.name}</span>
                                            <button className="role-tag-remove" onClick={() => handleRemove(r.id)} disabled={removingId === r.id} title="Remove role">
                                                {removingId === r.id ? <span className="spinner" style={{ width: 10, height: 10 }} /> : <X size={11} />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                        }
                    </div>
                    <form onSubmit={handleAssign} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Add Role</label>
                            <select className="form-select" value={roleId} onChange={e => setRoleId(e.target.value)}>
                                <option value="">{availableRoles.length === 0 ? 'All roles assigned' : 'Choose a role…'}</option>
                                {availableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={assigning || !roleId} style={{ marginBottom: 1 }}>
                            {assigning ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Assign'}
                        </button>
                    </form>
                </div>
                <div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Close</button></div>
            </div>
        </div>
    )
}

function UserPermissionsModal({ user, allPermissions, onClose }) {
    const [assigned, setAssigned] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        api.get(`/user-permissions/${user.id}`)
            .then(r => setAssigned(r.data.data.map(p => p.id)))
            .catch(err => toast.error(err.message))
            .finally(() => setLoading(false))
    }, [user.id])

    const toggle = (permId) => setAssigned(prev => prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId])

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true)
        try {
            const { data } = await api.get(`/user-permissions/${user.id}`)
            const currentIds = data.data.map(p => p.id)
            const toAdd = assigned.filter(id => !currentIds.includes(id))
            const toRemove = currentIds.filter(id => !assigned.includes(id))
            await Promise.all([
                ...toAdd.map(pid => api.post('/user-permissions', { user_id: user.id, permission_id: pid })),
                ...toRemove.map(pid => api.delete('/user-permissions', { data: { user_id: user.id, permission_id: pid } })),
            ])
            toast.success('Permissions updated'); onClose()
        } catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <div className="modal-header">
                    <h2 className="modal-title">User Permissions — {user.full_name}</h2>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSave}>
                    <div className="modal-body">
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                            Assign permissions directly to this user (in addition to their role permissions).
                        </p>
                        {loading ? <div className="page-loader"><div className="spinner" /></div> : (
                            <div className="permission-grid">
                                {allPermissions.map(p => (
                                    <label key={p.id} className={`perm-check-item${assigned.includes(p.id) ? ' selected' : ''}`}>
                                        <input type="checkbox" checked={assigned.includes(p.id)} onChange={() => toggle(p.id)} />
                                        <div>
                                            <code style={{ fontSize: 12, display: 'block' }}>{p.name}</code>
                                            {p.description && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{p.description}</span>}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
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

const EMPTY = { full_name: '', email: '', password: '', department: '', designation: '', date_of_joining: '' }

export default function UsersPage() {
    const { hasPermission } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [users, setUsers] = useState([])
    const [roles, setRoles] = useState([])
    const [permissions, setPermissions] = useState([])
    const [departments, setDepartments] = useState([])
    const [designations, setDesignations] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null)
    const [selected, setSelected] = useState(null)
    const [form, setForm] = useState(EMPTY)

    const load = () => {
        setLoading(true)
        Promise.all([
            api.get('/users'),
            api.get('/roles'),
            api.get('/permissions'),
            api.get('/departments'),
            api.get('/designations'),
        ])
            .then(([u, r, p, d, dsg]) => {
                setUsers(u.data.data)
                setRoles(r.data.data)
                setPermissions(p.data.data)
                setDepartments(d.data.data)
                setDesignations(dsg.data.data)
            })
            .catch(err => toast.error(err.message))
            .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    useEffect(() => {
        if (location.state?.openCreateModal) {
            openCreate();
            // Clear state to avoid reopening on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state])

    const openCreate = () => { setForm(EMPTY); setModal('create') }
    const openEdit = (u) => navigate(`/profile/${u.id}`)
    const openRole = (u) => { setSelected(u); setModal('role') }
    const openPerms = (u) => { setSelected(u); setModal('perms') }
    const openDelete = (u) => { setSelected(u); setModal('delete') }
    const closeModal = () => { setModal(null); setSelected(null) }

    const handleCreate = async (e) => {
        e.preventDefault(); setSaving(true)
        try { await api.post('/users', form); toast.success('User created'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleDelete = async () => {
        setSaving(true)
        try { await api.delete(`/users/${selected.id}`); toast.success('User deleted'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

    const filtered = users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div>
            <div className="page-header">
                <div><h1>Employees</h1><p>Manage employees, roles and access</p></div>
                {hasPermission('manage_employees') && (
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />New Employee</button>
                )}
            </div>

            <div className="table-wrapper">
                <div className="table-toolbar">
                    <div className="search-input-wrap">
                        <Search size={15} className="search-icon" />
                        <input className="form-input" placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
                    </div>
                </div>

                {loading ? <div className="page-loader"><div className="spinner" /></div> : (
                    <table>
                        <thead><tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Designation</th>
                            <th>Roles</th>
                            <th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr><td colSpan={6}><div className="empty-state"><p>No users found</p></div></td></tr>
                            )}
                            {filtered.map(u => (
                                <tr key={u.id}>
                                    <td><strong>{u.full_name}</strong></td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email}</td>
                                    <td style={{ fontSize: 13 }}>{u.department || <span style={{ color: 'var(--text-dim)' }}>—</span>}</td>
                                    <td style={{ fontSize: 13 }}>{u.designation || <span style={{ color: 'var(--text-dim)' }}>—</span>}</td>
                                    <td>
                                        {u.roles?.length > 0
                                            ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                {u.roles.map(r => <span key={r} className="badge badge-purple">{r}</span>)}
                                            </div>
                                            : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>No roles</span>
                                        }
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            {hasPermission('assign_role') && (
                                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openRole(u)} title="Manage Roles"><UserPlus size={14} /></button>
                                            )}
                                            {hasPermission('manage_user_permissions') && (
                                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openPerms(u)} title="Manage Permissions"><ShieldPlus size={14} /></button>
                                            )}
                                            {hasPermission('view_reports') && (
                                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate(`/profile/${u.id}`)} title="View Stats & Activity"><FileText size={14} /></button>
                                            )}
                                            {hasPermission('view_timesheets') && (
                                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate(`/timesheet?userId=${u.id}`)} title="View Timesheets"><Calendar size={14} /></button>
                                            )}
                                            {hasPermission('manage_employees') && (
                                                <>
                                                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(u)} title="Edit"><Pencil size={14} /></button>
                                                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => openDelete(u)} title="Delete"><Trash2 size={14} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modal === 'create' && (
                <Modal title="New Employee" onClose={closeModal} onSubmit={handleCreate} loading={saving} saveLabel="Create">
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.full_name} onChange={f('full_name')} required /></div>
                        <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={f('email')} required /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Password</label><input type="password" className="form-input" value={form.password} onChange={f('password')} required minLength={8} /></div>
                    <div className="form-group"><label className="form-label">Date of Joining</label><input type="date" className="form-input" value={form.date_of_joining} onChange={f('date_of_joining')} required /></div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <select className="form-select" value={form.department} onChange={e => { f('department')(e); setForm(p => ({ ...p, designation: '' })) }}>
                                <option value="">No department</option>
                                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Designation</label>
                            <select className="form-select" value={form.designation} onChange={f('designation')}>
                                <option value="">No designation</option>
                                {designations.filter(dsg => !form.department || !dsg.department || dsg.department.name === form.department).map(dsg => <option key={dsg.id} value={dsg.name}>{dsg.name}</option>)}
                            </select>
                        </div>
                    </div>
                </Modal>
            )}

            {modal === 'role' && selected && <RoleModal user={selected} roles={roles} onClose={closeModal} onSaved={load} />}
            {modal === 'perms' && selected && <UserPermissionsModal user={selected} allPermissions={permissions} onClose={closeModal} />}

            {modal === 'delete' && selected && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal" style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h2 className="modal-title">Delete Employee</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <div className="modal-body"><p style={{ fontSize: 14 }}>This will permanently delete <strong>{selected.full_name}</strong> and revoke all access.</p></div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete Employee'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
