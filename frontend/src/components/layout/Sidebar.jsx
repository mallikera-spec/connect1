import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
    LayoutDashboard,
    Users, ShieldCheck, Key, Building2, Briefcase,
    FolderKanban, ListTodo, BarChart3,
    ChevronLeft, ChevronRight, LogOut,
    UserCircle, Clock, Calendar,
} from 'lucide-react'
import toast from 'react-hot-toast'

const NAV = [
    {
        section: 'Overview',
        icon: LayoutDashboard,
        items: [
            { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/profile', label: 'My Profile', icon: UserCircle },
        ]
    },
    {
        section: 'Project Management',
        icon: FolderKanban,
        items: [
            { to: '/projects', label: 'All Projects', perm: 'manage_projects', icon: FolderKanban },
            { to: '/projects', label: 'My Projects', hideIfHas: 'manage_projects', icon: FolderKanban },
            { to: '/tasks', label: 'Tasks', perm: 'view_tasks', icon: ListTodo },
            { to: '/timesheet', label: 'Timesheet', icon: Clock },
            { to: '/reports', label: 'Reports', perm: 'view_overall_report', icon: BarChart3 },
            { to: '/developer-calendar', label: 'Dev Calendar', perm: 'view_reports', icon: Calendar },
        ]
    },
    {
        section: 'HR & Operations',
        icon: Users,
        items: [
            { to: '/departments', icon: Building2, label: 'Departments', perm: 'view_departments' },
            { to: '/designations', icon: Briefcase, label: 'Designations', perm: 'manage_designations' },
            { to: '/users', icon: Users, label: 'Employees', perm: 'view_employees' },
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
]

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const [expandedGroups, setExpandedGroups] = useState(['Overview', 'Project Management'])
    const { logout, hasPermission } = useAuth()
    const navigate = useNavigate()

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
        .map(group => ({
            ...group,
            items: group.items.filter(item => {
                if (item.perm && !hasPermission(item.perm)) return false;
                if (item.hideIfHas && hasPermission(item.hideIfHas)) return false;
                return true;
            }),
        }))
        .filter(group => group.items.length > 0)

    return (
        <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
            <div className="sidebar-brand">
                <div className="brand-logo">R</div>
                {!collapsed && <span className="brand-name">ArgosMob - Connect</span>}
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
                                title={collapsed ? group.section : ''}
                            >
                                <div className="section-title">
                                    <SectionIcon size={18} />
                                    {!collapsed && <span>{group.section}</span>}
                                </div>
                                {!collapsed && (
                                    <div className={`chevron ${isExpanded ? 'rotate' : ''}`}>
                                        <ChevronRight size={14} />
                                    </div>
                                )}
                            </button>

                            {isExpanded && !collapsed && (
                                <div className="sidebar-sub-menu">
                                    {group.items.map(({ to, icon: Icon, label }) => (
                                        <NavLink
                                            key={`${group.section}-${label}`}
                                            to={to}
                                            className={({ isActive }) => `nav-item sub-item${isActive ? ' active' : ''}`}
                                        >
                                            {Icon && <Icon size={16} />}
                                            <span>{label}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <button className="nav-item" onClick={handleLogout} title="Sign out">
                    <LogOut size={18} />
                    {!collapsed && <span>Sign out</span>}
                </button>
                <button className="nav-item" onClick={() => setCollapsed(c => !c)} style={{ marginTop: 4 }}>
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    {!collapsed && <span>Collapse</span>}
                </button>
            </div>
        </aside>
    )
}
