import { supabaseAdmin } from "../../config/supabase.js"

export const getNotesByProject = async (projectId) => {
    const { data, error } = await supabaseAdmin
        .from('project_notes')
        .select(`
            *,
            creator:profiles!created_by(full_name, email)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const addNote = async (noteData) => {
    // noteData: { project_id, content, created_by, type, title, meta }
    const { data, error } = await supabaseAdmin
        .from('project_notes')
        .insert([noteData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateNote = async (noteId, updates) => {
    const { data, error } = await supabaseAdmin
        .from('project_notes')
        .update(updates)
        .eq('id', noteId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteNote = async (noteId) => {
    const { error } = await supabaseAdmin
        .from('project_notes')
        .delete()
        .eq('id', noteId);

    if (error) throw error;
    return true;
};
