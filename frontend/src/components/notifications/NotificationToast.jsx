import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export default function NotificationToast() {
    const { activeToast, setActiveToast } = useNotifications();
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (activeToast) {
            setIsExiting(false);
            const timer = setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => setActiveToast(null), 300);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [activeToast, setActiveToast]);

    if (!activeToast) return null;

    return (
        <div className={`notification-toast ${isExiting ? 'exiting' : ''}`}>
            <div className="toast-icon">
                <Bell size={20} />
            </div>
            <div className="toast-content">
                <div className="toast-title">{activeToast.title}</div>
                <div className="toast-msg">{activeToast.message}</div>
            </div>
            <button
                className="btn-icon"
                style={{ padding: 4, height: 'fit-content' }}
                onClick={() => {
                    setIsExiting(true);
                    setTimeout(() => setActiveToast(null), 300);
                }}
            >
                <X size={14} />
            </button>
        </div>
    );
}
