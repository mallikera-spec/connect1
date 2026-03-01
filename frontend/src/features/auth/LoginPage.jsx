import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [quote, setQuote] = useState({ quote: "Loading your daily inspiration...", author: "AI" })

    useEffect(() => {
        api.get('/auth/daily-quote')
            .then(res => setQuote(res.data.data))
            .catch(() => setQuote({ quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" }))
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await login(email, password)
        setLoading(false)
        if (error) {
            toast.error(error.message || 'Login failed')
        } else {
            toast.success('Welcome back!')
            navigate('/dashboard')
        }
    }

    return (
        <div className="login-page">
            <div className="login-left">
                <div className="login-left-content">
                    <div className="brand">
                        <div className="brand-logo">R</div>
                        <span className="login-left-name">Argosmob - Connect</span>
                    </div>

                    <div className="login-quote-wrap">
                        <h1 className="login-quote">"{quote.quote}"</h1>
                        <div className="login-quote-author">{quote.author}</div>
                    </div>
                </div>
            </div>

            <div className="login-right">
                <div className="login-form-container">
                    <h2>Welcome back</h2>
                    <p>Enter your details to access your account</p>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label className="form-label">Email address</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="name@company.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            {/* <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className="form-label">Password</label>
                                <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 600 }}>
                                    Forgot password?
                                </Link>
                            </div> */}
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button className="login-submit" type="submit" disabled={loading}>
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : 'Sign in to Dashboard'}
                        </button>

                        {/* <div style={{ textAlign: 'center', marginTop: '24px' }}>
                            <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>
                                New here? <Link to="/register" style={{ color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 600 }}>Create an account</Link>
                            </p>
                        </div> */}
                    </form>
                </div>
            </div>
        </div>
    )
}
