import 'dotenv/config';
import { supabaseAdmin } from './backend/config/supabase.js';

async function cleanup() {
    process.chdir('./backend');
    console.log('Deleting Casual Leave...');
    const { error } = await supabaseAdmin
        .from('leave_types')
        .delete()
        .eq('name', 'Casual Leave');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success!');
    }
    process.exit();
}

cleanup();
