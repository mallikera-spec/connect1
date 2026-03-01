import 'dotenv/config';
import { supabaseAdmin } from './config/supabase.js';

async function checkSchema() {
    try {
        const { data, error } = await supabaseAdmin
            .rpc('get_schema_info', { table_name: 'tasks' });

        // If RPC doesn't exist, try raw query
        if (error) {
            console.log('RPC failed, trying information_schema query...');
            const { data: cols, error: err2 } = await supabaseAdmin
                .from('tasks')
                .select('*')
                .limit(1);

            if (err2) {
                console.error('Error selecting from tasks:', err2);
            } else {
                console.log('Columns in tasks table:', Object.keys(cols[0] || {}));
            }
        } else {
            console.log('Schema info:', data);
        }
    } catch (e) {
        console.error('Fatal error:', e);
    }
}

checkSchema();
