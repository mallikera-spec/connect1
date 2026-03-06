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
export default function PermissionGate({ perm, allowedRoles, excludeRoles, children }) {
    const { hasPermission, hasRole, loading } = useAuth()

    if (loading) return null   // wait for auth to resolve

    const permOk = perm ? hasPermission(perm) : false
    const roleOk = allowedRoles ? allowedRoles.some(r => hasRole(r)) : false

    // If both specified, either one works (OR logic). If only one, that one must pass.
    let isAuthorized = true;
    if (perm && allowedRoles) {
        isAuthorized = permOk || roleOk;
    } else if (perm) {
        isAuthorized = permOk;
    } else if (allowedRoles) {
        isAuthorized = roleOk;
    }

    // Explicitly exclude roles (AND NOT logic)
    if (excludeRoles && excludeRoles.some(r => hasRole(r))) {
        isAuthorized = false;
    }

    if (!isAuthorized) {
        return <Navigate to="/dashboard" replace />
    }

    return children
}
