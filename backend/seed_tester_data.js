import 'dotenv/config';
import { supabaseAdmin } from './config/supabase.js';

async function seedTesterWork() {
    const testerId = 'e0379a07-3bf9-419e-a281-08313c544410';
    const today = new Date().toISOString().split('T')[0];

    console.log("Fetching existing timesheet...");
    let { data: ts } = await supabaseAdmin
        .from('timesheets')
        .select('id')
        .eq('user_id', testerId)
        .eq('work_date', today)
        .single();

    if (!ts) {
        console.log("Creating new timesheet...");
        const { data: newTs, error } = await supabaseAdmin
            .from('timesheets')
            .insert({ user_id: testerId, work_date: today })
            .select()
            .single();
        if (error) { console.error("Create TS Error", error); return; }
        ts = newTs;
    }
    console.log("Using Timesheet ID:", ts.id);

    const { data: projects } = await supabaseAdmin.from('projects').select('id').limit(1);
    const projectId = projects[0].id;

    console.log("Creating timesheet entries for tester...");
    const { error: eErr } = await supabaseAdmin
        .from('timesheet_entries')
        .insert([
            { timesheet_id: ts.id, title: 'Bug Verification A', hours_spent: '2:00', status: 'verified', project_id: projectId },
            { timesheet_id: ts.id, title: 'Bug Verification B', hours_spent: '1:30', status: 'failed', project_id: projectId }
        ]);

    if (eErr) { console.error("Entries Error", eErr); return; }
    console.log("Timesheet entries created successfully!");
}
seedTesterWork();
