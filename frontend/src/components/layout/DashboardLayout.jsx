import Sidebar from './Sidebar'
import Header from './Header'
import NotificationModal from '../notifications/NotificationModal'
import NotificationToast from '../notifications/NotificationToast'

export default function DashboardLayout({ children }) {
    return (
        <div className="app-shell">
            <Sidebar />
            <div className="main-area">
                <Header />
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
