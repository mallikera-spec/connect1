import dotenv from 'dotenv';
dotenv.config();

async function test() {
    console.log('--- Testing getAllFollowUps ---');
    try {
        const { getAllFollowUps } = await import('./features/sales/sales.service.js');
        // Test 1: Fetch all pending (Admin mode)
        const pending = await getAllFollowUps({ status: 'Pending' });
        console.log(`Found ${pending.length} pending follow-ups.`);
        if (pending.length > 0) {
            console.log('Sample Lead Name:', pending[0].lead?.name);
            console.log('Sample Agent Name:', pending[0].agent?.full_name);
        }

        // Test 2: Filter by Agent (Simulate BDM mode)
        if (pending.length > 0) {
            const agentId = pending[0].agent_id;
            const agentSpecific = await getAllFollowUps({ agent_id: agentId });
            console.log(`Found ${agentSpecific.length} follow-ups for agent ${agentId}.`);
            const mismatched = agentSpecific.filter(fu => fu.agent_id !== agentId);
            if (mismatched.length === 0) {
                console.log('✅ Agent filtering works.');
            } else {
                console.error('❌ Mismatched agent found!');
            }
        }

        // Test 3: Date Filtering
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0];
        const dateFiltered = await getAllFollowUps({ startDate: today, endDate: nextMonth });
        console.log(`Found ${dateFiltered.length} follow-ups in the next 30 days.`);

    } catch (err) {
        console.error('Test failed:', err);
    }
}

test();

