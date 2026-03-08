import { useAuth } from '../../context/AuthContext'
import EmployeeTimesheet from './EmployeeTimesheet'
import AdminTimesheet from './AdminTimesheet'

export default function TimesheetPage() {
    const { hasPermission, hasRole } = useAuth()

    const isDev = hasRole('developer')
    const isAdminView = hasPermission('view_timesheets') || hasPermission('manage_employees') || hasRole('Tester') || hasRole('super_admin') || hasRole('director') || hasRole('Director')

    if (isDev && !hasRole('Tester') && !hasRole('super_admin') && !hasRole('director') && !hasRole('Director')) return <EmployeeTimesheet />
    return isAdminView ? <AdminTimesheet /> : <EmployeeTimesheet />
}
