import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
    LayoutDashboard,
    Users, ShieldCheck, Key, Building2, Briefcase,
    FolderKanban, ListTodo, BarChart3, LogOut,
    UserCircle, Clock, Calendar, FileText, Sparkles, TrendingUp, Vote, Shield, Star, Award,
    PieChart, CircleDollarSign, CreditCard, ChevronRight, ChevronLeft
} from 'lucide-react'
import toast from 'react-hot-toast'
const NAV = [
    {
        section: 'Overview',
        icon: LayoutDashboard,
        items: [
            { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/polls', label: 'Polls', icon: Vote },
            { to: '/policies', label: 'ArgosMob Policies', icon: Shield },
            { to: '/developer-scoring-criteria', label: 'Developer Scoring Criteria', icon: Star },
            { to: '/profile', label: 'My Profile', icon: UserCircle },
        ]
    },
    {
        section: 'Project Management',
        icon: FolderKanban,
        sectionHideIfRole: ['BDM', 'bdm'],
        items: [
            { to: '/projects', label: 'All Projects', perm: 'manage_projects', icon: FolderKanban },
            { to: '/my-projects', label: 'My Projects', icon: FolderKanban },
            { to: '/tasks', label: 'Tasks by PM', perm: 'view_tasks', roles: ['Tester'], icon: ListTodo },
            { to: '/timesheet', label: 'Timesheet', perm: 'view_timesheet', icon: Clock },
            { to: '/developer-performance', label: 'Dev Performance', icon: TrendingUp },
            { to: '/leaderboard', label: 'Leaderboard', icon: Award },
            { to: '/admin-dev-calendar', label: 'Developer Calendar', perm: 'view_employees', icon: Calendar },
        ]
    },
    {
        section: 'Testing Module',
        icon: ShieldCheck,
        items: [
            { to: '/tester-dashboard', label: 'Tester Dashboard', roles: ['Tester', 'super_admin', 'director'], icon: LayoutDashboard },
            { to: '/testing-reports', label: 'Testing Reports', roles: ['Tester', 'super_admin', 'director'], icon: BarChart3 },
            { to: '/testing-todos', label: 'Testing Todos', roles: ['Tester', 'super_admin', 'director'], icon: ShieldCheck },
            { to: '/testing-tasks', label: 'Testing Tasks', roles: ['Tester', 'super_admin', 'director'], icon: ListTodo },
        ]
    },
    {
        section: 'HR & Operations',
        icon: Users,
        items: [
            { to: '/hr-dashboard', icon: Clock, label: 'My HR', hideIfRole: ['super_admin', 'director', 'Director'] },
            { to: '/hr-admin', icon: Briefcase, label: 'HR Admin', perm: 'view_employees' },
            { to: '/leave-tracker', icon: Calendar, label: 'Leave Tracker' },
            { to: '/attendance-report', icon: FileText, label: 'Attendance Report' },
            { to: '/departments', icon: Building2, label: 'Departments', perm: 'view_departments' },
            { to: '/designations', icon: Briefcase, label: 'Designations', perm: 'manage_designations' },
            { to: '/users', icon: Users, label: 'Employees', perm: 'view_employees' },
            { to: '/hr-payroll', icon: CreditCard, label: 'Manage Payroll', perm: 'view_employees', roles: ['super_admin', 'director', 'Admin', 'HR Manager'] },
            { to: '/salary-slips', icon: FileText, label: 'Salary Slips' },
        ]
    },
    {
        section: 'Marketing',
        icon: FileText,
        sectionPerm: 'view_leads',
        items: [
            { to: '/our-projects', label: 'Our Projects', icon: Briefcase, perm: 'view_leads', hideIfRole: ['HR Manager', 'hr'] },
            { to: '/sales-dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'view_leads', hideIfRole: ['bdm', 'sales manager', 'HR Manager', 'hr'] },
            { to: '/leads', label: 'Leads', icon: TrendingUp, perm: 'view_leads', hideIfRole: ['HR Manager', 'hr'] },
            { to: '/follow-ups', label: 'Follow-ups', icon: Clock, perm: 'view_leads', hideIfRole: ['HR Manager', 'hr'] },
            { to: '/interaction-history', label: 'Interaction History', icon: Clock, perm: 'view_leads', hideIfRole: ['HR Manager', 'hr'] },
            { to: '/bdm-performance', label: 'BDM Performance', icon: BarChart3, perm: 'view_leads', hideIfRole: ['HR Manager', 'hr'] },
            { to: '/clients', label: 'Clients', perm: 'view_clients', icon: Building2, hideIfRole: ['HR Manager', 'hr'] },
            { to: '/quotations', label: 'Quotation Builder', icon: Sparkles, perm: 'generate_quotations', hideIfRole: ['HR Manager', 'hr'] },
        ]
    },
    {
        section: 'Reports',
        icon: PieChart,
        items: [
            { to: '/reports', label: 'Reports', roles: ['admin', 'super_admin', 'director', 'investor'], icon: BarChart3 }
        ]
    },
    {
        section: 'Finance',
        icon: CircleDollarSign,
        items: [
            { to: '/finance/overview', label: 'Overview', roles: ['admin', 'super_admin', 'director', 'investor'], icon: LayoutDashboard },
        ]
    },
    {
        section: 'Access Control',
        icon: ShieldCheck,
        items: [
            { to: '/roles', icon: Key, label: 'Roles', perm: 'manage_roles' },
            { to: '/permissions', icon: Key, label: 'Permissions', perm: 'manage_permissions' },
        ]
    },
    {
        section: 'Settings',
        icon: Sparkles,
        items: [
            { to: '/settings', label: 'Themes', icon: Sparkles },
            { action: 'logout', label: 'Sign out', icon: LogOut }
        ]
    }
]

import { X } from 'lucide-react'

export default function Sidebar({ mobileOpen, setMobileOpen }) {
    const [collapsed, setCollapsed] = useState(false)
    const [expandedGroups, setExpandedGroups] = useState(['Overview'])
    const { logout, hasPermission, hasRole } = useAuth()
    const navigate = useNavigate()
    const isActuallyCollapsed = collapsed && !mobileOpen;

    const handleLogout = async () => {
        await logout()
        toast.success('Signed out')
        navigate('/login')
    }

    const toggleGroup = (section) => {
        setExpandedGroups(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        )
    }

    // Filter groups: keep only items the user can access, drop empty groups
    const visibleNav = NAV
        .filter(group => {
            // Hide entire section if user has a restricted role
            if (group.sectionHideIfRole && group.sectionHideIfRole.some(r => hasRole(r))) return false;
            return true;
        })
        .map(group => ({
            ...group,
            items: group.items.filter(item => {
                const hasItemPerm = item.perm ? hasPermission(item.perm) : true;
                const hasItemRole = item.roles ? item.roles.some(r => hasRole(r)) : true;

                // Grant access if (no perm/role) OR (has perm) OR (has role)
                let authorized = true;
                if (item.perm && item.roles) {
                    authorized = hasItemPerm || hasItemRole;
                } else if (item.perm) {
                    authorized = hasItemPerm;
                } else if (item.roles) {
                    authorized = hasItemRole;
                }

                if (!authorized) return false;

                if (item.hideIfHas && hasPermission(item.hideIfHas)) return false;
                if (item.hideIfRole && item.hideIfRole.some(r => hasRole(r))) return false;
                return true;
            }),
        }))
        .filter(group => group.items.length > 0)

    return (
        <aside className={`sidebar${isActuallyCollapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
            <div className="sidebar-brand">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <img src="/Argosmob logo-2.jpeg" alt="ArgosMob" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    <span className="brand-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>ArgosMob - Connect</span>
                </div>

                {mobileOpen && (
                    <button
                        className="btn-icon mobile-only"
                        onClick={() => setMobileOpen(false)}
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            <nav className="sidebar-nav">
                {visibleNav.map(group => {
                    const isExpanded = expandedGroups.includes(group.section);
                    const SectionIcon = group.icon;

                    return (
                        <div key={group.section} className="sidebar-group">
                            <button
                                className={`sidebar-section-header ${isExpanded ? 'active' : ''}`}
                                onClick={() => toggleGroup(group.section)}
                                title={isActuallyCollapsed ? group.section : ''}
                            >
                                <div className="section-title">
                                    <SectionIcon size={18} />
                                    <span>{group.section}</span>
                                </div>
                                <div className={`chevron ${isExpanded ? 'rotate' : ''}`}>
                                    <ChevronRight size={14} />
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="sidebar-sub-menu">
                                    {group.items.map(({ to, icon: Icon, label, action }) => {
                                        let displayLabel = label;
                                        if (label === 'BDM Performance' && hasRole('bdm')) displayLabel = 'My Performance';
                                        if (label === 'Dev Performance' && !hasPermission('view_reports')) displayLabel = 'My Performance';

                                        if (action === 'logout') {
                                            return (
                                                <button
                                                    key={`${group.section}-${label}`}
                                                    className="nav-item sub-item"
                                                    onClick={handleLogout}
                                                    style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                                                >
                                                    {Icon && <Icon size={16} />}
                                                    <span>{displayLabel}</span>
                                                </button>
                                            );
                                        }

                                        return (
                                            <NavLink
                                                key={`${group.section}-${label}`}
                                                to={to}
                                                className={({ isActive }) => `nav-item sub-item${isActive ? ' active' : ''}`}
                                            >
                                                {Icon && <Icon size={16} />}
                                                <span>{displayLabel}</span>
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <button className="nav-item" onClick={() => setCollapsed(c => !c)} style={{ marginTop: 4 }}>
                    {isActuallyCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    <span>Collapse</span>
                </button>
            </div>
        </aside>
    )
}