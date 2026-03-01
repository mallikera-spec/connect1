import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps a route element — redirects to /dashboard with a 403-style
 * message if the user doesn't have the required permission.
 *
 * Usage in App.jsx:
 *   <PermissionGate perm="manage_roles">
 *     <RolesPage />
 *   </PermissionGate>
 */
export default function PermissionGate({ perm, allowedRoles, children }) {
    const { hasPermission, hasRole, loading } = useAuth()

    if (loading) return null   // wait for auth to resolve

    const permOk = !perm || hasPermission(perm)
    const roleOk = !allowedRoles || allowedRoles.some(r => hasRole(r))

    if (!permOk || !roleOk) {
        return <Navigate to="/dashboard" replace />
    }

    return children
}
