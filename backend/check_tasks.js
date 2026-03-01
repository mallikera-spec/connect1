import 'dotenv/config';
import { supabaseAdmin } from './config/supabase.js';

async function checkTasks() {
    try {
        const { data, error } = await supabaseAdmin
            .from('tasks')
            .select('id, title, status, qa_notes, developer_reply')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching tasks:', error);
            return;
        }

        console.log('--- LATEST TASKS ---');
        data.forEach(t => {
            console.log(`Task: ${t.title} [${t.status}]`);
            console.log(`  QA Notes: ${t.qa_notes || '(null)'}`);
            console.log(`  Dev Reply: ${t.developer_reply || '(null)'}`);
            console.log('-------------------');
        });
    } catch (e) {
        console.error('Fatal error:', e);
    }
}

checkTasks();
