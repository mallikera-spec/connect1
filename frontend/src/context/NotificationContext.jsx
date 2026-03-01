import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeToast, setActiveToast] = useState(null);

    const loadNotifications = useCallback(async (isInitial = false) => {
        if (!user) return;
        if (isInitial) setLoading(true);
        try {
            const res = await api.get('/notifications');
            const newNotifications = res.data.data;
            const newUnreadCount = newNotifications.filter(n => !n.is_read).length;

            // Detect new incoming notifications for the toast (if not initial load)
            if (!isInitial && newNotifications.length > 0 && notifications.length > 0) {
                const latestOld = notifications[0];
                const incoming = newNotifications.filter(n => !n.is_read && n.created_at > latestOld.created_at);
                if (incoming.length > 0) {
                    setActiveToast(incoming[0]); // Show the most recent one
                    // Auto-hide toast after 5 seconds
                    setTimeout(() => setActiveToast(null), 5000);
                }
            }

            setNotifications(newNotifications);
            setUnreadCount(newUnreadCount);
        } catch (err) {
            console.error('Failed to load notifications:', err);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, [user, notifications]);

    useEffect(() => {
        loadNotifications(true);

        const interval = setInterval(() => loadNotifications(false), 20000);
        return () => clearInterval(interval);
    }, [user]); // Only depend on user to avoid infinite loops with notifications

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            isModalOpen,
            setIsModalOpen,
            activeToast,
            setActiveToast,
            markAsRead,
            markAllRead,
            refresh: () => loadNotifications(false)
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
    return context;
};
