import 'dotenv/config';
import { supabaseAdmin } from './config/supabase.js';

async function checkTS() {
    const today = new Date().toISOString().split('T')[0];
    const { data: tsEntries, error } = await supabaseAdmin
        .from('timesheet_entries')
        .select(`
            id, hours_spent, title, status,
            timesheet:timesheets!inner (
                work_date,
                user_id,
                user:profiles(full_name)
            )
        `)
        .eq('timesheet.work_date', today);

    console.log("TS Entries for today:", tsEntries?.length);
    tsEntries?.forEach(e => {
        console.log(`Entry: ${e.title}, User: ${e.timesheet?.user?.full_name}, ID: ${e.timesheet?.user_id}`);
    });
}
checkTS();
