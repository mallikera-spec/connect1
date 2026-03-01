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
            verified: tasks.filter((t) => t.status === 'verified').length,
            failed: tasks.filter((t) => t.status === 'failed').length,
        },
        total_estimated_hours: parseFloat(totalEstimatedHours.toFixed(2)),
        total_actual_hours: parseFloat(totalActualHours.toFixed(2)),
        tasks,
    };
};

export const getUserReport = async (userId, { startDate, endDate, roles = [] } = {}) => {
    const isTester = roles.includes('Tester') || roles.includes('super_admin') || roles.includes('Super Admin');

    let taskQuery = supabaseAdmin
        .from('tasks')
        .select('id, title, status, actual_hours, estimated_hours, created_at, project:projects(id, name)');

    if (!isTester) {
        taskQuery = taskQuery.eq('assigned_to', userId);
    }

    if (startDate) taskQuery = taskQuery.gte('created_at', startDate);
    if (endDate) {
        const end = endDate.includes('T') ? endDate : `${endDate} 23:59:59.999`;
        taskQuery = taskQuery.lte('created_at', end);
    }

    const { data: tasks, error } = await taskQuery;
    if (error) throw error;

    // Fetch projects where user is a member
    const { count: projectCount, error: projectError } = await supabaseAdmin
        .from('project_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
    if (projectError) throw projectError;

    const totalActualHours = tasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);

    // Fetch timesheet tasks by status for the period
    let tsEntryQuery = supabaseAdmin
        .from('timesheet_entries')
        .select(`
            status,
            timesheet:timesheets!inner(user_id, work_date)
        `);

    if (!isTester) {
        tsEntryQuery = tsEntryQuery.eq('timesheet.user_id', userId);
    }
    if (startDate) tsEntryQuery = tsEntryQuery.gte('timesheet.work_date', startDate);
    if (endDate) tsEntryQuery = tsEntryQuery.lte('timesheet.work_date', endDate);

    const { data: tsEntries } = await tsEntryQuery;
    const tsStats = { todo: 0, in_progress: 0, done: 0, blocked: 0, verified: 0, failed: 0 };
    (tsEntries || []).forEach(e => { if (tsStats[e.status] !== undefined) tsStats[e.status]++; });

    return {
        user_id: userId,
        total_tasks: tasks.length,
        total_projects: projectCount || 0,
        tasks_by_status: {
            pending: tasks.filter((t) => t.status === 'pending').length,
            in_progress: tasks.filter((t) => t.status === 'in_progress').length,
            done: tasks.filter((t) => t.status === 'done').length,
            verified: tasks.filter((t) => t.status === 'verified').length,
            failed: tasks.filter((t) => t.status === 'failed').length,
        },
        timesheet_tasks_by_status: tsStats,
        total_hours_logged: parseFloat(totalActualHours.toFixed(2)),
        tasks,
    };
};

