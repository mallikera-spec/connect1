import 'dotenv/config';
import { supabaseAdmin } from './config/supabase.js';

async function checkCols() {
    const { data, error } = await supabaseAdmin
        .from('timesheet_entries')
        .select('*')
        .limit(1);

    if (data && data.length > 0) {
        console.log("Timesheet Entry Columns:", Object.keys(data[0]));
    } else {
        console.log("No timesheet entries found to inspect columns.");
    }
}
checkCols();
