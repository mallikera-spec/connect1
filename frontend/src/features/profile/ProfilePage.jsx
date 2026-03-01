import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User, Phone, MapPin, Calendar, Heart, FileText, Tag, DollarSign, Save, Building2, Briefcase, ArrowLeft, Lock, Eye, EyeOff, Camera, Clock } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const SKILLS_HELP = 'Separate skills with commas (e.g. React, Node.js, SQL)'

export default function ProfilePage() {
    const { userId } = useParams()
    const navigate = useNavigate()
    const { user: currentUser, hasPermission } = useAuth()
    const [profile, setProfile] = useState(null)
    const [form, setForm] = useState({})
    const [ctcTarget, setCtcTarget] = useState({ userId: '', ctc: '' })
    const [allUsers, setAllUsers] = useState([])
    const [departments, setDepartments] = useState([])
    const [designations, setDesignations] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [ctcSaving, setCtcSaving] = useState(false)
    const [report, setReport] = useState(null)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)

    // Change password state
    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
    const [showPw, setShowPw] = useState(false)
    const [pwSaving, setPwSaving] = useState(false)

    const isAdmin = hasPermission('manage_employees')
    const isEditingOther = !!userId && userId !== currentUser?.id
    const targetId = userId || currentUser?.id

    const loadProfile = () => {
        setLoading(true)
        const profileUrl = isEditingOther ? `/profile/${userId}` : '/profile/me'
        const reqs = [api.get(profileUrl)]

        if (isAdmin) {
            reqs.push(api.get('/users'))
            reqs.push(api.get('/departments'))
            reqs.push(api.get('/designations'))
            reqs.push(api.get(`/reports/user/${targetId}`))
        }

        Promise.all(reqs)
            .then((results) => {
                const [profileRes, usersRes, deptRes, dsgRes, reportRes] = results
                const p = profileRes.data.data
                setProfile(p)
                setForm({
                    full_name: p.full_name || '',
                    phone: p.phone || '',
                    address: p.address || '',
                    date_of_birth: p.date_of_birth || '',
                    emergency_contact: p.emergency_contact || '',
                    bio: p.bio || '',
                    skills: p.skills ? p.skills.join(', ') : '',
                    department: p.department || '',
                    designation: p.designation || '',
                    date_of_joining: p.date_of_joining || '',
                    ctc: p.ctc || '',
                    alternate_phone: p.alternate_phone || '',
                    blood_group: p.blood_group || '',
                    education_qualification: p.education_qualification || '',
                    x_year: p.x_year || '',
                    xii_year: p.xii_year || '',
                    bank_name: p.bank_name || '',
                    bank_ifsc: p.bank_ifsc || '',
                    bank_account_no: p.bank_account_no || '',
                    pan_number: p.pan_number || '',
                    aadhar_number: p.aadhar_number || '',
                })
                if (usersRes) setAllUsers(usersRes.data.data)
                if (deptRes) setDepartments(deptRes.data.data)
                if (dsgRes) setDesignations(dsgRes.data.data)
                if (reportRes) setReport(reportRes.data.data)

                if (isEditingOther) {
                    setCtcTarget({ userId: p.id, ctc: p.ctc || '' })
                }
            })
            .catch(err => {
                toast.error(err.message)
                if (isEditingOther) navigate('/users')
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => { loadProfile() }, [userId])

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true)
        try {
            const payload = {
                ...form,
                skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
            }
            const updateUrl = isEditingOther ? `/profile/${userId}` : '/profile/me'
            await api.patch(updateUrl, payload)
            toast.success('Profile updated')
            loadProfile()
        } catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleCTCSave = async (e) => {
        e.preventDefault(); setCtcSaving(true)
        try {
            await api.patch(`/profile/${ctcTarget.userId}/ctc`, { ctc: Number(ctcTarget.ctc) })
            toast.success('CTC updated successfully')
        } catch (err) { toast.error(err.message) }
        finally { setCtcSaving(false) }
    }

    const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (pwForm.next.length < 6) return toast.error('Password must be at least 6 characters')
        if (pwForm.next !== pwForm.confirm) return toast.error('Passwords do not match')
        setPwSaving(true)
        try {
            // Re-authenticate with current password first
            const { error: signInErr } = await supabase.auth.signInWithPassword({
                email: currentUser.email,
                password: pwForm.current,
            })
            if (signInErr) { toast.error('Current password is incorrect'); return }

            const { error } = await supabase.auth.updateUser({ password: pwForm.next })
            if (error) throw error
            toast.success('Password changed successfully!')
            setPwForm({ current: '', next: '', confirm: '' })
        } catch (err) {
            toast.error(err.message || 'Failed to change password')
        } finally {
            setPwSaving(false)
        }
    }

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            return toast.error('Please select a valid image file.')
        }
        if (file.size > 5 * 1024 * 1024) {
            return toast.error('Image size should be less than 5MB.')
        }

        setUploadingAvatar(true)
        const toastId = toast.loading('Uploading avatar...')

        const formData = new FormData()
        formData.append('avatar', file)

        try {
            const res = await api.post(`/users/avatar/${targetId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setProfile(p => ({ ...p, avatar_url: res.data.data.avatar_url }))
            toast.success('Avatar updated successfully!', { id: toastId })

            // If the user updated their own profile, we should reload the whole window 
            // so the sidebar picks up the new image context immediately
            if (!isEditingOther) {
                window.location.reload()
            }
        } catch (error) {
            toast.error(error.message || 'Failed to upload avatar', { id: toastId })
        } finally {
            setUploadingAvatar(false)
        }
    }

    if (loading) return <div className="page-loader"><div className="spinner" /></div>

    return (
        <div style={{ width: '100%', paddingBottom: 64 }}>
            <div className="page-header" style={{ alignItems: 'center', gap: 12 }}>
                {isEditingOther && (
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/users')} style={{ marginRight: 8 }}>
                        <ArrowLeft size={18} />
                    </button>
                )}

                <div style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 'bold', flexShrink: 0, overflow: 'hidden' }}>
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        profile?.full_name?.charAt(0).toUpperCase() || 'U'
                    )}

                    {/* Hover Overlay for Upload */}
                    <label style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, cursor: uploadingAvatar ? 'wait' : 'pointer', transition: 'opacity 0.2s', className: 'avatar-hover-overlay' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                    >
                        <Camera size={20} color="#fff" />
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} disabled={uploadingAvatar} />
                    </label>
                </div>

                <div>
                    <h1>{isEditingOther ? `Edit Profile: ${profile?.full_name}` : 'My Profile'}</h1>
                    <p>{isEditingOther ? `Managing details for ${profile?.email}` : 'View and update your personal information'}</p>
                </div>
            </div>

            {isAdmin && report && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div>
                            <div className="stat-label">Projects</div>
                            <div className="stat-value" style={{ color: 'var(--accent)' }}>{report.total_projects}</div>
                        </div>
                        <div className="stat-icon" style={{ background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)' }}>
                            <Briefcase size={24} />
                        </div>
                    </div>
                    <div className="stat-card">
                        <div>
                            <div className="stat-label">Total Tasks</div>
                            <div className="stat-value" style={{ color: 'var(--info)' }}>{report.total_tasks}</div>
                        </div>
                        <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
                            <FileText size={24} />
                        </div>
                    </div>
                    <div className="stat-card">
                        <div>
                            <div className="stat-label">Hours Logged</div>
                            <div className="stat-value" style={{ color: 'var(--success)' }}>{report.total_hours_logged}h</div>
                        </div>
                        <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                            <Clock size={24} />
                        </div>
                    </div>
                    {isEditingOther && (
                        <div className="stat-card" style={{ cursor: 'pointer', border: '1px dashed var(--accent)', background: 'rgba(var(--accent-rgb), 0.05)' }}
                            onClick={() => navigate(`/timesheet?userId=${userId}`)}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 8 }}>
                                <Calendar size={20} style={{ color: 'var(--accent)' }} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>View Timesheets</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSave}>
                {/* Personal Info */}
                <div className="card glass-card" style={{ marginBottom: 24 }}>
                    <div className="card-header-premium">
                        <User size={18} />
                        <h3>Personal Information</h3>
                    </div>
                    <div className="card-body" style={{ padding: 24 }}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input className="form-input" value={form.full_name} onChange={f('full_name')} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label"><Phone size={13} style={{ marginRight: 4 }} /> Primary Phone</label>
                                <input className="form-input" type="tel" value={form.phone} onChange={f('phone')} placeholder="+91 0000000000" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Alternate Phone</label>
                                <input className="form-input" type="tel" value={form.alternate_phone} onChange={f('alternate_phone')} placeholder="+91 0000000000" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Blood Group</label>
                                <select className="form-select" value={form.blood_group} onChange={f('blood_group')}>
                                    <option value="">Select...</option>
                                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label"><MapPin size={13} style={{ marginRight: 4 }} />Residential Address</label>
                            <textarea className="form-textarea" rows={2} value={form.address} onChange={f('address')} style={{ resize: 'vertical' }} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label"><Calendar size={13} style={{ marginRight: 4 }} />Date of Birth</label>
                                <input className="form-input" type="date" value={form.date_of_birth} onChange={f('date_of_birth')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label"><Heart size={13} style={{ marginRight: 4 }} />Emergency Contact</label>
                                <input className="form-input" value={form.emergency_contact} onChange={f('emergency_contact')} placeholder="Name — Relation — Phone" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Educational Details */}
                <div className="card glass-card" style={{ marginBottom: 24 }}>
                    <div className="card-header-premium">
                        <Briefcase size={18} />
                        <h3>Educational Background</h3>
                    </div>
                    <div className="card-body" style={{ padding: 24 }}>
                        <div className="form-group">
                            <label className="form-label">Highest Qualification</label>
                            <input className="form-input" value={form.education_qualification} onChange={f('education_qualification')} placeholder="e.g. B.Tech in Computer Science" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">X (10TH) Passing Year</label>
                                <input className="form-input" type="number" value={form.x_year} onChange={f('x_year')} placeholder="e.g. 2012" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">XII (12TH) Passing Year</label>
                                <input className="form-input" type="number" value={form.xii_year} onChange={f('xii_year')} placeholder="e.g. 2014" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banking & Identity */}
                <div className="card glass-card" style={{ marginBottom: 24 }}>
                    <div className="card-header-premium">
                        <DollarSign size={18} />
                        <h3>Banking & Identity Details</h3>
                    </div>
                    <div className="card-body" style={{ padding: 24 }}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Bank Name</label>
                                <input className="form-input" value={form.bank_name} onChange={f('bank_name')} placeholder="e.g. HDFC Bank" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Account Number</label>
                                <input className="form-input" value={form.bank_account_no} onChange={f('bank_account_no')} placeholder="0000 0000 0000" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">IFSC Code</label>
                                <input className="form-input" value={form.bank_ifsc} onChange={f('bank_ifsc')} placeholder="IFSC000001" style={{ textTransform: 'uppercase' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">PAN Number</label>
                                <input className="form-input" value={form.pan_number} onChange={f('pan_number')} placeholder="ABCDE1234F" style={{ textTransform: 'uppercase' }} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Aadhar Number</label>
                            <input className="form-input" value={form.aadhar_number} onChange={f('aadhar_number')} placeholder="0000 0000 0000" />
                        </div>
                    </div>
                </div>

                {/* Professional Info */}
                <div className="card glass-card" style={{ marginBottom: 24 }}>
                    <div className="card-header-premium">
                        <FileText size={18} />
                        <h3>Professional Summary</h3>
                    </div>
                    <div className="card-body" style={{ padding: 24 }}>
                        <div className="form-group">
                            <label className="form-label">Bio</label>
                            <textarea className="form-textarea" rows={4} value={form.bio} onChange={f('bio')} placeholder="A short bio about yourself…" style={{ resize: 'vertical' }} />
                        </div>
                        <div className="form-group">
                            <label className="form-label"><Tag size={13} style={{ marginRight: 4 }} />Skills</label>
                            <input className="form-input" value={form.skills} onChange={f('skills')} placeholder={SKILLS_HELP} />
                            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{SKILLS_HELP}</p>
                        </div>
                    </div>
                </div>

                {/* Employment Info */}
                <div className="card glass-card" style={{ marginBottom: 24 }}>
                    <div className="card-header-premium">
                        <Building2 size={18} />
                        <h3>Employment Details</h3>
                    </div>
                    <div className="card-body" style={{ padding: 24 }}>
                        {isAdmin ? (
                            <>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Department</label>
                                        <select className="form-select" value={form.department} onChange={e => { f('department')(e); setForm(p => ({ ...p, designation: '' })) }}>
                                            <option value="">No department</option>
                                            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label"><Briefcase size={13} style={{ marginRight: 4 }} />Designation</label>
                                        <select className="form-select" value={form.designation} onChange={f('designation')}>
                                            <option value="">No designation</option>
                                            {designations.filter(dsg => !form.department || !dsg.department || dsg.department.name === form.department).map(dsg => <option key={dsg.id} value={dsg.name}>{dsg.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Date of Joining</label>
                                        <input type="date" className="form-input" value={form.date_of_joining} onChange={f('date_of_joining')} />
                                    </div>
                                    {isEditingOther && (
                                        <div className="form-group">
                                            <label className="form-label"><DollarSign size={13} style={{ marginRight: 4 }} />Annual CTC (₹)</label>
                                            <input type="number" min="0" step="1000" className="form-input" placeholder="e.g. 1200000"
                                                value={form.ctc || ''} onChange={f('ctc')} />
                                        </div>
                                    )}
                                </div>
                                {isEditingOther && <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, marginBottom: 12 }}>Joining date and CTC are only visible to admins.</p>}
                            </>
                        ) : (
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <input className="form-input" value={profile?.department || '—'} readOnly style={{ background: 'var(--surface-alt)', cursor: 'not-allowed' }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Designation</label>
                                    <input className="form-input" value={profile?.designation || '—'} readOnly style={{ background: 'var(--surface-alt)', cursor: 'not-allowed' }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date of Joining</label>
                                    <input className="form-input" value={profile?.date_of_joining || '—'} readOnly style={{ background: 'var(--surface-alt)', cursor: 'not-allowed' }} />
                                </div>
                            </div>
                        )}
                        <div className="form-group" style={{ marginTop: isAdmin ? 14 : 0 }}>
                            <label className="form-label">Email</label>
                            <input className="form-input" value={profile?.email || ''} readOnly style={{ background: 'var(--surface-alt)', cursor: 'not-allowed' }} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    {isEditingOther && <button type="button" className="btn btn-ghost" onClick={() => navigate('/users')}>Cancel</button>}
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><Save size={15} />{isEditingOther ? 'Update Employee' : 'Save Profile'}</>}
                    </button>
                </div>
            </form>

            {/* Admin: CTC Setting (Only show if on own profile) */}
            {isAdmin && !isEditingOther && (
                <div className="card glass-card" style={{ marginTop: 32, border: '1px solid var(--warning, #f59e0b)' }}>
                    <div className="card-header-premium" style={{ background: 'rgba(245,158,11,0.07)', borderBottomColor: 'rgba(245,158,11,0.2)' }}>
                        <DollarSign size={18} style={{ color: '#f59e0b' }} />
                        <h3 style={{ color: '#f59e0b' }}>Admin: Quick Set Employee CTC</h3>
                    </div>
                    <div className="card-body" style={{ padding: 24 }}>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                            Quickly update CTC for any employee. For full profile edits, use the Employee list.
                        </p>
                        <form onSubmit={handleCTCSave} style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                            <div className="form-group" style={{ flex: 2 }}>
                                <label className="form-label">Employee</label>
                                <select className="form-select" value={ctcTarget.userId} onChange={e => setCtcTarget(p => ({ ...p, userId: e.target.value }))}>
                                    <option value="">Select employee…</option>
                                    {allUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} — {u.email}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Annual CTC (₹)</label>
                                <input type="number" min="0" step="1000" className="form-input" placeholder="e.g. 1200000"
                                    value={ctcTarget.ctc} onChange={e => setCtcTarget(p => ({ ...p, ctc: e.target.value }))} />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={ctcSaving || !ctcTarget.userId || !ctcTarget.ctc} style={{ height: 42 }}>
                                {ctcSaving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><Save size={14} />Set CTC</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password — only on own profile */}
            {!isEditingOther && (
                <div className="card glass-card" style={{ marginTop: 32 }}>
                    <div className="card-header-premium">
                        <Lock size={18} />
                        <h3>Change Password</h3>
                    </div>
                    <div className="card-body" style={{ padding: 24 }}>
                        <form onSubmit={handleChangePassword}>
                            <div className="form-row">
                                <div className="form-group" style={{ position: 'relative' }}>
                                    <label className="form-label">Current Password</label>
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        className="form-input"
                                        placeholder="Enter current password"
                                        value={pwForm.current}
                                        onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ position: 'relative' }}>
                                    <label className="form-label">New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            className="form-input"
                                            placeholder="Min. 6 characters"
                                            value={pwForm.next}
                                            onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                                            required
                                            style={{ paddingRight: 38 }}
                                        />
                                        <button type="button" onClick={() => setShowPw(v => !v)}
                                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirm New Password</label>
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        className="form-input"
                                        placeholder="Re-enter new password"
                                        value={pwForm.confirm}
                                        onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                                        required
                                        style={{ borderColor: pwForm.confirm && pwForm.confirm !== pwForm.next ? 'var(--danger)' : undefined }}
                                    />
                                    {pwForm.confirm && pwForm.confirm !== pwForm.next && (
                                        <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4, display: 'block' }}>Passwords do not match</span>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                                <button type="submit" className="btn btn-primary"
                                    disabled={pwSaving || (pwForm.confirm && pwForm.confirm !== pwForm.next)}>
                                    {pwSaving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><Lock size={14} /> Change Password</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
