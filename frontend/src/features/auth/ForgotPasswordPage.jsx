import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
        setLoading(false)
        if (error) {
            toast.error(error.message || 'Failed to send reset email')
        } else {
            setSent(true)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">R</div>
                <h1 className="login-title">Reset Password</h1>
                <p className="login-subtitle">
                    {sent ? 'Check your inbox' : "Enter your email and we'll send a reset link"}
                </p>

                {sent ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <CheckCircle size={48} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
                            A password reset link has been sent to
                        </p>
                        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 24, color: 'var(--text)' }}>{email}</p>
                        <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                            Didn't receive it? Check spam or{' '}
                            <button
                                onClick={() => setSent(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: 12, padding: 0 }}>
                                try again
                            </button>
                        </p>
                    </div>
                ) : (
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">
                                <Mail size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                Email address
                            </label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="you@company.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <button className="login-submit" type="submit" disabled={loading}>
                            {loading ? 'Sending…' : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <Link to="/login"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
                        <ArrowLeft size={14} /> Back to Sign in
                    </Link>
                </div>
            </div>
        </div>
    )
}
