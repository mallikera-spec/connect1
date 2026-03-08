import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Adding deal_value to clients table...');
    const { error } = await supabase.rpc('execute_sql', {
        sql_query: 'ALTER TABLE clients ADD COLUMN IF NOT EXISTS deal_value NUMERIC DEFAULT 0;'
    });

    if (error) {
        // If rpc fails, try another way or just assume it needs to be done via dashboard if no RPC
        console.error('Migration failed (RPC not available?):', error.message);
        console.log('You might need to add the column via Supabase Dashboard: ALTER TABLE clients ADD COLUMN deal_value NUMERIC DEFAULT 0;');
    } else {
        console.log('Successfully added deal_value column to clients table.');
    }
}

main();
