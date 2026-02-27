import { useEffect, useState } from 'react';
import { FolderKanban, ListTodo, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import { StatCard } from './DashboardComponents';

export default function DeveloperDashboard({ dateRange }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params = { startDate: dateRange.startDate, endDate: dateRange.endDate };

        api.get('/reports/me', { params })
            .then((res) => setStats(res.data.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [dateRange]);

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;
    if (!stats) return null;

    return (
        <div className="stats-grid">
            <StatCard
                icon={FolderKanban}
                label="My Projects"
                value={stats.total_projects}
                color="rgba(79,70,229,0.25)"
                to="/projects"
                state={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
            />
            <StatCard
                icon={ListTodo}
                label="Assigned Tasks"
                value={stats.total_tasks}
                color="rgba(59,130,246,0.25)"
                to="/tasks"
                state={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
            />
            <StatCard
                icon={CheckCircle2}
                label="Pending Tasks"
                value={stats.tasks_by_status?.pending || 0}
                color="rgba(245,158,11,0.25)"
                to="/tasks"
                state={{ status: 'pending', startDate: dateRange.startDate, endDate: dateRange.endDate }}
            />
        </div>
    );
}
