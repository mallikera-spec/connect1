import { supabaseAdmin } from '../../config/supabase.js';

export const getMyProfile = async (userId) => {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) throw error;
    return data;
};

export const updateMyProfile = async (userId, updates) => {
    // Fields employees can update themselves (not ctc)
    const allowed = [
        'full_name', 'phone', 'address', 'date_of_birth', 'emergency_contact',
        'bio', 'skills', 'avatar_url', 'alternate_phone', 'blood_group',
        'education_qualification', 'x_year', 'xii_year',
        'bank_name', 'bank_ifsc', 'bank_account_no', 'pan_number', 'aadhar_number'
    ];
    const filtered = Object.fromEntries(
        Object.entries(updates).filter(([k]) => allowed.includes(k))
    );

    // If nothing to update, just return current profile
    if (Object.keys(filtered).length === 0) {
        return getMyProfile(userId);
    }

    // 1. Try update by id first
    const { data: updateData, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(filtered)
        .eq('id', userId)
        .select()
        .single();

    if (updateError && updateError.code === 'PGRST116') {
        // 2. Fetch from Auth to get email/name
        const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (authErr) throw authErr;

        const email = authUser.user.email;
        const fullNameFromAuth = authUser.user.user_metadata?.full_name || email.split('@')[0];

        // 3. Try to update an orphaned row with same email (link to this id)
        const { data: emailUpdateData, error: emailUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({ id: userId, ...filtered })
            .eq('email', email)
            .select()
            .single();

        if (!emailUpdateError) return emailUpdateData;

        // 4. Finally, insert fresh row if no row by id or email exists
        const { data: insertData, error: insertError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: userId,
                email: email,
                full_name: filtered.full_name || fullNameFromAuth,
                ...filtered
            })
            .select()
            .single();

        if (insertError) throw insertError;
        return insertData;
    }

    if (updateError) throw updateError;
    return updateData;
};

export const updateEmployeeCTC = async (targetUserId, ctc) => {
    // 1. Try update by id
    const { data: updateData, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ ctc, base_salary: ctc })
        .eq('id', targetUserId)
        .select('id, full_name, ctc, base_salary')
        .single();

    if (updateError && updateError.code === 'PGRST116') {
        // 2. Fetch from Auth
        const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
        if (authErr) throw authErr;

        const email = authUser.user.email;

        // 3. Try update orphaned row by email
        const { data: emailUpdateData, error: emailUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({ id: targetUserId, ctc, base_salary: ctc })
            .eq('email', email)
            .select('id, full_name, ctc, base_salary')
            .single();

        if (!emailUpdateError) return emailUpdateData;

        // 4. Insert fresh
        const { data: insertData, error: insertError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: targetUserId,
                email: email,
                full_name: authUser.user.user_metadata?.full_name || email.split('@')[0],
                ctc,
                base_salary: ctc
            })
            .select('id, full_name, ctc, base_salary')
            .single();

        if (insertError) throw insertError;
        return insertData;
    }

    if (updateError) throw updateError;
    return updateData;
};

// Admin functions to get/update any profile
export const getEmployeeProfile = async (userId) => {
    return getMyProfile(userId);
};

export const updateEmployeeProfile = async (userId, updates) => {
    // Sync duplicate columns if present
    const payload = { ...updates };
    if (payload.ctc !== undefined) payload.base_salary = payload.ctc;
    if (payload.date_of_joining !== undefined) payload.joining_date = payload.date_of_joining;

    // If nothing to update, return current
    if (Object.keys(payload).length === 0) {
        return getEmployeeProfile(userId);
    }

    // 1. Try update by id
    const { data: updateData, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(payload)
        .eq('id', userId)
        .select()
        .single();

    if (updateError && updateError.code === 'PGRST116') {
        // 2. Fetch from Auth
        const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (authErr) throw authErr;

        const email = authUser.user.email;

        // 3. Try update orphaned row by email
        const { data: emailUpdateData, error: emailUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({ id: userId, ...payload })
            .eq('email', email)
            .select()
            .single();

        if (!emailUpdateError) return emailUpdateData;

        // 4. Insert fresh
        const { data: insertData, error: insertError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: userId,
                email: email,
                full_name: payload.full_name || authUser.user.user_metadata?.full_name || email.split('@')[0],
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
