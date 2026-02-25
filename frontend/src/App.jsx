import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import PermissionGate from './components/PermissionGate'
import DashboardLayout from './components/layout/DashboardLayout'
import LoginPage from './features/auth/LoginPage'
import DashboardPage from './features/dashboard/DashboardPage'
import UsersPage from './features/users/UsersPage'
import RolesPage from './features/roles/RolesPage'
import PermissionsPage from './features/permissions/PermissionsPage'
import DepartmentsPage from './features/departments/DepartmentsPage'
import ProjectsPage from './features/projects/ProjectsPage'
import TasksPage from './features/tasks/TasksPage'
import ReportsPage from './features/reports/ReportsPage'
import ProfilePage from './features/profile/ProfilePage'
import TimesheetPage from './features/timesheets/TimesheetPage'
import DesignationsPage from './features/designations/DesignationsPage'
import DeveloperCalendar from './features/reports/DeveloperCalendar'

function AdminLayout({ children }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Always accessible to any logged-in user */}
      <Route path="/dashboard" element={<AdminLayout><DashboardPage /></AdminLayout>} />
      <Route path="/profile/:userId?" element={<AdminLayout><ProfilePage /></AdminLayout>} />
      <Route path="/timesheet" element={<AdminLayout><TimesheetPage /></AdminLayout>} />

      {/* Project Management */}
      <Route path="/projects" element={
        <AdminLayout><ProjectsPage /></AdminLayout>
      } />
      <Route path="/tasks" element={
        <AdminLayout><PermissionGate perm="view_tasks"><TasksPage /></PermissionGate></AdminLayout>
      } />
      <Route path="/reports" element={
        <AdminLayout><PermissionGate perm="view_reports"><ReportsPage /></PermissionGate></AdminLayout>
      } />
      <Route path="/developer-calendar" element={
        <AdminLayout><PermissionGate perm="view_reports"><DeveloperCalendar /></PermissionGate></AdminLayout>
      } />

      {/* Employee Management */}
      <Route path="/departments" element={
        <AdminLayout><PermissionGate perm="view_departments"><DepartmentsPage /></PermissionGate></AdminLayout>
      } />
      <Route path="/designations" element={
        <AdminLayout><PermissionGate perm="manage_designations"><DesignationsPage /></PermissionGate></AdminLayout>
      } />
      <Route path="/users" element={
        <AdminLayout><PermissionGate perm="view_employees"><UsersPage /></PermissionGate></AdminLayout>
      } />

      {/* Access Control */}
      <Route path="/roles" element={
        <AdminLayout><PermissionGate perm="manage_roles"><RolesPage /></PermissionGate></AdminLayout>
      } />
      <Route path="/permissions" element={
        <AdminLayout><PermissionGate perm="manage_permissions"><PermissionsPage /></PermissionGate></AdminLayout>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
