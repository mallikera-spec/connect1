import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User, Phone, MapPin, Calendar, Heart, FileText, Tag, DollarSign, Save, Building2, Briefcase, ArrowLeft } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

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

    if (loading) return <div className="page-loader"><div className="spinner" /></div>

    return (
        <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 64 }}>
            <div className="page-header" style={{ alignItems: 'center', gap: 12 }}>
                {isEditingOther && (
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/users')} style={{ marginRight: 8 }}>
                        <ArrowLeft size={18} />
                    </button>
                )}
                <div>
                    <h1>{isEditingOther ? `Edit Profile: ${profile?.full_name}` : 'My Profile'}</h1>
                    <p>{isEditingOther ? `Managing details for ${profile?.email}` : 'View and update your personal information'}</p>
                </div>
            </div>

            {isAdmin && report && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                    <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>Projects</div>
                        <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--accent)' }}>{report.total_projects}</div>
                    </div>
                    <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>Total Tasks</div>
                        <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--accent)' }}>{report.total_tasks}</div>
                    </div>
                    <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>Hours Logged</div>
                        <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--accent)' }}>{report.total_hours_logged}h</div>
                    </div>
                    {isEditingOther && (
                        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(var(--accent-rgb), 0.05)', border: '1px dashed var(--accent)' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/timesheets?userId=${userId}`)}>
                                <Calendar size={14} style={{ marginRight: 6 }} /> View Timesheets
                            </button>
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSave}>
                {/* Personal Info */}
                <div className="card shadow-sm glass-card" style={{ marginBottom: 24 }}>
                    <div className="card-header-premium">
                        <User size={18} />
                        <h3>Personal Information</h3>
                    </div>
                    <div className="card-body" style={{ padding: 20 }}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">FULL NAME</label>
                                <input className="form-input" value={form.full_name} onChange={f('full_name')} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label"><Phone size={13} style={{ marginRight: 4 }} /> PRIMARY PHONE</label>
                                <input className="form-input" type="tel" value={form.phone} onChange={f('phone')} placeholder="+91 0000000000" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">ALTERNATE PHONE</label>
                                <input className="form-input" type="tel" value={form.alternate_phone} onChange={f('alternate_phone')} placeholder="+91 0000000000" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">BLOOD GROUP</label>
                                <select className="form-select" value={form.blood_group} onChange={f('blood_group')}>
                                    <option value="">Select...</option>
                                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label"><MapPin size={13} style={{ marginRight: 4 }} />RESIDENTIAL ADDRESS</label>
                            <textarea className="form-textarea" rows={2} value={form.address} onChange={f('address')} style={{ resize: 'vertical' }} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label"><Calendar size={13} style={{ marginRight: 4 }} />DATE OF BIRTH</label>
                                <input className="form-input" type="date" value={form.date_of_birth} onChange={f('date_of_birth')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label"><Heart size={13} style={{ marginRight: 4 }} />EMERGENCY CONTACT</label>
                                <input className="form-input" value={form.emergency_contact} onChange={f('emergency_contact')} placeholder="Name — Relation — Phone" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Educational Details */}
                <div className="card shadow-sm glass-card" style={{ marginBottom: 24 }}>
                    <div className="card-header-premium">
                        <Briefcase size={18} />
                        <h3>Educational Background</h3>
                    </div>
                    <div className="card-body" style={{ padding: 20 }}>
                        <div className="form-group">
                            <label className="form-label">HIGHEST QUALIFICATION</label>
                            <input className="form-input" value={form.education_qualification} onChange={f('education_qualification')} placeholder="e.g. B.Tech in Computer Science" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">X (10TH) PASSING YEAR</label>
                                <input className="form-input" type="number" value={form.x_year} onChange={f('x_year')} placeholder="e.g. 2012" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">XII (12TH) PASSING YEAR</label>
                                <input className="form-input" type="number" value={form.xii_year} onChange={f('xii_year')} placeholder="e.g. 2014" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banking & Identity */}
                <div className="card shadow-sm glass-card" style={{ marginBottom: 24 }}>
                    <div className="card-header-premium">
                        <DollarSign size={18} />
                        <h3>Banking & Identity Details</h3>
                    </div>
                    <div className="card-body" style={{ padding: 20 }}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">BANK NAME</label>
                                <input className="form-input" value={form.bank_name} onChange={f('bank_name')} placeholder="e.g. HDFC Bank" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">ACCOUNT NUMBER</label>
                                <input className="form-input" value={form.bank_account_no} onChange={f('bank_account_no')} placeholder="0000 0000 0000" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">IFSC CODE</label>
                                <input className="form-input" value={form.bank_ifsc} onChange={f('bank_ifsc')} placeholder="IFSC000001" style={{ textTransform: 'uppercase' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">PAN NUMBER</label>
                                <input className="form-input" value={form.pan_number} onChange={f('pan_number')} placeholder="ABCDE1234F" style={{ textTransform: 'uppercase' }} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">AADHAR NUMBER</label>
                            <input className="form-input" value={form.aadhar_number} onChange={f('aadhar_number')} placeholder="0000 0000 0000" />
                        </div>
                    </div>
                </div>

                {/* Professional Info */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                        <FileText size={18} style={{ color: 'var(--accent)' }} />
                        <h3 style={{ margin: 0, fontSize: 15 }}>Professional Summary</h3>
                    </div>
                    <div className="card-body" style={{ padding: 20 }}>
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
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                        <Building2 size={18} style={{ color: 'var(--accent)' }} />
                        <h3 style={{ margin: 0, fontSize: 15 }}>Employment Details</h3>
                    </div>
                    <div className="card-body" style={{ padding: 20 }}>
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
                                {isEditingOther && <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: -8, marginBottom: 12 }}>Joining date and CTC are only visible to admins.</p>}
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
                        <div className="form-group">
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
                <div className="card" style={{ marginTop: 32, border: '1px solid var(--warning, #f59e0b)' }}>
                    <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(245,158,11,0.07)' }}>
                        <DollarSign size={18} style={{ color: '#f59e0b' }} />
                        <h3 style={{ margin: 0, fontSize: 15, color: '#f59e0b' }}>Admin: Quick Set Employee CTC</h3>
                    </div>
                    <div className="card-body" style={{ padding: 20 }}>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                            Quickly update CTC for any employee. For full profile edits, use the Employee list.
                        </p>
                        <form onSubmit={handleCTCSave} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                            <div className="form-group" style={{ flex: 2 }}>
                                <label className="form-label">Employee</label>
                                <select className="form-select" value={ctcTarget.userId} onChange={e => setCtcTarget(p => ({ ...p, userId: e.target.value }))}>
                                    <option value="">Select employee…</option>
                                    {allUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} — {u.email}</option>)}
                                </select>
                            </div>
                            {/* <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Annual CTC (₹)</label>
                                <input type="number" min="0" step="1000" className="form-input" placeholder="e.g. 1200000"
                                    value={ctcTarget.ctc} onChange={e => setCtcTarget(p => ({ ...p, ctc: e.target.value }))} />
                            </div> */}
                            <button type="submit" className="btn btn-primary" disabled={ctcSaving || !ctcTarget.userId || !ctcTarget.ctc} style={{ marginBottom: 1 }}>
                                {ctcSaving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><Save size={14} />Set CTC</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
