import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function runTest() {
    console.log('--- Database Integration Test ---');

    // 1. Fetch an availability ID to use for the event (foreign key requirement)
    const { data: availData, error: availError } = await supabase
        .from('availabilities')
        .select('id')
        .limit(1)
        .single();

    if (availError || !availData) {
        console.error('Error: No availabilities found. Create one first in the UI.');
        return;
    }

    const testSlug = 'test-week-event-' + Date.now();

    // 2. Attempt to insert a 'single_week' event
    console.log('Testing insertion of single_week event...');
    const { data, error } = await supabase
        .from('events')
        .insert([{
            title: 'Test Professional Week',
            slug: testSlug,
            duration_minutes: 45,
            event_type: 'single_week',
            start_date: '2026-02-23',
            availability_id: availData.id
        }])
        .select();

    if (error) {
        console.error('FAILED: Insertion failed with error:', error.message);
        if (error.message.includes('column "start_date" of relation "events" does not exist')) {
            console.log('TIP: The start_date column is still missing in Supabase.');
        }
        if (error.message.includes('violates check constraint')) {
            console.log('TIP: The event_type_check constraint has not been updated in Supabase.');
        }
    } else {
        console.log('SUCCESS: Event inserted correctly with single_week type!');
        console.log('Inserted Data:', data);

        // 3. Cleanup: Delete the test event
        console.log('Cleaning up test data...');
        await supabase.from('events').delete().eq('slug', testSlug);
        console.log('Cleanup complete.');
    }
}

runTest();
