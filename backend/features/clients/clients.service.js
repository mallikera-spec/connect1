import { supabaseAdmin } from '../../config/supabase.js';

export const createClient = async (clientData, ownerId) => {
    const { data, error } = await supabaseAdmin
        .from('clients')
        .insert([{ ...clientData, owner_id: ownerId }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const getAllClients = async (options = {}) => {
    let query = supabaseAdmin
        .from('clients')
        .select(`
            *,
            owner:profiles!clients_owner_id_fkey(full_name, email),
            projects(*)
        `)
        .order('created_at', { ascending: false });

    if (options.ownerId) {
        query = query.eq('owner_id', options.ownerId);
    }

    if (options.status) {
        query = query.eq('status', options.status);
    }

    if (options.search) {
        query = query.or(`company_name.ilike.%${options.search}%,contact_name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
};

export const getClientById = async (id) => {
    const { data, error } = await supabaseAdmin
        .from('clients')
        .select(`
            *,
            owner:profiles!clients_owner_id_fkey(full_name, email)
        `)
        .eq('id', id)
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const updateClient = async (id, updateData) => {
    const { data, error } = await supabaseAdmin
        .from('clients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const deleteClient = async (id) => {
    const { data, error } = await supabaseAdmin
        .from('clients')
        .delete()
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};
