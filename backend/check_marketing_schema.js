import 'dotenv/config';
import { supabaseAdmin } from './config/supabase.js';

async function checkSchema() {
    const { data: leads, error: lErr } = await supabaseAdmin.from('leads').select('*').limit(1);
    if (!lErr && leads.length > 0) {
        console.log("Leads Columns:", Object.keys(leads[0]));
        console.log("Sample Lead Source:", leads[0].source);
    } else if (lErr) {
        console.error("Leads Error:", lErr);
    }

    const { data: followups, error: fErr } = await supabaseAdmin.from('follow_ups').select('*').limit(1);
    if (!fErr && followups.length > 0) {
        console.log("Followups Columns:", Object.keys(followups[0]));
    } else if (fErr) {
        console.error("Followups Error:", fErr);
    }
}
checkSchema();
