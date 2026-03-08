import { supabaseAdmin } from '../../config/supabase.js';

export const getFilesByLead = async (leadId) => {
    const { data, error } = await supabaseAdmin
        .from('lead_files')
        .select(`
            *,
            uploader:profiles!uploaded_by(id, full_name, email)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const addFile = async (fileData) => {
    const { data, error } = await supabaseAdmin
        .from('lead_files')
        .insert([fileData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteFile = async (id) => {
    const { error } = await supabaseAdmin
        .from('lead_files')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};
