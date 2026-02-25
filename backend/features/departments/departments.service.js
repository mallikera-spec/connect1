import { supabaseAdmin } from '../../config/supabase.js';

// departments table: id, name, description, created_at

export const getAllDepartments = async () => {
    const { data, error } = await supabaseAdmin
        .from('departments')
        .select('*')
        .order('name', { ascending: true });
    if (error) throw error;
    return data;
};

export const createDepartment = async (deptData) => {
    const { data, error } = await supabaseAdmin
        .from('departments')
        .insert(deptData)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateDepartment = async (id, updates) => {
    const { data, error } = await supabaseAdmin
        .from('departments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteDepartment = async (id) => {
    const { error } = await supabaseAdmin.from('departments').delete().eq('id', id);
    if (error) throw error;
    return { id };
};
