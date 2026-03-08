import { supabaseAdmin } from '../../config/supabase.js';

export const createFeedback = async ({ item_type, item_id, author_id, content, new_status }) => {
    const { data, error } = await supabaseAdmin
        .from('qa_feedback')
        .insert({ item_type, item_id, author_id, content, new_status })
        .select(`
            *,
            author:profiles!author_id(id, full_name, email)
        `)
        .single();

    if (error) throw error;
    return data;
};

export const getFeedbackForItem = async (item_type, item_id) => {
    const { data, error } = await supabaseAdmin
        .from('qa_feedback')
        .select(`
            *,
            author:profiles!author_id(id, full_name, email)
        `)
        .eq('item_type', item_type)
        .eq('item_id', item_id)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
};
