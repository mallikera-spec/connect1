import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import PermissionGate from './components/PermissionGate'
import DashboardLayout from './components/layout/DashboardLayout'
import LoginPage from './features/auth/LoginPage'
import ForgotPasswordPage from './features/auth/ForgotPasswordPage'
import ResetPasswordPage from './features/auth/ResetPasswordPage'
import DashboardPage from './features/dashboard/DashboardPage'
import UsersPage from './features/users/UsersPage'
import RolesPage from './features/roles/RolesPage'
import PermissionsPage from './features/permissions/PermissionsPage'
import DepartmentsPage from './features/departments/DepartmentsPage'
import ProjectsPage from './features/projects/ProjectsPage'
import ProjectDetailPage from './features/projects/ProjectDetailPage'
import ClientsList from './features/projects/ClientsList'
import TasksPage from './features/tasks/TasksPage'
import ReportsPage from './features/reports/ReportsPage'
import ProfilePage from './features/profile/ProfilePage'
import TimesheetPage from './features/timesheets/TimesheetPage'
import DesignationsPage from './features/designations/DesignationsPage'
import DeveloperCalendar from './features/reports/DeveloperCalendar'
import AdminDevCalendar from './features/reports/AdminDevCalendar'
import QuotationPage from './features/quotations/QuotationPage'
import Leads from './features/sales/Leads'
import SalesDashboard from './features/sales/SalesDashboard'
import HRDashboard from './features/hr/HRDashboard'
import HRAdminPanel from './features/hr/HRAdminPanel'

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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Always accessible to any logged-in user */}
      <Route path="/dashboard" element={<AdminLayout><DashboardPage /></AdminLayout>} />
      <Route path="/profile/:userId?" element={<AdminLayout><ProfilePage /></AdminLayout>} />
      <Route path="/timesheet" element={<AdminLayout><PermissionGate perm="view_timesheet"><TimesheetPage /></PermissionGate></AdminLayout>} />

      {/* Project Management */}
      <Route path="/projects" element={
        <AdminLayout><PermissionGate perm="view_projects"><ProjectsPage /></PermissionGate></AdminLayout>
      } />
      <Route path="/projects/:id" element={
        <AdminLayout><PermissionGate perm="view_projects"><ProjectDetailPage /></PermissionGate></AdminLayout>
      } />
      <Route path="/clients" element={
        <AdminLayout><PermissionGate perm="view_clients"><ClientsList /></PermissionGate></AdminLayout>
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
      <Route path="/admin-dev-calendar" element={
        <AdminLayout><PermissionGate perm="view_reports"><AdminDevCalendar /></PermissionGate></AdminLayout>
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
      <Route path="/hr-dashboard" element={
        <AdminLayout><HRDashboard /></AdminLayout>
      } />
      <Route path="/hr-admin" element={
        <AdminLayout><PermissionGate perm="view_employees"><HRAdminPanel /></PermissionGate></AdminLayout>
      } />

      {/* Access Control */}
      <Route path="/roles" element={
        <AdminLayout><PermissionGate perm="manage_roles"><RolesPage /></PermissionGate></AdminLayout>
      } />
      <Route path="/permissions" element={
        <AdminLayout><PermissionGate perm="manage_permissions"><PermissionsPage /></PermissionGate></AdminLayout>
      } />

      {/* Sales & Proposals */}
      <Route path="/quotations" element={
        <AdminLayout><PermissionGate perm="generate_quotations"><QuotationPage /></PermissionGate></AdminLayout>
      } />
      <Route path="/sales-dashboard" element={
        <AdminLayout><PermissionGate perm="view_leads"><SalesDashboard /></PermissionGate></AdminLayout>
      } />
      <Route path="/leads" element={
        <AdminLayout><PermissionGate perm="view_leads"><Leads /></PermissionGate></AdminLayout>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
