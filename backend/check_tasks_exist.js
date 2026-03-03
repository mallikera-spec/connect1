import 'dotenv/config';
import { supabaseAdmin } from './config/supabase.js';

async function checkTasks() {
    const { count, error } = await supabaseAdmin
        .from('tasks')
        .select('*', { count: 'exact', head: true });

    console.log("Total Tasks in DB:", count, "Error:", error);

    const { data: sampleTasks } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .limit(5);

    if (sampleTasks && sampleTasks.length > 0) {
        console.log("Sample Task Columns:", Object.keys(sampleTasks[0]));
        console.log("Sample Task Statuses:", sampleTasks.map(t => t.status));
    }
}
checkTasks();
