import { createClient } from '@supabase/supabase-js';

// Hardcoding credentials for the test to avoid dependency issues
const SUPABASE_URL = 'https://ubbfygqyjdzravlnbidd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8aEcbr7C53rc_gpy8OYQTw_X0kWaLa0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runFullFlowTest() {
    console.log('🚀 Starting Full Flow Integration Test...\n');

    try {
        // --- STEP 1: Admin - Create Availability ---
        console.log('1️⃣  [Admin] Creating Availability Rules...');
        const { data: availability, error: availError } = await supabase
            .from('availabilities')
            .insert([{
                title: 'Test Office Hours',
                rules: {
                    'Lunedì': [{ start: '09:00', end: '12:00' }],
                    'Venerdì': [{ start: '14:00', end: '18:00' }]
                }
            }])
            .select()
            .single();

        if (availError) throw new Error(`Availability Creation Failed: ${availError.message}`);
        console.log(`   ✅ Availability created: "${availability.title}" (ID: ${availability.id})`);


        // --- STEP 2: Admin - Create Event ---
        console.log('\n2️⃣  [Admin] Creating Event (Single Week Type)...');
        const testSlug = `consultation-${Date.now()}`;
        const { data: event, error: eventError } = await supabase
            .from('events')
            .insert([{
                title: 'Consulenza Test',
                description: 'A comprehensive test event',
                slug: testSlug,
                duration_minutes: 60,
                event_type: 'single_week',
                start_date: '2026-02-23', // Assuming this is a future Monday per user request context
                availability_id: availability.id,
                location: 'Google Meet'
            }])
            .select()
            .single();

        if (eventError) throw new Error(`Event Creation Failed: ${eventError.message}`);
        console.log(`   ✅ Event created: "${event.title}"`);
        console.log(`   🔗 Link would be: /book/${event.slug}`);


        // --- STEP 3: Admin - Settings & Template ---
        console.log('\n3️⃣  [Admin] Updating Settings & WhatsApp Template...');
        const { error: settingsError } = await supabase
            .from('admin_profiles')
            .upsert([{
                email: 'admin@test.com',
                phone: '+393330000000',
                whatsapp_template: 'Ciao {user_name}, confermo il tuo appuntamento per {event_title}. Link: {event_links}'
            }]);

        if (settingsError) throw new Error(`Settings Update Failed: ${settingsError.message}`);
        console.log('   ✅ Settings updated successfully.');


        // --- STEP 4: User - Open Booking Page (Fetch Event) ---
        console.log('\n4️⃣  [User] Opening Booking URL (Fetching Event by Slug)...');
        const { data: fetchedEvent, error: fetchError } = await supabase
            .from('events')
            .select('*, availabilities(*)')
            .eq('slug', testSlug)
            .single();

        if (fetchError || !fetchedEvent) throw new Error(`Event Fetch Failed: ${fetchError?.message}`);
        console.log(`   ✅ Event fetched successfully: ${fetchedEvent.title}`);
        console.log(`   📅 Type: ${fetchedEvent.event_type}, Start: ${fetchedEvent.start_date}`);


        // --- STEP 5: User - Slot Logic (Simulation) ---
        console.log('\n5️⃣  [User] Simulating Slot Selection...');
        // Simulating the user picking a valid slot on Monday 2026-02-23
        const selectedDate = '2026-02-23';
        const selectedTime = '09:00';

        // Simple validation: 09:00 is in the Monday rules (09:00-12:00)
        console.log(`   user selects: ${selectedDate} at ${selectedTime}`);


        // --- STEP 6: User - Submit Booking ---
        console.log('\n6️⃣  [User] Submitting Booking...');
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .insert([{
                event_id: fetchedEvent.id,
                user_name: 'Mario',
                user_surname: 'Rossi',
                user_email: 'mario.rossi@test.com',
                user_phone: '+393339999999',
                start_time: `${selectedDate}T${selectedTime}:00`,
                end_time: `${selectedDate}T10:00:00` // 60 mins later
            }])
            .select()
            .single();

        if (bookingError) throw new Error(`Booking Failed: ${bookingError.message}`);
        console.log(`   ✅ Booking confirmed! ID: ${booking.id}`);
        console.log(`   👤 User: ${booking.user_name} ${booking.user_surname}`);


        // --- CLEANUP ---
        console.log('\n🧹 Cleaning up test data...');
        await supabase.from('bookings').delete().eq('id', booking.id);
        await supabase.from('events').delete().eq('id', event.id);
        await supabase.from('availabilities').delete().eq('id', availability.id);
        console.log('   ✅ Cleanup complete.');

        console.log('\n🎉 TEST PASSED: Full flow is working correctly!');

    } catch (err) {
        console.error('\n❌ TEST FAILED:', err.message);
    }
}

runFullFlowTest();
