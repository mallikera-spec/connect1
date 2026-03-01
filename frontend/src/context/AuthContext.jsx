import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null)
    const [user, setUser] = useState(null)       // { id, email, roles[], permissions[] }
    const [loading, setLoading] = useState(true)

    const loadUserData = async (supabaseSession) => {
        if (!supabaseSession) { setUser(null); return }
        try {
            const { data } = await api.get('/auth/me')
            setUser(data.data)
        } catch {
            setUser({ id: supabaseSession.user.id, email: supabaseSession.user.email, roles: [], permissions: [] })
        }
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            loadUserData(session).finally(() => setLoading(false))
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            loadUserData(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    const login = (email, password) => supabase.auth.signInWithPassword({ email, password })
    const logout = () => supabase.auth.signOut()

    // Helper: check if the logged-in user has a specific permission
    const hasPermission = (perm) => {
        if (!user) return false
        // Super admin always has access (role name check)
        if (user.roles?.includes('super_admin')) return true
        return user.permissions?.includes(perm) ?? false
    }

    // Helper: check if the user has at least one of the given permissions
    const hasAnyPermission = (...perms) => perms.some(p => hasPermission(p))

    // Helper: check if user has a specific role (case-insensitive)
    const hasRole = (role) => {
        if (!user || !user.roles) return false
        return user.roles.some(r => r.toLowerCase() === role.toLowerCase())
    }

    return (
        <AuthContext.Provider value={{ session, user, loading, login, logout, hasPermission, hasAnyPermission, hasRole }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
