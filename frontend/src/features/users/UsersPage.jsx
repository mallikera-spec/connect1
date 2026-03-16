import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, UserPlus, ShieldPlus, X, Users, FileText, Calendar, Eye, EyeOff } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import DataTable from '../../components/common/DataTable'

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
                    <form onSubmit={handleAssign} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginTop: 20 }}>
                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                            <label className="form-label">Add Role</label>
                            <select className="form-select" value={roleId} onChange={e => setRoleId(e.target.value)}>
                                <option value="">{availableRoles.length === 0 ? 'All roles assigned' : 'Choose a role…'}</option>
                                {availableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={assigning || !roleId}>
                            {assigning ? 'Assigning...' : 'Assign'}
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
                            {saving ? 'Saving...' : 'Save Permissions'}
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
    const [showPassword, setShowPassword] = useState(false)

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
            window.history.replaceState({}, document.title);
        }
    }, [location.state])

    const openCreate = () => { setForm(EMPTY); setShowPassword(false); setModal('create') }
    const openRole = (u) => { setSelected(u); setModal('role') }
    const openPerms = (u) => { setSelected(u); setModal('perms') }
    const openDelete = (u) => { setSelected(u); setModal('delete') }
    const closeModal = () => { setModal(null); setSelected(null) }

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!/^[a-zA-Z\s]+$/.test(form.full_name)) {
            return toast.error('Full name can only contain letters and spaces');
        }
        setSaving(true)
        try { await api.post('/users', form); toast.success('User created'); load(); closeModal() }
        catch (err) { toast.error(err.response?.data?.message || err.message) }
        finally { setSaving(false) }
    }

    const handleDelete = async () => {
        setSaving(true)
        try { await api.delete(`/users/${selected.id}`); toast.success('User deleted'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))


    const columns = useMemo(() => [
        {
            label: 'Name',
            key: 'full_name',
            width: '200px',
            render: (val, u) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700 }}>{val}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{u.email}</span>
                </div>
            )
        },
        {
            label: 'Organization',
            key: 'department',
            width: '180px',
            render: (val, u) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{val || '—'}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{u.designation || '—'}</span>
                </div>
            )
        },
        {
            label: 'Access Roles',
            key: 'roles',
            render: (roles) => (
                roles?.length > 0
                    ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {roles.map(r => <span key={r} className="badge badge-purple" style={{ fontSize: 10 }}>{r}</span>)}
                    </div>
                    : <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>No roles</span>
            )
        },
        {
            label: 'Actions',
            key: 'id',
            width: '200px',
            sticky: true,
            render: (_, u) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    {hasPermission('assign_role') && (
                        <button className="btn btn-icon btn-sm btn-ghost" onClick={() => openRole(u)} title="Roles"><UserPlus size={14} /></button>
                    )}
                    {hasPermission('manage_user_permissions') && (
                        <button className="btn btn-icon btn-sm btn-ghost" onClick={() => openPerms(u)} title="Perms"><ShieldPlus size={14} /></button>
                    )}
                    <button className="btn btn-icon btn-sm btn-ghost" onClick={() => navigate(`/profile/${u.id}`)} title="Profile"><FileText size={14} /></button>
                    <button className="btn btn-icon btn-sm btn-ghost" onClick={() => navigate(`/timesheet`, { state: { viewUserId: u.id } })} title="Timesheets"><Calendar size={14} /></button>
                    {hasPermission('delete_user') && (
                        <button className="btn btn-icon btn-sm btn-danger-ghost" onClick={() => openDelete(u)} title="Delete"><Trash2 size={14} /></button>
                    )}
                </div>
            )
        }
    ], [hasPermission, navigate]);

    return (
        <div className="users-page">
            <div className="page-header">
                <div>
                    <h1>Employee Management</h1>
                    <p>Directory of all staff, roles, and system access.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    {hasPermission('create_user') && (
                        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Employee</button>
                    )}
                </div>
            </div>


            <div className="card table-card">
                <DataTable
                    data={users}
                    columns={columns}
                    searchTerm={search}
                    onSearchChange={setSearch}
                    fileName="employees-list"
                    loading={loading}
                    onAdd={openCreate}
                    canAdd={hasPermission('create_user')}
                />
            </div>

            {modal === 'create' && (
                <Modal title="New Employee" onClose={closeModal} onSubmit={handleCreate} loading={saving} saveLabel="Create">
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.full_name} onChange={f('full_name')} required /></div>
                        <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={f('email')} required /></div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input type={showPassword ? 'text' : 'password'} className="form-input" value={form.password} onChange={f('password')} required minLength={8} style={{ paddingRight: '40px' }} />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="show-password-btn"
                                tabIndex="-1"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div className="form-group"><label className="form-label">Date of Joining</label><input type="date" className="form-input" value={form.date_of_joining} onChange={f('date_of_joining')} required /></div>
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                        <div className="modal-header">
                            <h2 className="modal-title">Delete Employee</h2>
                            <button className="btn-icon" onClick={closeModal}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <p>This will permanently delete <strong>{selected.full_name}</strong> and revoke all system access.</p>
                            <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>Warning: This action cannot be undone.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete Employee'}</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .users-page { padding: 8px; }
                .show-password-btn {
                    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
                    background: none; border: none; color: var(--text-dim); cursor: pointer;
                    display: flex; align-items: center; justify-content: center; padding: 0;
                }
                .btn-danger-ghost:hover { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
                .badge-purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; padding: 3px 8px; border-radius: 6px; font-weight: 700; }
            `}</style>
        </div>
    )
}
