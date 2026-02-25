import { supabaseAdmin } from '../../config/supabase.js';

// No time_entries table — reporting uses actual_hours on tasks (auto-calculated by DB trigger)

export const getProjectReport = async (projectId) => {
    const { data: tasks, error } = await supabaseAdmin
        .from('tasks')
        .select('id, title, status, priority, estimated_hours, actual_hours, assigned_to')
        .eq('project_id', projectId);
    if (error) throw error;

    const totalActualHours = tasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);
    const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);

    return {
        project_id: projectId,
        total_tasks: tasks.length,
        tasks_by_status: {
            pending: tasks.filter((t) => t.status === 'pending').length,
            in_progress: tasks.filter((t) => t.status === 'in_progress').length,
            done: tasks.filter((t) => t.status === 'done').length,
        },
        total_estimated_hours: parseFloat(totalEstimatedHours.toFixed(2)),
        total_actual_hours: parseFloat(totalActualHours.toFixed(2)),
        tasks,
    };
};

export const getUserReport = async (userId) => {
    const { data: tasks, error } = await supabaseAdmin
        .from('tasks')
        .select('id, title, status, actual_hours, estimated_hours, project:projects(id, name)')
        .eq('assigned_to', userId);
    if (error) throw error;

    // Fetch projects where user is a member
    const { count: projectCount, error: projectError } = await supabaseAdmin
        .from('project_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
    if (projectError) throw projectError;

    const totalActualHours = tasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);

    return {
        user_id: userId,
        total_tasks: tasks.length,
        total_projects: projectCount || 0,
        tasks_by_status: {
            pending: tasks.filter((t) => t.status === 'pending').length,
            in_progress: tasks.filter((t) => t.status === 'in_progress').length,
            done: tasks.filter((t) => t.status === 'done').length,
        },
        total_hours_logged: parseFloat(totalActualHours.toFixed(2)),
        tasks,
    };
};

export const getOverallReport = async () => {
    const { data: tasks, error: taskError } = await supabaseAdmin
        .from('tasks')
        .select('id, status, actual_hours, estimated_hours');
    if (taskError) throw taskError;

    const { count: userCount } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    const { count: projectCount } = await supabaseAdmin
        .from('projects')
        .select('*', { count: 'exact', head: true });

    const totalActualHours = tasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);

    return {
        total_users: userCount,
        total_projects: projectCount,
        total_tasks: tasks.length,
        tasks_by_status: {
            pending: tasks.filter((t) => t.status === 'pending').length,
            in_progress: tasks.filter((t) => t.status === 'in_progress').length,
            done: tasks.filter((t) => t.status === 'done').length,
        },
        total_hours_logged: parseFloat(totalActualHours.toFixed(2)),
    };
};

export const getDeveloperCalendarSummary = async ({ startDate, endDate, projectId } = {}) => {
    let q = supabaseAdmin
        .from('timesheet_entries')
        .select(`
            id,
            hours_spent,
            title,
            timesheet:timesheets (
                work_date,
                user:profiles (id, full_name, email, ctc)
            ),
            task:tasks (
                id,
                title,
                project:projects (id, name)
            )
        `);

    if (startDate) q = q.gte('timesheet.work_date', startDate);
    if (endDate) q = q.lte('timesheet.work_date', endDate);
    // Note: PostgREST doesn't support easy filtering on nested relations in some setups, 
    // but we can filter the result or use a more complex query if needed.
    // For now, let's fetch and filter in JS if the nested filter fails.

    const { data, error } = await q;
    if (error) throw error;

    const parseTime = (timeStr) => {
        if (!timeStr || !timeStr.includes(':')) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return (h * 60) + m;
    };

    // Aggregate by User and Project
    const aggregation = {};

    data.forEach(entry => {
        const user = entry.timesheet?.user;
        const project = entry.task?.project;

        if (!user || !project) return;
        if (projectId && project.id !== projectId) return;

        const key = `${user.id}_${project.id}`;
        if (!aggregation[key]) {
            aggregation[key] = {
                userId: user.id,
                userName: user.full_name,
                userEmail: user.email,
                userCTC: user.ctc || 0,
                projectId: project.id,
                projectName: project.name,
                totalMinutes: 0,
            };
        }
        aggregation[key].totalMinutes += parseTime(entry.hours_spent);
    });

    const result = Object.values(aggregation).map(item => {
        const totalHours = item.totalMinutes / 60;
        const manDays = totalHours / 8; // 1 day = 8 hours
        const dailyRate = item.userCTC / 22; // Assumes monthly CTC and 22 working days
        const estimatedCost = manDays * dailyRate;

        return {
            ...item,
            totalHours: parseFloat(totalHours.toFixed(2)),
            manDays: parseFloat(manDays.toFixed(2)),
            estimatedCost: parseFloat(estimatedCost.toFixed(2))
        };
    });

    return result;
};
