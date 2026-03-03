import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zcmeduttgckvjtdrjbme.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbWVkdXR0Z2Nrdmp0ZHJqYm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDYzOSwiZXhwIjoyMDg3NjAwNjM5fQ.jmsKs9l_ZrvQorgWPu35sUOSbWDK7WwggiOtJZ3IuQw';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkRoles() {
    console.log("Fetching all roles...");
    const { data: roles, error } = await supabaseAdmin.from('roles').select('*');
    console.log("Roles:", roles, "Error:", error);

    console.log("\nFetching tester profiles...");
    const { data: profiles, error: pErr } = await supabaseAdmin
        .from('profiles')
        .select(`
            id, full_name, department, 
            user_roles(role:roles(name))
        `);

    profiles?.forEach(p => {
        const roles = p.user_roles?.map(ur => ur.role?.name.toLowerCase()) || [];
        if (roles.includes('tester') || roles.includes('qa')) {
            console.log(`Tester Found: ${p.full_name} (${p.id}) - Roles: ${roles.join(', ')}`);
        }
    });

    console.log("\nChecking tasks for a sample tester (if any)...");
}
checkRoles();
