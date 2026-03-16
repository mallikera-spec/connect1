import React, { useState, useEffect } from 'react';
import { 
    CircleDollarSign, TrendingUp, TrendingDown, 
    Wallet, Briefcase, Plus, Filter, Download,
    ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, LineChart, Line,
    Cell, PieChart as RePieChart, Pie
} from 'recharts';
import { financeService } from './financeService';
import toast from 'react-hot-toast';

export default function FinanceDashboard() {
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        totalAssets: 0
    });
    const [entities, setEntities] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ov, ent] = await Promise.all([
                financeService.getOverview(),
                financeService.getEntities()
            ]);
            if (ov.success) setOverview(ov.data);
            if (ent.success) setEntities(ent.data);
        } catch (err) {
            toast.error('Failed to fetch finance data');
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { label: 'Total Income', value: overview.totalIncome, icon: TrendingUp, color: '#10b981', trend: '+12%' },
        { label: 'Total Expenses', value: overview.totalExpenses, icon: TrendingDown, color: '#ef4444', trend: '+5%' },
        { label: 'Net Profit', value: overview.netProfit, icon: CircleDollarSign, color: '#6366f1', trend: '+8%' },
        { label: 'Asset Value', value: overview.totalAssets, icon: Briefcase, color: '#f59e0b', trend: 'Fixed' },
    ];

    if (loading) {
        return (
            <div className="finance-loading">
                <div className="skeleton-container">
                    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-card" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="finance-container">
            <header className="finance-header">
                <div>
                    <h1>Finance Executive Dashboard</h1>
                    <p>Real-time financial intelligence & entity tracking</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary"><Filter size={18} /> Filters</button>
                    <button className="btn-secondary"><Download size={18} /> Export</button>
                </div>
            </header>

            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">{stat.label}</span>
                            <h2 className="stat-value">₹{stat.value.toLocaleString()}</h2>
                        </div>
                        <div className="stat-trend" style={{ color: stat.trend.includes('+') ? '#10b981' : '#6366f1' }}>
                            {stat.trend.includes('+') ? <ArrowUpRight size={16} /> : <Activity size={16} />}
                            {stat.trend}
                        </div>
                    </div>
                ))}
            </div>

            <div className="charts-grid">
                <div className="chart-wrapper main-chart">
                    <div className="chart-header">
                        <h3>Income vs Expenses (Monthly)</h3>
                        <div className="chart-legend">
                            <span className="dot income" /> Income
                            <span className="dot expense" /> Expenses
                        </div>
                    </div>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dummyChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}
                                    cursor={{ fill: 'var(--bg-card-hover)' }}
                                />
                                <Bar dataKey="income" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-wrapper entity-list">
                    <h3>Entity Balances</h3>
                    <div className="entity-scroll">
                        {entities.map((entity, i) => (
                            <div key={i} className="entity-item">
                                <div className="entity-info">
                                    <div className="entity-avatar">{entity.name[0]}</div>
                                    <div>
                                        <div className="entity-name">{entity.name}</div>
                                        <div className="entity-type">{entity.type}</div>
                                    </div>
                                </div>
                                <div className="entity-val">₹0.00</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .finance-container { padding: 24px; animation: fadeIn 0.4s ease-out; }
                .finance-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
                .finance-header h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
                .finance-header p { color: var(--text-muted); }
                .header-actions { display: flex; gap: 12px; }

                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px; }
                .stat-card { 
                    background: var(--bg-card); 
                    border: 1px solid var(--border); 
                    padding: 24px; 
                    border-radius: var(--radius);
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    position: relative;
                    transition: transform 0.2s;
                }
                .stat-card:hover { transform: translateY(-4px); border-color: var(--accent); }
                .stat-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
                .stat-label { color: var(--text-muted); font-size: 14px; font-weight: 500; }
                .stat-value { font-size: 24px; font-weight: 800; }
                .stat-trend { position: absolute; top: 24px; right: 24px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px; }

                .charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
                .chart-wrapper { 
                    background: var(--bg-card); 
                    border: 1px solid var(--border); 
                    border-radius: var(--radius); 
                    padding: 24px;
                }
                .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .chart-legend { display: flex; gap: 16px; font-size: 12px; }
                .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
                .dot.income { background: #6366f1; }
                .dot.expense { background: #ef4444; }

                .entity-scroll { display: flex; flex-direction: column; gap: 16px; margin-top: 20px; }
                .entity-item { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    padding: 12px; 
                    background: var(--accent-transparent); 
                    border-radius: 16px;
                }
                .entity-info { display: flex; gap: 12px; align-items: center; }
                .entity-avatar { width: 36px; height: 36px; border-radius: 10px; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; }
                .entity-name { font-weight: 600; font-size: 14px; }
                .entity-type { font-size: 11px; color: var(--text-muted); text-transform: uppercase; }
                .entity-val { font-weight: 700; color: var(--accent); }

                .btn-primary { background: var(--accent); color: white; border: none; padding: 10px 20px; border-radius: var(--radius-sm); font-weight: 600; display: flex; gap: 8px; align-items: center; cursor: pointer; }
                .btn-secondary { background: var(--bg-card); border: 1px solid var(--border); padding: 10px 20px; border-radius: var(--radius-sm); font-weight: 600; display: flex; gap: 8px; align-items: center; cursor: pointer; }

                .finance-loading { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
                .skeleton-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
                .skeleton-card { height: 140px; background: var(--border-color); border-radius: 20px; animation: pulse 1.5s infinite; }

                @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

const dummyChartData = [
    { month: 'Sep', income: 450000, expense: 320000 },
    { month: 'Oct', income: 520000, expense: 380000 },
    { month: 'Nov', income: 480000, expense: 410000 },
    { month: 'Dec', income: 610000, expense: 450000 },
    { month: 'Jan', income: 580000, expense: 420000 },
    { month: 'Feb', income: 720000, expense: 510000 },
];
