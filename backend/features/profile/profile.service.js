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
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(filtered)
        .eq('id', userId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateEmployeeCTC = async (targetUserId, ctc) => {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ ctc })
        .eq('id', targetUserId)
        .select('id, full_name, ctc')
        .single();
    if (error) throw error;
    return data;
};

// Admin functions to get/update any profile
export const getEmployeeProfile = async (userId) => {
    return getMyProfile(userId);
};

export const updateEmployeeProfile = async (userId, updates) => {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    if (error) throw error;
    return data;
};
