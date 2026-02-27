import { supabaseAdmin } from '../../config/supabase.js';

export const createNotification = async ({ userId, type, title, message, data = {} }) => {
    const { data: notification, error } = await supabaseAdmin
        .from('notifications')
        .insert({
            user_id: userId,
            type,
            title,
            message,
            data
        })
        .select()
        .single();

    if (error) throw error;
    return notification;
};

export const getMyNotifications = async (userId) => {
    const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) throw error;
    return data;
};

export const markAsRead = async (id, userId) => {
    const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', userId) // Ensure user only marks their own
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const markAllAsRead = async (userId) => {
    const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) throw error;
    return data;
};
