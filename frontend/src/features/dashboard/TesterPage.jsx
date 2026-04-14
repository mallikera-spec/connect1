import { useState, Component } from 'react';
import DateRangePicker from '../../components/DateRangePicker';
import { getISTMonthStartString, getISTTodayString } from '../../lib/dateUtils';
import TesterDashboard from './TesterDashboard';

// Error boundary to catch any rendering crashes
class TesterErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error('TesterDashboard crashed:', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Something went wrong</div>
                    <div style={{ fontSize: 13, marginBottom: 16, color: '#ef4444' }}>{this.state.error?.message}</div>
                    <button className="btn btn-primary" onClick={() => this.setState({ hasError: false, error: null })}>
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

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
            <TesterErrorBoundary>
                <TesterDashboard dateRange={dateRange} />
            </TesterErrorBoundary>
        </div>
    );
}
