import { supabaseAdmin } from '../../config/supabase.js';

// Helper to parse time strings like "HH:MM" or numeric strings to decimal hours
const parseTime = (timeStr) => {
    if (timeStr === null || timeStr === undefined) return 0;
    if (typeof timeStr === 'number') return timeStr;
    const str = String(timeStr).trim();
    if (!str) return 0;

    if (str.includes(':')) {
        const [h, m] = str.split(':').map(Number);
        return (isNaN(h) ? 0 : h) + (isNaN(m) ? 0 : m / 60);
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
};

// No time_entries table — reporting uses actual_hours on tasks (auto-calculated by DB trigger)

export const getProjectReport = async (projectId) => {
    // 1. Fetch Project Details
    const { data: project } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    // 2. Fetch Tasks with Assignee Details
    const { data: tasks, error: tasksError } = await supabaseAdmin
        .from('tasks')
        .select(`
            id, title, status, priority, estimated_hours, actual_hours, assigned_to,
            assignee:profiles!tasks_assigned_to_fkey(id, full_name)
        `)
        .eq('project_id', projectId);
    if (tasksError) throw tasksError;

    // 3. Fetch Timesheet Entries for the project (either direct or via tasks)
    const taskIds = (tasks || []).map(t => t.id);
    let tsQuery = supabaseAdmin
        .from('timesheet_entries')
        .select(`
            *,
            timesheet:timesheets(user_id)
        `);

    if (taskIds.length > 0) {
        tsQuery = tsQuery.or(`project_id.eq.${projectId},task_id.in.(${taskIds.join(',')})`);
    } else {
        tsQuery = tsQuery.eq('project_id', projectId);
    }
    const { data: timesheetEntries, error: tsError } = await tsQuery;
    if (tsError) throw tsError;

    // 4. Calculate stats for summary cards
    // Use timesheet entries for actual hours to ensure consistency with costing
    const totalActualHours = timesheetEntries.reduce((sum, te) => sum + parseTime(te.hours_spent), 0);
    const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);

    // --- Development Costing Logic ---
    // Hourly Rate = CTC / (12 months * 22 days * 8 hours) => CTC / 2112
    const WORKING_HOURS_PER_YEAR = 12 * 22 * 8;

    // Get all user CTCs for people who worked on this project
    const userIds = [...new Set(timesheetEntries.map(te => te.timesheet?.user_id))].filter(Boolean);
    const { data: userProfiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, ctc')
        .in('id', userIds);

    const profileMap = Object.fromEntries((userProfiles || []).map(p => [p.id, p]));

    // Aggregate time and cost per user
    const userCosting = {};
    timesheetEntries.forEach(te => {
        const uId = te.timesheet?.user_id;
        const profile = profileMap[uId];
        if (!profile) return;

        const hours = parseTime(te.hours_spent);
        const annualCTC = parseFloat(profile.ctc || 0);
        const hourlyRate = annualCTC / WORKING_HOURS_PER_YEAR;
        const cost = hours * hourlyRate;

        if (!userCosting[uId]) {
            userCosting[uId] = {
                id: uId,
                name: profile.full_name,
                totalHours: 0,
                hourlyRate: parseFloat(hourlyRate.toFixed(2)),
                totalCost: 0
            };
        }
        userCosting[uId].totalHours += hours;
        userCosting[uId].totalCost += cost;
    });

    const costingBreakdown = Object.values(userCosting).map(item => ({
        ...item,
        totalHours: parseFloat(item.totalHours.toFixed(2)),
        totalCost: parseFloat(item.totalCost.toFixed(2))
    }));

    const totalProjectCost = costingBreakdown.reduce((sum, item) => sum + item.totalCost, 0);

    return {
        project,
        project_id: projectId,
        total_tasks: tasks.length,
        tasks_by_status: {
            pending: tasks.filter((t) => String(t.status).toLowerCase() === 'pending').length,
            in_progress: tasks.filter((t) => String(t.status).toLowerCase() === 'in_progress').length,
            done: tasks.filter((t) => String(t.status).toLowerCase() === 'done').length,
            verified: tasks.filter((t) => String(t.status).toLowerCase() === 'verified').length,
            failed: tasks.filter((t) => String(t.status).toLowerCase() === 'failed').length,
        },
        total_estimated_hours: parseFloat(totalEstimatedHours.toFixed(2)),
        total_actual_hours: parseFloat(totalActualHours.toFixed(2)),
        total_project_cost: parseFloat(totalProjectCost.toFixed(2)),
        costing_breakdown: costingBreakdown,
        tasks,
    };
};

export const getUserReport = async (userId, { startDate, endDate, roles = [] } = {}) => {
    const isTester = roles.map(r => String(r).toLowerCase()).includes('tester') ||
        roles.map(r => String(r).toLowerCase()).includes('super admin') ||
        roles.map(r => String(r).toLowerCase()).includes('super_admin');

    const sDate = startDate ? startDate.slice(0, 10) : null;
    const eDate = endDate ? endDate.slice(0, 10) : null;

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

    // Fetch timesheet tasks by status for the period
    let tsEntryQuery = supabaseAdmin
        .from('timesheet_entries')
        .select(`
            status,
            project_id,
            title,
            hours_spent,
            timesheet:timesheets!inner(user_id, work_date)
        `);

    if (!isTester) {
        tsEntryQuery = tsEntryQuery.eq('timesheet.user_id', userId);
    }
    if (sDate) tsEntryQuery = tsEntryQuery.gte('timesheet.work_date', sDate);
    if (eDate) tsEntryQuery = tsEntryQuery.lte('timesheet.work_date', eDate);

    const { data: tsEntries } = await tsEntryQuery;
    const totalActualHours = (tsEntries || []).reduce((sum, e) => {
        const workDate = e.timesheet?.work_date;
        if (sDate && workDate < sDate) return sum;
        if (eDate && workDate > eDate) return sum;
        return sum + parseTime(e.hours_spent);
    }, 0);

    const tsStats = { todo: 0, in_progress: 0, done: 0, blocked: 0, verified: 0, failed: 0 };
    (tsEntries || []).forEach(e => {
        const workDate = e.timesheet?.work_date;
        if (sDate && workDate < sDate) return;
        if (eDate && workDate > eDate) return;

        const status = String(e.status || '').toLowerCase();
        if (tsStats[status] !== undefined) tsStats[status]++;
    });

    // Calculate dynamic project count for Testers/Admins based on active work
    let finalProjectCount = 0;
    if (isTester) {
        const activeProjectIds = new Set();
        tasks.forEach(t => { if (t.project?.id) activeProjectIds.add(t.project.id); });
        (tsEntries || []).forEach(e => { if (e.project_id) activeProjectIds.add(e.project_id); });
        finalProjectCount = activeProjectIds.size;
    } else {
        // For others, use project membership count
        const { count: projectCount } = await supabaseAdmin
            .from('project_members')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        finalProjectCount = projectCount || 0;
    }

    return {
        user_id: userId,
        total_tasks: tasks.length,
        total_projects: finalProjectCount,
        tasks_by_status: {
            total: tasks.length,
            pending: tasks.filter((t) => String(t.status).toLowerCase() === 'pending').length,
            in_progress: tasks.filter((t) => String(t.status).toLowerCase() === 'in_progress').length,
            done: tasks.filter((t) => String(t.status).toLowerCase() === 'done').length,
            verified: tasks.filter((t) => String(t.status).toLowerCase() === 'verified').length,
            failed: tasks.filter((t) => String(t.status).toLowerCase() === 'failed').length,
        },
        timesheet_tasks_by_status: tsStats,
        total_hours_logged: parseFloat(totalActualHours.toFixed(2)),
        tasks: tasks.map(t => ({
            ...t,
            projectName: t.project?.name
        })),
        todos: (tsEntries || []).map(e => ({
            ...e,
            work_date: e.timesheet?.work_date
        }))
    };
};

export const getOverallReport = async ({ startDate, endDate } = {}) => {
    const sDate = startDate ? startDate.slice(0, 10) : null;
    const eDate = endDate ? endDate.slice(0, 10) : null;

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

    // Overall timesheet status aggregation for the period
    let tsQuery = supabaseAdmin
        .from('timesheet_entries')
        .select(`
            status,
            hours_spent,
            timesheet:timesheets!inner(work_date)
        `);

    if (sDate) tsQuery = tsQuery.gte('timesheet.work_date', sDate);
    if (eDate) tsQuery = tsQuery.lte('timesheet.work_date', eDate);

    const { data: tsEntries } = await tsQuery;
    const totalActualHours = (tsEntries || []).reduce((sum, e) => {
        const workDate = e.timesheet?.work_date;
        if (sDate && workDate < sDate) return sum;
        if (eDate && workDate > eDate) return sum;
        return sum + parseTime(e.hours_spent);
    }, 0);

    const tsStats = { todo: 0, in_progress: 0, done: 0, blocked: 0, verified: 0, failed: 0 };
    (tsEntries || []).forEach(e => {
        const workDate = e.timesheet?.work_date;
        if (sDate && workDate < sDate) return;
        if (eDate && workDate > eDate) return;

        const status = String(e.status || '').toLowerCase();
        if (tsStats[status] !== undefined) tsStats[status]++;
    });

    return {
        total_users: userCount,
        total_projects: projectCount,
        total_tasks: tasks.length,
        tasks_by_status: {
            pending: tasks.filter((t) => String(t.status).toLowerCase() === 'pending').length,
            in_progress: tasks.filter((t) => String(t.status).toLowerCase() === 'in_progress').length,
            done: tasks.filter((t) => String(t.status).toLowerCase() === 'done').length,
            verified: tasks.filter((t) => String(t.status).toLowerCase() === 'verified').length,
            failed: tasks.filter((t) => String(t.status).toLowerCase() === 'failed').length,
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

    const sDate = startDate ? startDate.slice(0, 10) : null;
    const eDate = endDate ? endDate.slice(0, 10) : null;

    if (sDate) q = q.gte('timesheet.work_date', sDate);
    if (eDate) q = q.lte('timesheet.work_date', eDate);

    const { data, error } = await q;
    if (error) throw error;

    const aggregation = {};

    data.forEach(entry => {
        const user = entry.timesheet?.user;
        const project = entry.task?.project;
        const workDate = entry.timesheet?.work_date;

        if (!user || !project) return;
        if (projectId && project.id !== projectId) return;
        if (sDate && workDate < sDate) return;
        if (eDate && workDate > eDate) return;

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
        aggregation[key].totalMinutes += parseTime(entry.hours_spent) * 60;
    });

    const result = Object.values(aggregation).map(item => {
        const totalHours = item.totalMinutes / 60;
        const manDays = totalHours / 8;
        const dailyRate = item.userCTC / 22;
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
    const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select(`
            id, full_name, email, department, designation, avatar_url,
            user_roles(role:roles(name))
        `);
    if (profileError) throw profileError;

    const sDate = startDate ? startDate.slice(0, 10) : null;
    const eDate = endDate ? endDate.slice(0, 10) : null;

    const filteredProfiles = profiles.filter(p => {
        const roles = p.user_roles?.map(ur => ur.role?.name.toLowerCase()) || [];
        const isSuperAdmin = roles.includes('super admin') || roles.includes('super_admin');
        const isManagement = String(p.department || '').toLowerCase() === 'management';
        return !isSuperAdmin && !isManagement;
    });

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

    let tsQuery = supabaseAdmin
        .from('timesheet_entries')
        .select(`
            id, hours_spent, title, status,
            timesheet:timesheets!inner (
                work_date,
                user_id
            ),
            task:tasks (
                id,
                title,
                project:projects (id, name)
            )
        `);

    if (sDate) tsQuery = tsQuery.gte('timesheet.work_date', sDate);
    if (eDate) tsQuery = tsQuery.lte('timesheet.work_date', eDate);

    const { data: tsEntries } = await tsQuery;

    const userMetrics = {};
    filteredProfiles.forEach(p => {
        const roles = p.user_roles?.map(ur => ur.role?.name.toLowerCase()) || [];
        const isTester = roles.includes('tester');

        userMetrics[p.id] = {
            id: p.id,
            full_name: p.full_name,
            email: p.email,
            department: p.department,
            designation: p.designation,
            avatar_url: p.avatar_url,
            isTester,
            total_tasks: 0,
            tasks: { total: 0, verified: 0, failed: 0 },
            todos: { total: 0, verified: 0, failed: 0 },
            total_hours: 0,
            timesheet_items: [],
            sales_stats: null
        };
    });

    tasks.forEach(t => {
        if (t.assigned_to && userMetrics[t.assigned_to]) {
            const m = userMetrics[t.assigned_to];
            m.total_tasks++;
            m.tasks.total++;
            const status = String(t.status || '').toLowerCase();
            if (status === 'verified') m.tasks.verified++;
            else if (status === 'failed') m.tasks.failed++;
        }
    });

    if (tsEntries) {
        tsEntries.forEach(entry => {
            const userId = entry.timesheet?.user_id;
            const workDate = entry.timesheet?.work_date;

            if (sDate && workDate < sDate) return;
            if (eDate && workDate > eDate) return;

            if (userId && userMetrics[userId]) {
                const m = userMetrics[userId];
                const hours = parseTime(entry.hours_spent);
                m.total_hours += hours;

                m.todos.total++;
                const status = String(entry.status || '').toLowerCase();
                if (status === 'verified') m.todos.verified++;
                else if (status === 'failed') m.todos.failed++;

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

    const bdmProfileIds = filteredProfiles
        .filter(p => {
            const roles = p.user_roles?.map(ur => ur.role?.name.toLowerCase()) || [];
            return roles.includes('bdm') || String(p.department || '').toLowerCase() === 'marketing';
        })
        .map(p => p.id);

    if (bdmProfileIds.length > 0) {
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

        const fetchLeads = async () => {
            const { data: leadsData } = await leadQuery;
            (leadsData || []).forEach(l => {
                if (l.assigned_agent_id && userMetrics[l.assigned_agent_id]) {
                    const m = userMetrics[l.assigned_agent_id];
                    const s = m.sales_stats;
                    if (!s) return;
                    const val = parseFloat(l.deal_value || 0);
                    s.total_leads++;
                    const status = String(l.status || '').toLowerCase();
                    if (status === 'won') {
                        s.won_count++;
                        s.won_value += val;
                    } else if (status === 'proposal') {
                        s.pipeline_value += val;
                    }
                    if (['proposal', 'won'].includes(status)) {
                        s.quotation_count++;
                    }
                }
            });
        };
        await fetchLeads();
    }

    Object.values(userMetrics).forEach(m => {
        if (m.sales_stats && m.sales_stats.total_leads > 0) {
            m.sales_stats.conversion_rate = (m.sales_stats.won_count / m.sales_stats.total_leads) * 100;
        }
    });

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
