import 'dotenv/config';
import { supabaseAdmin } from './config/supabase.js';

const migrate = async () => {
    console.log('Adding deal_value to projects table...');
    const { error } = await supabaseAdmin.rpc('run_sql', {
        sql: `ALTER TABLE projects ADD COLUMN IF NOT EXISTS deal_value NUMERIC DEFAULT 0;`
    });

    if (error) {
        // Fallback if rpc is not available
        console.error('Error with RPC:', error);
        console.log('Attempting direct query fallback...');
        const { error: directError } = await supabaseAdmin
            .from('projects')
            .select('id')
            .limit(1);

        if (directError) {
            console.error('Direct query error:', directError);
        } else {
            console.log('Direct query successful, but cannot run ALTER TABLE without RPC or raw SQL access.');
            console.log('Please run this SQL in Supabase Dashboard:');
            console.log('ALTER TABLE projects ADD COLUMN IF NOT EXISTS deal_value NUMERIC DEFAULT 0;');
        }
    } else {
        console.log('Migration successful!');
    }
};

migrate();
