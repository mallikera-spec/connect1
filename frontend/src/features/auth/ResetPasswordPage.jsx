import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)
    const [validSession, setValidSession] = useState(false)

    useEffect(() => {
        // Supabase auto-processes the #access_token hash from the email link
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setValidSession(true)
            } else {
                toast.error('Invalid or expired reset link')
            }
        })

        // Listen for auth state change (Supabase fires this when token is processed from hash)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setValidSession(true)
            }
        })
        return () => subscription.unsubscribe()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (password.length < 6) return toast.error('Password must be at least 6 characters')
        if (password !== confirm) return toast.error('Passwords do not match')

        setLoading(true)
        const { error } = await supabase.auth.updateUser({ password })
        setLoading(false)

        if (error) {
            toast.error(error.message || 'Failed to update password')
        } else {
            setDone(true)
            toast.success('Password updated successfully!')
            // Auto-redirect to login after 2 seconds
            setTimeout(() => navigate('/login'), 2500)
        }
    }

    const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
    const strengthLabel = ['', 'Weak', 'Good', 'Strong']
    const strengthColor = ['', 'var(--danger)', 'var(--warning)', 'var(--success)']

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">R</div>
                <h1 className="login-title">Set New Password</h1>
                <p className="login-subtitle">
                    {done ? 'Password updated! Redirecting…' : 'Choose a strong new password'}
                </p>

                {done ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <CheckCircle size={48} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                            You'll be redirected to the login page shortly.
                        </p>
                    </div>
                ) : !validSession ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                        <p>Invalid or expired reset link.</p>
                        <Link to="/forgot-password"
                            style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                            Request a new one →
                        </Link>
                    </div>
                ) : (
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">
                                <Lock size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                New Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Min. 6 characters"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoFocus
                                    style={{ paddingRight: 40 }}
                                />
                                <button type="button" onClick={() => setShowPw(p => !p)}
                                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {/* Strength bar */}
                            {password.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= strength ? strengthColor[strength] : 'var(--border)', transition: 'background 0.3s' }} />
                                        ))}
                                    </div>
                                    <span style={{ fontSize: 11, color: strengthColor[strength], fontWeight: 600 }}>
                                        {strengthLabel[strength]}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input
                                type={showPw ? 'text' : 'password'}
                                className="form-input"
                                placeholder="Re-enter password"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                required
                                style={{ borderColor: confirm && confirm !== password ? 'var(--danger)' : undefined }}
                            />
                            {confirm && confirm !== password && (
                                <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4, display: 'block' }}>Passwords do not match</span>
                            )}
                        </div>

                        <button className="login-submit" type="submit" disabled={loading || (confirm && confirm !== password)}>
                            {loading ? 'Updating…' : 'Update Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
