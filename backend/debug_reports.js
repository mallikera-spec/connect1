import 'dotenv/config';
import * as reportsService from './features/reports/reports.service.js';

async function debugTesterData() {
    console.log("--- Debugging Tester Data ---");
    const today = new Date().toISOString().split('T')[0];
    const startDate = today; // Test for today
    const endDate = today;

    try {
        const data = await reportsService.getEmployeeOverview({ startDate, endDate });

        console.log("\nAggregation Summary:");
        Object.keys(data).forEach(dept => {
            console.log(`\nDepartment: ${dept}`);
            data[dept].forEach(m => {
                if (m.isTester) {
                    console.log(`Tester: ${m.full_name}`);
                    console.log(`  Tasks: total=${m.tasks.total}, verified=${m.tasks.verified}, failed=${m.tasks.failed}`);
                    console.log(`  Todos: total=${m.todos.total}, verified=${m.todos.verified}, failed=${m.todos.failed}`);
                    console.log(`  Hours: ${m.total_hours}`);
                    console.log(`  Timesheet Items: ${m.timesheet_items.length}`);
                }
            });
        });
    } catch (err) {
        console.error("Error fetching overview:", err);
    }
}

debugTesterData();
