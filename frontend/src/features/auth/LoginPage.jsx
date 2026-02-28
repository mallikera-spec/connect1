import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

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
            <div className="login-card">
                <div className="login-logo">R</div>
                <h1 className="login-title">ArgosMob - Connect</h1>
                <p className="login-subtitle">Sign in to manage your productivity</p>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email address</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="admin@company.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 4 }}>
                        <Link to="/forgot-password"
                            style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                            Forgot password?
                        </Link>
                    </div>
                    <button className="login-submit" type="submit" disabled={loading}>
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>
            </div>
        </div>
    )
}