export const getOverallReport = async ({ startDate, endDate } = {}) => {
    let taskQuery = supabaseAdmin
        .from('tasks')
        .select('id, status, actual_hours, estimated_hours, created_at');

    if (startDate) taskQuery = taskQuery.gte('created_at', startDate);
    if (endDate) {
        const end = endDate.includes('T') ? endDate : `${endDate} 23:59:59.999`;
        taskQuery = taskQuery.lte('created_at', end);
    }

    const { data: tasks, error: taskError } = await taskQuery;
    if (taskError) throw taskError;

    const { count: userCount } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    const { count: projectCount } = await supabaseAdmin
        .from('projects')
        .select('*', { count: 'exact', head: true });

    const totalActualHours = tasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);

    // Overall timesheet status aggregation for the period
    let tsQuery = supabaseAdmin
        .from('timesheet_entries')
        .select(`
            status,
            timesheet:timesheets!inner(work_date)
        `);

    if (startDate) tsQuery = tsQuery.gte('timesheet.work_date', startDate);
    if (endDate) tsQuery = tsQuery.lte('timesheet.work_date', endDate);

    const { data: tsEntries } = await tsQuery;
    const tsStats = { todo: 0, in_progress: 0, done: 0, blocked: 0, verified: 0, failed: 0 };
    (tsEntries || []).forEach(e => { if (tsStats[e.status] !== undefined) tsStats[e.status]++; });

    return {
        total_users: userCount,
        total_projects: projectCount,
        total_tasks: tasks.length,
        tasks_by_status: {
            pending: tasks.filter((t) => t.status === 'pending').length,
            in_progress: tasks.filter((t) => t.status === 'in_progress').length,
            done: tasks.filter((t) => t.status === 'done').length,
            verified: tasks.filter((t) => t.status === 'verified').length,
            failed: tasks.filter((t) => t.status === 'failed').length,
        },
        timesheet_tasks_by_status: tsStats,
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

    const { data, error } = await q;
    if (error) throw error;

    const parseTime = (timeStr) => {
        if (!timeStr || !timeStr.includes(':')) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return (h * 60) + m;
    };

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

export const getEmployeeOverview = async ({ startDate, endDate } = {}) => {
    // Fetch all profiles with roles
    const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select(`
            id, full_name, email, department, designation, avatar_url,
            user_roles(role:roles(name))
        `);
    if (profileError) throw profileError;

    // Filter out Super Admins and Management department
    const filteredProfiles = profiles.filter(p => {
        const roles = p.user_roles?.map(ur => ur.role?.name) || [];
        const isSuperAdmin = roles.includes('Super Admin') || roles.includes('super_admin');
        const isManagement = p.department?.toLowerCase() === 'management';
        return !isSuperAdmin && !isManagement;
    });

    // Fetch tasks
    let taskQuery = supabaseAdmin
        .from('tasks')
        .select('assigned_to, status, actual_hours, created_at');

    if (startDate) taskQuery = taskQuery.gte('created_at', startDate);
    if (endDate) {
        const end = endDate.includes('T') ? endDate : `${endDate} 23:59:59.999`;
        taskQuery = taskQuery.lte('created_at', end);
    }

    const { data: tasks, error: taskError } = await taskQuery;
    if (taskError) throw taskError;

    // Fetch timesheet entries for the period
    let tsQuery = supabaseAdmin
        .from('timesheet_entries')
        .select(`
            id, hours_spent, title,
            timesheet:timesheets (
                work_date,
                user_id
            ),
            task:tasks (
                id,
                title,
                project:projects (id, name)
            )
        `);

    if (startDate) tsQuery = tsQuery.gte('timesheet.work_date', startDate);
    if (endDate) tsQuery = tsQuery.lte('timesheet.work_date', endDate);

    const { data: tsEntries, error: tsError } = await tsQuery;

    // Aggregate metrics by user
    const userMetrics = {};
    filteredProfiles.forEach(p => {
        userMetrics[p.id] = {
            id: p.id,
            full_name: p.full_name,
            email: p.email,
            department: p.department,
            designation: p.designation,
            avatar_url: p.avatar_url,
            total_tasks: 0,
            pending_tasks: 0,
            done_tasks: 0,
            total_hours: 0,
            timesheet_items: [],
            sales_stats: null // For BDMs/Marketing
        };
    });

    // Identify BDMs and fetch leads
    const bdmProfileIds = filteredProfiles
        .filter(p => {
            const roles = p.user_roles?.map(ur => ur.role?.name) || [];
            return roles.includes('BDM') || p.department?.toLowerCase() === 'marketing';
        })
        .map(p => p.id);

    let leads = [];
    if (bdmProfileIds.length > 0) {
        // Initialize sales_stats for all identified BDMs
        bdmProfileIds.forEach(id => {
            if (userMetrics[id]) {
                userMetrics[id].sales_stats = {
                    total_leads: 0,
                    won_count: 0,
                    won_value: 0,
                    pipeline_value: 0,
                    quotation_count: 0,
                    conversion_rate: 0
                };
            }
        });

        let leadQuery = supabaseAdmin
            .from('leads')
            .select('assigned_agent_id, status, deal_value, created_at')
            .in('assigned_agent_id', bdmProfileIds);
        if (startDate) leadQuery = leadQuery.gte('created_at', startDate);
        if (endDate) {
            const end = endDate.includes('T') ? endDate : `${endDate} 23:59:59.999`;
            leadQuery = leadQuery.lte('created_at', end);
        }
        const { data: leadsData } = await leadQuery;
        leads = leadsData || [];
    }

    tasks.forEach(t => {
        if (t.assigned_to && userMetrics[t.assigned_to]) {
            const m = userMetrics[t.assigned_to];
            m.total_tasks++;
            if (['done', 'verified'].includes(t.status)) m.done_tasks++;
            else m.pending_tasks++;
        }
    });

    // Aggregate sales metrics for BDMs
    leads.forEach(l => {
        if (l.assigned_agent_id && userMetrics[l.assigned_agent_id]) {
            const m = userMetrics[l.assigned_agent_id];
            const s = m.sales_stats;
            if (!s) return; // Should not happen now

            const val = parseFloat(l.deal_value || 0);
            s.total_leads++;
            if (l.status === 'Won') {
                s.won_count++;
                s.won_value += val;
            } else if (l.status === 'Proposal') {
                s.pipeline_value += val;
            }
            if (['Proposal', 'Won'].includes(l.status)) {
                s.quotation_count++;
            }
        }
    });

    // Calculate conversion rates
    Object.values(userMetrics).forEach(m => {
        if (m.sales_stats && m.sales_stats.total_leads > 0) {
            m.sales_stats.conversion_rate = (m.sales_stats.won_count / m.sales_stats.total_leads) * 100;
        }
    });

    if (tsEntries) {
        tsEntries.forEach(entry => {
            const userId = entry.timesheet?.user_id;
            const workDate = entry.timesheet?.work_date;

            // Manual date check if query filter was broad
            if (startDate && workDate < startDate) return;
            if (endDate && workDate > endDate) return;

            if (userId && userMetrics[userId]) {
                const m = userMetrics[userId];

                // Helper to parse HH:MM to decimal hours for summing
                const parseTime = (timeStr) => {
                    if (!timeStr || !timeStr.includes(':')) return 0;
                    const [h, m] = timeStr.split(':').map(Number);
                    return h + (m / 60);
                };

                const hours = parseTime(entry.hours_spent);
                m.total_hours += hours;
                m.timesheet_items.push({
                    id: entry.id,
                    title: entry.title,
                    hours: entry.hours_spent,
                    date: workDate,
                    project: entry.task?.project?.name || 'No Project'
                });
            }
        });
    }

    // Group by department
    const grouped = {};
    Object.values(userMetrics).forEach(m => {
        const dept = m.department || 'Other';
        if (!grouped[dept]) grouped[dept] = [];
        grouped[dept].push({
            ...m,
            total_hours: parseFloat(m.total_hours.toFixed(2))
        });
    });

    return grouped;
};

export const getHROverview = async ({ startDate, endDate } = {}) => {
    const { count: employeeCount } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    const { data: depts } = await supabaseAdmin.from('profiles').select('department');
    const uniqueDepts = new Set(depts?.filter(d => Boolean(d.department)).map(d => d.department)).size;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentHires } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, created_at, designation, department, avatar_url')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(10);

    return {
        total_employees: employeeCount || 0,
        total_departments: uniqueDepts || 0,
        recent_hires: recentHires || []
    };
};
