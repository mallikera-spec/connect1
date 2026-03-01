import { useNavigate } from 'react-router-dom';
import { X, CheckCheck, Inbox } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export default function NotificationModal() {
    const navigate = useNavigate();
    const {
        isModalOpen,
        setIsModalOpen,
        notifications,
        unreadCount,
        markAsRead,
        markAllRead
    } = useNotifications();

    if (!isModalOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
            <div className="modal global-notification-modal">
                <div className="modal-header">
                    <h2 className="modal-title">Notifications ({unreadCount})</h2>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {unreadCount > 0 && (
                            <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
                                <CheckCheck size={14} /> Mark all read
                            </button>
                        )}
                        <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                            <X size={18} />
                        </button>
                    </div>
                </div>
                <div className="modal-body">
                    {notifications.length === 0 ? (
                        <div className="empty-state" style={{ height: '300px' }}>
                            <Inbox size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        <div className="notifications-list">
                            {notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`notification-item${!n.is_read ? ' unread' : ''}`}
                                    onClick={() => {
                                        markAsRead(n.id);
                                        setIsModalOpen(false);
                                        // Handle navigation based on type
                                        if (n.type.startsWith('TASK_') || n.type === 'task_assigned' || n.type === 'task_status_change') {
                                            navigate('/tasks', { state: { openTaskId: n.data?.taskId || n.data?.task_id } });
                                        } else if (n.type === 'leave_request' || n.type === 'leave_status') {
                                            navigate('/hr-admin', { state: { tab: 'leaves' } });
                                        }
                                    }}
                                >
                                    <div className="notification-dot" />
                                    <div className="notification-content">
                                        <p className="notification-title" style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</p>
                                        <p className="notification-msg" style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{n.message}</p>
                                        <span className="notification-time" style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, display: 'block' }}>
                                            {new Date(n.created_at).toLocaleString('en-IN', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
