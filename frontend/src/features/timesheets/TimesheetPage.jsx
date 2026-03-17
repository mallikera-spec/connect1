import { useAuth } from '../../context/AuthContext'
import EmployeeTimesheet from './EmployeeTimesheet'
import AdminTimesheet from './AdminTimesheet'
import TesterTimesheet from './TesterTimesheet'

export default function TimesheetPage() {
    const { hasPermission, hasRole } = useAuth()

    const isTester = hasRole('Tester') || hasRole('tester')
    const isAdmin = hasPermission('view_timesheets') || hasPermission('manage_employees') || hasRole('super_admin') || hasRole('director') || hasRole('Director')
    const isDev = hasRole('developer')

    // Testers get their own combined view (personal log + team review)
    if (isTester) return <TesterTimesheet />

    // Pure admins / directors / managers get the full team supervision view
    if (isAdmin && !isDev) return <AdminTimesheet />

    // Developers (and everyone else) get the personal log
    return <EmployeeTimesheet />
}

