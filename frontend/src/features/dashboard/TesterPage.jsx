import { useState } from 'react';
import DateRangePicker from '../../components/DateRangePicker';
import { getISTMonthStartString, getISTTodayString } from '../../lib/dateUtils';
import TesterDashboard from './TesterDashboard';

export default function TesterPage() {
    const [dateRange, setDateRange] = useState({
        startDate: getISTMonthStartString(),
        endDate: getISTTodayString()
    });

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1>Tester Dashboard</h1>
                    <p>Quality Assurance and Bug Tracking Overview</p>
                </div>
                <DateRangePicker
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    onRangeChange={setDateRange}
                />
            </div>
            <TesterDashboard dateRange={dateRange} />
        </div>
    );
}
