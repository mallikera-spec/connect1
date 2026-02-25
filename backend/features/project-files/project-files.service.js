import { supabaseAdmin } from '../../config/supabase.js';

export const getFilesByProject = async (projectId) => {
    const { data, error } = await supabaseAdmin
        .from('project_files')
        .select(`
            *,
            uploader:profiles!uploaded_by(full_name, email)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const addFile = async (fileData) => {
    const { data, error } = await supabaseAdmin
        .from('project_files')
        .insert([fileData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteFile = async (fileId) => {
    const { error } = await supabaseAdmin
        .from('project_files')
        .delete()
        .eq('id', fileId);

    if (error) throw error;
    return true;
};
