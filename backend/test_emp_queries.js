import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zcmeduttgckvjtdrjbme.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbWVkdXR0Z2Nrdmp0ZHJqYm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDYzOSwiZXhwIjoyMDg3NjAwNjM5fQ.jmsKs9l_ZrvQorgWPu35sUOSbWDK7WwggiOtJZ3IuQw';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    console.log("Fetching profiles...");
    let profilesQuery = supabaseAdmin
        .from('profiles')
        .select(`
            id, full_name, email, department, designation, avatar_url, joined_at,
            user_roles(role:roles(name))
        `);
    const { data: profiles, error: pErr } = await profilesQuery;
    if (pErr) { console.error("Profiles Error", pErr); return; }

    const filteredProfiles = profiles.filter(p => {
        const roles = p.user_roles?.map(ur => ur.role?.name) || [];
        if (roles.includes('Super Admin') || roles.includes('super_admin')) return false;
        if (p.department === 'management') return false;
        return true;
    });
    console.log("Filtered profiles:", filteredProfiles.length);

    const profileIds = filteredProfiles.map(p => p.id);

    console.log("Fetching tasks...");
    let taskQuery = supabaseAdmin
        .from('tasks')
        .select('id, assigned_to, status, created_at, project:projects(id, name)')
        .in('assigned_to', profileIds);

    const { data: tasks, error: tErr } = await taskQuery;
    console.log("Tasks fetched:", tasks?.length, "Error:", tErr);
    if (tasks?.length > 0) {
        console.log("Sample task assigned_to:", tasks[0].assigned_to);
    }

    console.log("Fetching timesheets...");
    let tsQuery = supabaseAdmin
        .from('timesheet_entries')
        .select(`
            id, status, hours_spent, title,
            timesheet:timesheets!inner(user_id, work_date),
            task:tasks(project:projects(name))
        `)
        .in('timesheet.user_id', profileIds);

    const { data: tsEntries, error: tsErr } = await tsQuery;
    console.log("Timesheets fetched:", tsEntries?.length, "Error:", tsErr);
}
test();
