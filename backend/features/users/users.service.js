import { supabaseAdmin } from '../../config/supabase.js';

export const createUser = async (userData) => {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
    });
    if (authError) throw authError;

    // Insert profile row in profiles table
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: authData.user.id,
            email: userData.email,
            full_name: userData.full_name,
            department: userData.department ?? null,
            designation: userData.designation ?? null,
            date_of_joining: userData.date_of_joining ?? null,
        })
        .select()
        .single();
    if (error) throw error;

    return data;
};

export const getAllUsers = async () => {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select(`
            id, full_name, email, department, designation, created_at,
            phone, address, date_of_birth, emergency_contact, bio, skills, ctc, avatar_url,
            date_of_joining,
            user_roles(role:roles(id, name))
        `)
        .order('created_at', { ascending: false });
    if (error) throw error;

    // Flatten roles array for convenience
    return data.map(u => ({
        ...u,
        roles: u.user_roles?.map(ur => ur.role?.name).filter(Boolean) ?? [],
        user_roles: undefined,
    }));
};

export const getUserById = async (id) => {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select(`
            id, full_name, email, department, designation, created_at,
            phone, address, date_of_birth, emergency_contact, bio, skills, ctc, avatar_url,
            date_of_joining,
            user_roles(role:roles(id, name))
        `)
        .eq('id', id)
        .single();
    if (error) throw error;

    return {
        ...data,
        roles: data.user_roles?.map(ur => ur.role?.name).filter(Boolean) ?? [],
        user_roles: undefined,
    };
};

export const updateUser = async (id, updates) => {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteUser = async (id) => {
    // Delete from Supabase Auth (cascade removes profiles row via FK)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) throw authError;
    return { id };
};
