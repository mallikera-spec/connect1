import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNotifications } from '../../context/NotificationContext'
import { Sun, Moon, Monitor, Bell, CheckCheck, Inbox } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const TITLES = {
    '/dashboard': 'Dashboard',
    '/departments': 'Departments',
    '/users': 'Users',
    '/roles': 'Roles',
    '/permissions': 'Permissions',
    '/projects': 'Projects',
    '/tasks': 'Tasks',
    '/reports': 'Reports',
}

const THEMES = [
    { value: 'light', icon: Sun, title: 'Light' },
    { value: 'dark', icon: Moon, title: 'Dark' },
    { value: 'system', icon: Monitor, title: 'System' },
]

export default function Header() {
    const { pathname } = useLocation()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { theme, setTheme } = useTheme()
    const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications()
    const [showNotifications, setShowNotifications] = useState(false)
    const dropdownRef = useRef(null)

    const title = TITLES[pathname] || 'Panel'
    const initials = user?.email?.slice(0, 2).toUpperCase() || 'AD'

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <header className="header">
            <div className="header-left">
                <span className="page-title">{title}</span>
            </div>
            <div className="header-right">
                {/* Theme switcher */}
                <div className="theme-switcher">
                    {THEMES.map(({ value, icon: Icon, title: label }) => (
                        <button
                            key={value}
                            className={`theme-btn${theme === value ? ' active' : ''}`}
                            onClick={() => setTheme(value)}
                            title={label}
                        >
                            <Icon size={14} />
                        </button>
                    ))}
                </div>

                {/* Notifications */}
                <div className="notifications-wrapper" ref={dropdownRef}>
                    <button
                        className={`notification-bell${unreadCount > 0 ? ' has-unread' : ''}`}
                        onClick={() => setShowNotifications(!showNotifications)}
                        title="Notifications"
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                    </button>

                    {showNotifications && (
                        <div className="notifications-dropdown glass-card">
                            <div className="dropdown-header">
                                <h3>Notifications</h3>
                                {unreadCount > 0 && (
                                    <button className="mark-all-btn" onClick={markAllRead}>
                                        <CheckCheck size={14} /> Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="notifications-list">
                                {notifications.length === 0 ? (
                                    <div className="empty-notifications">
                                        <Inbox size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
                                        <p>No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            className={`notification-item${!n.is_read ? ' unread' : ''}`}
                                            onClick={() => {
                                                markAsRead(n.id)
                                                setShowNotifications(false)
                                                if (n.type.startsWith('TASK_')) {
                                                    navigate('/tasks', { state: { openTaskId: n.data?.taskId } })
                                                }
                                            }}
                                        >
                                            <div className="notification-dot" />
                                            <div className="notification-content">
                                                <p className="notification-title">{n.title}</p>
                                                <p className="notification-msg">{n.message}</p>
                                                <span className="notification-time">
                                                    {new Date(n.created_at).toLocaleString('en-IN', {
                                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="user-chip">
                    <div className="user-avatar">{initials}</div>
                    <span>{user?.email || 'Admin'}</span>
                </div>
            </div>
        </header>
    )
}
