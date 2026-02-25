import { supabaseAdmin } from '../../config/supabase.js';

export const getAllDesignations = async () => {
    const { data, error } = await supabaseAdmin
        .from('designations')
        .select(`
      id,
      name,
      description,
      department_id,
      department:departments(id, name),
      created_at
    `)
        .order('name', { ascending: true });
    if (error) throw error;
    return data;
};

export const createDesignation = async (payload) => {
    const { data, error } = await supabaseAdmin
        .from('designations')
        .insert(payload)
        .select(`id, name, description, department_id, department:departments(id, name), created_at`)
        .single();
    if (error) throw error;
    return data;
};

export const updateDesignation = async (id, updates) => {
    const { data, error } = await supabaseAdmin
        .from('designations')
        .update(updates)
        .eq('id', id)
        .select(`id, name, description, department_id, department:departments(id, name), created_at`)
        .single();
    if (error) throw error;
    return data;
};

export const deleteDesignation = async (id) => {
    const { error } = await supabaseAdmin.from('designations').delete().eq('id', id);
    if (error) throw error;
    return { id };
};
