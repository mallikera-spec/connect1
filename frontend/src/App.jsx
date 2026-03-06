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
import MyProjectsPage from './features/projects/MyProjectsPage'
import ProjectDetailPage from './features/projects/ProjectDetailPage'
import ClientsList from './features/projects/ClientsList'
import TasksPage from './features/tasks/TasksPage'
import ReportsPage from './features/reports/ReportsPage'
import ProfilePage from './features/profile/ProfilePage'
import TimesheetPage from './features/timesheets/TimesheetPage'
import TestingQueue from './features/timesheets/TestingQueue'
import TestingTasks from './features/tasks/TestingTasks'
import DesignationsPage from './features/designations/DesignationsPage'
import DeveloperCalendar from './features/reports/DeveloperCalendar'
import AdminDevCalendar from './features/reports/AdminDevCalendar'
import QuotationPage from './features/quotations/QuotationPage'
import Leads from './features/sales/Leads'
import FollowUps from './features/sales/FollowUps'
import SalesDashboard from './features/sales/SalesDashboard'
import BDMPerformance from './features/reports/BDMPerformance'
import InteractionHistory from './features/sales/InteractionHistory'
import HRDashboard from './features/hr/HRDashboard'
import HRAdminPanel from './features/hr/HRAdminPanel'
import PollsPage from './features/polls/PollsPage'
import AttendanceReport from './features/reports/AttendanceReport'
import TesterPage from './features/dashboard/TesterPage'
import TestingReports from './features/timesheets/TestingReports'
import PoliciesPage from './features/hr/PoliciesPage'
import LeaveTracker from './features/hr/LeaveTracker'
import DeviceGuard from './components/DeviceGuard'

function AdminLayout({ children }) {
  return (
    <ProtectedRoute>
      <DeviceGuard>
        <DashboardLayout>{children}</DashboardLayout>
      </DeviceGuard>
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
      <Route path="/polls" element={<AdminLayout><PollsPage /></AdminLayout>} />
      <Route path="/attendance-report" element={<AdminLayout><AttendanceReport /></AdminLayout>} />
      <Route path="/tester-dashboard" element={<AdminLayout><PermissionGate perm="view_tasks" allowedRoles={['Tester', 'super_admin']}><TesterPage /></PermissionGate></AdminLayout>} />
      <Route path="/testing-todos" element={<AdminLayout><PermissionGate perm="view_timesheet" allowedRoles={['Tester', 'super_admin']}><TestingQueue /></PermissionGate></AdminLayout>} />
      <Route path="/testing-tasks" element={<AdminLayout><PermissionGate perm="view_tasks" allowedRoles={['Tester', 'super_admin']}><TestingTasks /></PermissionGate></AdminLayout>} />
      <Route path="/testing-reports" element={<AdminLayout><PermissionGate perm="view_timesheet" allowedRoles={['Tester', 'super_admin']}><TestingReports /></PermissionGate></AdminLayout>} />
      <Route path="/timesheet" element={<AdminLayout><PermissionGate perm="view_timesheet"><TimesheetPage /></PermissionGate></AdminLayout>} />

      {/* Project Management */}
      <Route path="/my-projects" element={
        <AdminLayout><MyProjectsPage /></AdminLayout>
      } />
      <Route path="/projects" element={
        <AdminLayout><PermissionGate perm="view_projects" allowedRoles={['Tester']}><ProjectsPage /></PermissionGate></AdminLayout>
      } />
      <Route path="/projects/:id" element={
        <AdminLayout><PermissionGate perm="view_projects"><ProjectDetailPage /></PermissionGate></AdminLayout>
      } />
      <Route path="/clients" element={
        <AdminLayout><PermissionGate perm="view_clients"><ClientsList /></PermissionGate></AdminLayout>
      } />
      <Route path="/tasks" element={
        <AdminLayout><PermissionGate perm="view_tasks" allowedRoles={['Tester']}><TasksPage /></PermissionGate></AdminLayout>
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
      <Route path="/policies" element={
        <AdminLayout><PoliciesPage /></AdminLayout>
      } />
      <Route path="/leave-tracker" element={
        <AdminLayout><LeaveTracker /></AdminLayout>
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
        <AdminLayout><PermissionGate perm="generate_quotations" excludeRoles={['HR Manager']}><QuotationPage /></PermissionGate></AdminLayout>
      } />
      <Route path="/sales-dashboard" element={
        <AdminLayout><PermissionGate perm="view_leads" excludeRoles={['HR Manager']}><SalesDashboard /></PermissionGate></AdminLayout>
      } />
      <Route path="/leads" element={
        <AdminLayout><PermissionGate perm="view_leads" excludeRoles={['HR Manager']}><Leads /></PermissionGate></AdminLayout>
      } />
      <Route path="/follow-ups" element={
        <AdminLayout><PermissionGate perm="view_leads" excludeRoles={['HR Manager']}><FollowUps /></PermissionGate></AdminLayout>
      } />
      <Route path="/bdm-performance" element={
        <AdminLayout><PermissionGate perm="view_leads" excludeRoles={['HR Manager']}><BDMPerformance /></PermissionGate></AdminLayout>
      } />
      <Route path="/interaction-history" element={
        <AdminLayout><PermissionGate perm="view_leads" excludeRoles={['HR Manager']}><InteractionHistory /></PermissionGate></AdminLayout>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
