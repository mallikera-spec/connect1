import 'dotenv/config';
import { supabaseAdmin } from './config/supabase.js';

async function checkCols() {
    const { data, error } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .limit(1);

    if (data && data.length > 0) {
        console.log("Task Columns:", Object.keys(data[0]));
    } else {
        console.log("No tasks found to inspect columns.");
    }
}
checkCols();
