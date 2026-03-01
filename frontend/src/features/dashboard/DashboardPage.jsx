import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DateRangePicker from '../../components/DateRangePicker';
import { getISTMonthStartString, getISTTodayString } from '../../lib/dateUtils';
import AdminDashboard from './AdminDashboard';
import DeveloperDashboard from './DeveloperDashboard';
import HRDashboard from './HRDashboard';
import SalesDashboard from '../sales/SalesDashboard';
import TesterDashboard from './TesterDashboard';

export default function DashboardPage() {
    const { user, hasPermission } = useAuth();

    const [dateRange, setDateRange] = useState({
        startDate: getISTMonthStartString(),
        endDate: getISTTodayString()
    });

    const userRoles = user?.roles?.map(r => r.toLowerCase()) || [];

    const isSuperAdmin = userRoles.includes('super admin') || userRoles.includes('super_admin');
    const isAdmin = isSuperAdmin || hasPermission('view_overall_report') || hasPermission('manage_projects');
    const isHR = userRoles.includes('hr') || userRoles.includes('hr manager');
    const isBDM = userRoles.includes('bdm') || userRoles.includes('sales manager');
    const isTester = userRoles.includes('tester');

    let DashboardComponent = DeveloperDashboard;
    let greeting = `Welcome back, ${user?.full_name || 'Employee'}`;

    if (isSuperAdmin) {
        DashboardComponent = AdminDashboard;
        greeting = "Welcome back — here's your organization overview";
    } else if (isAdmin && !isBDM && !isHR) {
        // e.g., Project Manager
        DashboardComponent = AdminDashboard;
        greeting = "Welcome back — here's your management overview";
    } else if (isBDM) {
        DashboardComponent = SalesDashboard;
        greeting = "Welcome back — here is your sales performance";
    } else if (isHR) {
        DashboardComponent = HRDashboard;
        greeting = "Welcome back — here is the human resources overview";
    } else if (isTester) {
        DashboardComponent = TesterDashboard;
        greeting = "Welcome back — here is your QA testing overview";
    }

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1>Dashboard</h1>
                    <p>{greeting}</p>
                </div>

                {DashboardComponent !== SalesDashboard && (
                    <DateRangePicker
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        onRangeChange={setDateRange}
                    />
                )}
            </div>

            <DashboardComponent dateRange={dateRange} />

            <style>{`
                .polished-card {
                    padding: 0;
                    overflow: hidden;
                    border: 1px solid var(--border);
                    background: rgba(255, 255, 255, 0.03);
                }
                .polished-card-header {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 14px 20px;
                    border-bottom: 1px solid var(--border);
                    color: var(--accent-light);
                }
                .polished-card-body {
                    padding: 12px 0;
                }
                .polished-row {
                    padding: 10px 20px !important;
                    margin: 0 !important;
                    border-radius: 0 !important;
                }
                .polished-row:hover {
                    background: rgba(124, 58, 237, 0.08) !important;
                }
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .status-dot.pending { background: #94a3b8; }
                .status-dot.in_progress { background: #f59e0b; }
                .status-dot.done { background: #10b981; }
                .status-dot.ts-todo { background: #cbd5e1; }
                .status-dot.ts-in_progress { background: #fbbf24; }
                .status-dot.ts-done { background: #34d399; }
                .status-dot.ts-blocked { background: #ef4444; }
                .status-dot.ts-verified { background: #a855f7; }
                .status-dot.ts-failed { background: #f43f5e; }

                .polished-action-btn {
                    border: none;
                    background: transparent;
                    padding: 10px 20px;
                    border-radius: 0;
                    justify-content: flex-start;
                    gap: 12px;
                    transition: all 0.2s;
                    font-weight: 500;
                    color: var(--text-muted);
                }
                .polished-action-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--text);
                    padding-left: 24px;
                }
                
                .emp-avatar-img {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid var(--border);
                }

                .clickable-row {
                    cursor: pointer;
                    transition: background 0.2s;
                    border-radius: 6px;
                    padding-left: 8px;
                    padding-right: 8px;
                    margin-left: -8px;
                    margin-right: -8px;
                }
                .clickable-row:hover {
                    background: var(--bg-app);
                }
            `}</style>
        </div>
    );
}
