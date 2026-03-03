import 'dotenv/config';
import { supabaseAdmin } from './config/supabase.js';

async function checkCols() {
    const { data, error } = await supabaseAdmin
        .from('timesheets')
        .select('*')
        .limit(1);

    if (data && data.length > 0) {
        console.log("Timesheet Columns:", Object.keys(data[0]));
    } else {
        console.log("No timesheets found to inspect columns.");
    }
}
checkCols();
