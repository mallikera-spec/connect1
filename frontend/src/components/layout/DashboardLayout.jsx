import Sidebar from './Sidebar'
import Header from './Header'

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
        </div>
    )
}
