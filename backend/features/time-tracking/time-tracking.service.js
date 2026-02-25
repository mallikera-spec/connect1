import { supabaseAdmin } from '../../config/supabase.js';

// Time tracking uses start_time / end_time columns on the tasks table directly.
// No separate time_entries table exists.

export const startTimer = async (taskId, userId) => {
    // Check the task belongs to/assigned to the user and isn't already running
    const { data: task, error: findError } = await supabaseAdmin
        .from('tasks')
        .select('id, start_time, end_time, assigned_to')
        .eq('id', taskId)
        .single();

    if (findError) throw findError;

    if (task.start_time && !task.end_time) {
        const err = new Error('Timer is already running for this task');
        err.statusCode = 409;
        throw err;
    }

    const { data, error } = await supabaseAdmin
        .from('tasks')
        .update({ start_time: new Date().toISOString(), end_time: null, status: 'in_progress' })
        .eq('id', taskId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const stopTimer = async (taskId, userId) => {
    const { data: task, error: findError } = await supabaseAdmin
        .from('tasks')
        .select('id, start_time, end_time')
        .eq('id', taskId)
        .single();

    if (findError) throw findError;

    if (!task.start_time || task.end_time) {
        const err = new Error('No active timer found for this task');
        err.statusCode = 404;
        throw err;
    }

    // Set end_time — the DB trigger auto-calculates actual_hours
    const { data, error } = await supabaseAdmin
        .from('tasks')
        .update({ end_time: new Date().toISOString(), status: 'done' })
        .eq('id', taskId)
        .select()
        .single();

    if (error) throw error;
    return data;
};
