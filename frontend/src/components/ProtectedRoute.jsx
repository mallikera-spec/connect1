import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
    const { session, loading } = useAuth()

    if (loading) return (
        <div className="login-page">
            <div className="spinner" style={{ width: 36, height: 36 }} />
        </div>
    )

    if (!session) return <Navigate to="/login" replace />

    return children
}
