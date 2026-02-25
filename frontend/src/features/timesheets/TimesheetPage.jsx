import { useAuth } from '../../context/AuthContext'
import EmployeeTimesheet from './EmployeeTimesheet'
import AdminTimesheet from './AdminTimesheet'

export default function TimesheetPage() {
    const { hasPermission, hasRole } = useAuth()

    const isDev = hasRole('developer')
    const canViewAll = hasPermission('view_timesheets') || hasPermission('manage_employees')

    if (isDev) return <EmployeeTimesheet />
    return canViewAll ? <AdminTimesheet /> : <EmployeeTimesheet />
}
