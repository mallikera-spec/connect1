import { supabaseAdmin } from '../../config/supabase.js';

// ── Timesheet (one per user per day) ─────────────────────────────────

export const getOrCreateTimesheet = async (userId, workDate) => {
    // Try to fetch existing
    const { data: existing } = await supabaseAdmin
        .from('timesheets')
        .select('*, entries:timesheet_entries(*, project:projects(id, name), task:tasks(id, title, project:projects(id, name)))')
        .eq('user_id', userId)
        .eq('work_date', workDate)
        .maybeSingle();

    if (existing) return existing;

    // Create new
    const { data, error } = await supabaseAdmin
        .from('timesheets')
        .insert({ user_id: userId, work_date: workDate })
        .select('*, entries:timesheet_entries(*)')
        .single();
    if (error) throw error;
    return data;
};

export const getTimesheetByDate = async (userId, workDate) => {
    const { data, error } = await supabaseAdmin
        .from('timesheets')
        .select('*, entries:timesheet_entries(*, project:projects(id, name), task:tasks(id, title, project:projects(id, name)))')
        .eq('user_id', userId)
        .eq('work_date', workDate)
        .maybeSingle();
    if (error) throw error;
    return data; // null if no timesheet for that day
};

export const getMyTimesheets = async (userId, filters = {}) => {
    return getAllTimesheets({ ...filters, userId });
};

export const getAllTimesheets = async ({ userId, date, startDate, endDate, userIds } = {}) => {
    let q = supabaseAdmin
        .from('timesheets')
        .select(`
            *,
            user:profiles(id, full_name, email),
            entries:timesheet_entries(
                *,
                project:projects(id, name),
                task:tasks(
                    id, 
                    title, 
                    project:projects(id, name)
                )
            )
        `)
        .order('work_date', { ascending: false });

    if (userId) q = q.eq('user_id', userId);
    if (userIds && Array.isArray(userIds) && userIds.length > 0) q = q.in('user_id', userIds);
    if (date) q = q.eq('work_date', date);
    if (startDate) q = q.gte('work_date', startDate);
    if (endDate) q = q.lte('work_date', endDate);

    const { data, error } = await q;
    if (error) throw error;
    return data;
};

// ── Timesheet Entries ─────────────────────────────────────────────────

export const addEntry = async (timesheetId, entryData) => {
    const { data, error } = await supabaseAdmin
        .from('timesheet_entries')
        .insert({ ...entryData, timesheet_id: timesheetId })
        .select(`
            *,
            project:projects(id, name),
            task:tasks(id, title, project:projects(id, name))
        `)
        .single();

    if (error) throw error;

    // Capture submission time if it's the first entry for this timesheet
    const { data: ts } = await supabaseAdmin
        .from('timesheets')
        .select('submitted_at')
        .eq('id', timesheetId)
        .single();

    if (ts && !ts.submitted_at) {
        await supabaseAdmin
            .from('timesheets')
            .update({ submitted_at: new Date().toISOString() })
            .eq('id', timesheetId);
    }

    return data;
};

export const updateEntry = async (entryId, updates) => {
    const allowed = ['title', 'status', 'hours_spent', 'notes', 'task_id', 'admin_feedback', 'project_id', 'developer_reply'];
    const filtered = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
    const { data, error } = await supabaseAdmin
        .from('timesheet_entries')
        .update(filtered)
        .eq('id', entryId)
        .select(`
            *,
            project:projects(id, name),
            task:tasks(id, title, project:projects(id, name))
        `)
        .single();
    if (error) throw error;
    return data;
};

export const deleteEntry = async (entryId) => {
    const { error } = await supabaseAdmin.from('timesheet_entries').delete().eq('id', entryId);
    if (error) throw error;
    return { id: entryId };
};
