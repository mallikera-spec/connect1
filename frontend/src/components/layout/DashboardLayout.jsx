import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import NotificationModal from '../notifications/NotificationModal'
import NotificationToast from '../notifications/NotificationToast'

export default function DashboardLayout({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false)
    const location = useLocation()

    // Close sidebar on route change (for mobile)
    useEffect(() => {
        setMobileOpen(false)
    }, [location.pathname])

    return (
        <div className="app-shell">
            <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

            {mobileOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <div className="main-area">
                <Header onMenuClick={() => setMobileOpen(true)} />
                <main className="page-content">
                    {children}
                </main>
            </div>

            {/* Global Components */}
            <NotificationModal />
            <NotificationToast />
        </div>
    )
}
