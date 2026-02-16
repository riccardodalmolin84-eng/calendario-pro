import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkEvents() {
    const { data, error } = await supabase.from('events').select('slug, title');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Events in DB:', data);
    }
}

checkEvents();
