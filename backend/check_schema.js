import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from backend
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

import fs from 'fs';

async function checkTable(tableName) {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    let output = '';
    if (error) {
        output = `Error fetching ${tableName}: ${error.message}\n`;
    } else {
        const columns = data[0] ? Object.keys(data[0]) : [];
        output = `--- ${tableName} ---\n${columns.join(', ')}\n\n`;
    }
    fs.appendFileSync('schema_results.txt', output);
}

if (fs.existsSync('schema_results.txt')) fs.unlinkSync('schema_results.txt');


async function main() {
    await checkTable('leads');
    await checkTable('projects');
    await checkTable('clients');
}

main();
