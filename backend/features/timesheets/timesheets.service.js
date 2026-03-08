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

export const updateEntry = async (entryId, updates, user) => {
    // 1. Get current entry state
    const { data: currentEntry, error: fetchError } = await supabaseAdmin
        .from('timesheet_entries')
        .select('*, timesheet:timesheets(user_id)')
        .eq('id', entryId)
        .single();

    if (fetchError || !currentEntry) throw new Error('Entry not found');

    // 2. Implement Locking Logic
    const isAdmin = user?.roles?.some(r =>
        ['super_admin', 'super admin', 'director', 'project_manager', 'project manager', 'hr', 'hr manager', 'tester'].includes(r.toLowerCase())
    );

    const isDeveloper = currentEntry.timesheet?.user_id === user?.id;
    const lockedStatuses = ['done', 'verified']; // 'failed' is also locked until resubmission

    if (!isAdmin && isDeveloper) {
        if (lockedStatuses.includes(currentEntry.status)) {
            throw new Error(`Timesheet entry is locked in ${currentEntry.status} status.`);
        }

        if (currentEntry.status === 'failed' && updates.status !== 'done') {
            throw new Error('This entry failed QA. You must resubmit it by marking it as "done".');
        }
    }

    const allowed = ['title', 'status', 'hours_spent', 'notes', 'task_id', 'admin_feedback', 'project_id', 'developer_reply', 'qa_notes'];
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

// ── Project Timesheets ────────────────────────────────────────────────

export const getEntriesByProject = async (projectId) => {
    // 1. Fetch all task IDs for this project
    const { data: projectTasks, error: tasksErr } = await supabaseAdmin
        .from('tasks')
        .select('id')
        .eq('project_id', projectId);

    if (tasksErr) throw tasksErr;

    const taskIds = projectTasks.map(t => t.id);

    // 2. Build the query to fetch timesheet entries
    // Either directly linked to the project, OR linked to one of the project's tasks
    let query = supabaseAdmin
        .from('timesheet_entries')
        .select(`
            *,
            timesheet:timesheets ( user_id, user:profiles(id, full_name, email) ),
            task:tasks!left ( id, title, project_id, end_time )
        `);

    if (taskIds.length > 0) {
        query = query.or(`project_id.eq.${projectId},task_id.in.(${taskIds.join(',')})`);
    } else {
        query = query.eq('project_id', projectId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(e => ({
        ...e,
        user: e.timesheet?.user,
        work_date: e.timesheet?.work_date
    }));
};
