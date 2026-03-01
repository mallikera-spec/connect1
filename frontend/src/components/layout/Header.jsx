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
    const { unreadCount, setIsModalOpen } = useNotifications()

    const title = TITLES[pathname] || 'Panel'
    const initials = user?.email?.slice(0, 2).toUpperCase() || 'AD'

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
                <div className="notifications-wrapper">
                    <button
                        className={`notification-bell${unreadCount > 0 ? ' has-unread' : ''}`}
                        onClick={() => setIsModalOpen(true)}
                        title="Notifications"
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                    </button>
                </div>

                <div className="user-chip">
                    <div className="user-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            initials
                        )}
                    </div>
                    <span>{user?.email || 'Admin'}</span>
                </div>
            </div>
        </header>
    )
}
