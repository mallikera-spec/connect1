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
            joining_date: userData.date_of_joining ?? null,
            ctc: userData.ctc ?? 0,
            base_salary: userData.ctc ?? 0,
        })
        .select()
        .single();
    if (error) throw error;

    return data;
};

export const getAllUsers = async ({ requesterId, requesterRoles = [], ...filters } = {}) => {
    const isPrivileged = requesterRoles.some(role => {
        const r = String(role).toLowerCase();
        return r.includes('admin') || r.includes('hr') || r.includes('manager') || r.includes('director');
    });

    let query = supabaseAdmin
        .from('profiles')
        .select(`
            id, full_name, email, department, designation, created_at,
            phone, address, date_of_birth, emergency_contact, bio, skills, ctc, avatar_url,
            date_of_joining, joining_date, base_salary,
            user_roles(role:roles(id, name))
        `);

    // Server-side filtering
    if (!isPrivileged && requesterId) {
        query = query.eq('id', requesterId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    // Flatten and filter
    let users = data.map(u => ({
        ...u,
        roles: u.user_roles?.map(ur => ur.role?.name).filter(Boolean) ?? [],
        user_roles: undefined,
    }));

    if (filters.role) {
        const roles = filters.role.split(',').map(r => r.trim());
        users = users.filter(u => u.roles.some(r => roles.includes(r)));
    }

    return users;
};

export const getUserById = async (id, { requesterId, requesterRoles = [] } = {}) => {
    const isPrivileged = requesterRoles.some(role => {
        const r = String(role).toLowerCase();
        return r.includes('admin') || r.includes('hr') || r.includes('manager') || r.includes('director');
    });

    if (!isPrivileged && requesterId && requesterId !== id) {
        throw { statusCode: 403, message: 'You are not authorized to view this profile' };
    }

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select(`
            id, full_name, email, department, designation, created_at,
            phone, address, date_of_birth, emergency_contact, bio, skills, ctc, avatar_url,
            date_of_joining, joining_date, base_salary,
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
    const payload = { ...updates };

    // Bidirectional sync for redundant fields
    if (payload.ctc !== undefined) payload.base_salary = payload.ctc;
    else if (payload.base_salary !== undefined) payload.ctc = payload.base_salary;

    if (payload.date_of_joining !== undefined) payload.joining_date = payload.date_of_joining;
    else if (payload.joining_date !== undefined) payload.date_of_joining = payload.joining_date;

    // 1. Try update by id first
    const { data: updateData, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (updateError && updateError.code === 'PGRST116') {
        // 2. Fetch from Auth to get email/name
        const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.getUserById(id);
        if (authErr) throw authErr;

        const email = authUser.user.email;
        const fullNameFromAuth = authUser.user.user_metadata?.full_name || email.split('@')[0];

        // 3. Try update orphaned row by email
        const { data: emailUpdateData, error: emailUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({ id, ...payload })
            .eq('email', email)
            .select()
            .single();

        if (!emailUpdateError) return emailUpdateData;

        // 4. Finally, insert fresh
        const { data: insertData, error: insertError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id,
                email,
                full_name: payload.full_name || fullNameFromAuth,
                ...payload
            })
            .select()
            .single();

        if (insertError) throw insertError;
        return insertData;
    }

    if (updateError) throw updateError;
    return updateData;
};

export const deleteUser = async (id) => {
    // Delete from Supabase Auth (cascade removes profiles row via FK)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) throw authError;
    return { id };
};
