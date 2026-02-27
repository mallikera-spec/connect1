import * as notificationService from './notifications.service.js';

export const getNotifications = async (req, res) => {
    try {
        const data = await notificationService.getMyNotifications(req.user.id);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markRead = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await notificationService.markAsRead(id, req.user.id);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markAllRead = async (req, res) => {
    try {
        await notificationService.markAllAsRead(req.user.id);
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
