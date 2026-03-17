import React, { useState, useEffect, useMemo } from 'react';
import {
    CircleDollarSign, TrendingUp, TrendingDown,
    Wallet, Briefcase, Calendar, RefreshCw, BarChart3,
    ArrowUpRight, ArrowDownRight, DollarSign, Users, BarChart2
} from 'lucide-react';
import { financeService } from './financeService';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import DataTable from '../../components/common/DataTable';
import { formatCurrency, toLocalISOString } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, LineChart, Line, LabelList
} from 'recharts';
import { useAuth } from '../../context/AuthContext';

const CFO_EMAILS = ['admin@argosmob.com', 'chandan@argosmob.com'];

export default function FinanceOverview() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isCFO = useMemo(() => user && CFO_EMAILS.includes(user.email.toLowerCase()), [user]);
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: toLocalISOString(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
        end: toLocalISOString(new Date())
    });

    useEffect(() => {
        fetchOverview();
    }, []);

    const fetchOverview = async (range = dateRange) => {
        try {
            setLoading(true);
            const { data, success } = await financeService.getOverview(range.start, range.end);
            if (success) setOverview(data);
        } catch (err) {
            toast.error('Failed to load financial overview');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (newRange) => {
        setDateRange(newRange);
    };

    const handleApplyFilter = () => {
        fetchOverview();
    };

    const monthlyColumns = useMemo(() => [
        { key: 'month', label: 'Month', width: '120px' },
        { key: 'year', label: 'Year', width: '80px', align: 'center' },
        {
            key: 'dealWins',
            label: 'Deal Wins(N)',
            width: '150px',
            align: 'center',
            className: 'clickable-cell',
            render: (val, row) => {
                const startOfMonth = new Date(row.year, new Date(Date.parse(row.month + " 1, 2024")).getMonth(), 1);
                const endOfMonth = new Date(row.year, startOfMonth.getMonth() + 1, 0);
                return (
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', justifyContent: 'center' }}
                        onClick={() => navigate('/projects', {
                            state: {
                                acquisitionStartDate: toLocalISOString(startOfMonth),
                                acquisitionEndDate: toLocalISOString(endOfMonth)
                            }
                        })}
                    >
                        <div className="data-bar-wrapper">
                            <div className="data-bar" style={{ width: `${Math.min((val / 10) * 100, 100)}%` }} />
                        </div>
                        <span style={{ fontWeight: 700 }}>{val}</span>
                    </div>
                );
            }
        },
        {
            key: 'contractValue',
            label: 'Contract',
            align: 'right',
            width: '150px',
            className: 'clickable-cell',
            render: (val, row) => {
                const startOfMonth = new Date(row.year, new Date(Date.parse(row.month + " 1, 2024")).getMonth(), 1);
                const endOfMonth = new Date(row.year, startOfMonth.getMonth() + 1, 0);
                return (
                    <span
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/projects', {
                            state: {
                                acquisitionStartDate: toLocalISOString(startOfMonth),
                                acquisitionEndDate: toLocalISOString(endOfMonth)
                            }
                        })}
                    >
                        {formatCurrency(val)}
                    </span>
                );
            }
        },
        {
            key: 'momContractGrowth',
            label: 'MOM-Growth',
            align: 'center',
            width: '120px',
            render: (val) => (
                <div className={`growth-tag ${val >= 0 ? 'up' : 'down'}`}>
                    {val >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(val).toFixed(2)}%
                </div>
            )
        },
        {
            key: 'income',
            label: 'Income',
            align: 'right',
            width: '150px',
            className: 'clickable-cell',
            style: { borderLeft: '1px solid var(--border)' },
            render: (val, row) => {
                const startOfMonth = new Date(row.year, new Date(Date.parse(row.month + " 1, 2024")).getMonth(), 1);
                const endOfMonth = new Date(row.year, startOfMonth.getMonth() + 1, 0);
                return (
                    <span
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/finance/transactions', {
                            state: { startDate: toLocalISOString(startOfMonth), endDate: toLocalISOString(endOfMonth) }
                        })}
                    >
                        {formatCurrency(val)}
                    </span>
                );
            }
        },
        {
            key: 'expense',
            label: 'Expense',
            align: 'right',
            width: '150px',
            className: 'clickable-cell',
            render: (val, row) => {
                const startOfMonth = new Date(row.year, new Date(Date.parse(row.month + " 1, 2024")).getMonth(), 1);
                const endOfMonth = new Date(row.year, startOfMonth.getMonth() + 1, 0);
                return (
                    <span
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/finance/transactions', {
                            state: { startDate: toLocalISOString(startOfMonth), endDate: toLocalISOString(endOfMonth) }
                        })}
                    >
                        {formatCurrency(val)}
                    </span>
                );
            }
        },
        {
            key: 'profit',
            label: 'Profit',
            align: 'right',
            width: '150px',
            className: 'profit-cell',
            style: (val) => ({
                backgroundColor: val >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                fontWeight: 700,
                color: val >= 0 ? 'var(--success)' : 'var(--danger)'
            }),
            render: (val) => formatCurrency(val)
        },
        {
            key: 'momProfitGrowth',
            label: 'MOM-Growth',
            align: 'center',
            width: '120px',
            render: (val) => (
                <div className={`growth-tag ${val >= 0 ? 'up' : 'down'}`}>
                    {val >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(val).toFixed(2)}%
                </div>
            )
        }
    ], [navigate]);

    const kpis = useMemo(() => {
        if (!overview) return [];
        return [
            {
                label: 'Total Revenue',
                value: overview.totalContractValue,
                isCurrency: true,
                icon: BarChart2,
                color: 'var(--accent)',
                desc: 'Consolidated contract valuation',
                onClick: () => navigate('/projects', {
                    state: { acquisitionStartDate: toLocalISOString(dateRange.start), acquisitionEndDate: toLocalISOString(dateRange.end) }
                })
            },
            {
                label: 'Total Contacts',
                value: overview.monthlyBreakdown.reduce((sum, m) => sum + m.dealWins, 0),
                isCurrency: false,
                icon: Users,
                color: '#3b82f6',
                desc: 'Total deals won in period',
                onClick: () => navigate('/projects', {
                    state: { acquisitionStartDate: toLocalISOString(dateRange.start), acquisitionEndDate: toLocalISOString(dateRange.end) }
                })
            },
            {
                label: 'Total Expenses',
                value: overview.totalExpenses,
                isCurrency: true,
                icon: TrendingDown,
                color: 'var(--danger)',
                desc: 'Operational expenditure',
                onClick: () => navigate('/finance/transactions', {
                    state: { startDate: toLocalISOString(dateRange.start), endDate: toLocalISOString(dateRange.end) }
                })
            },
            {
                label: 'Net Profit',
                value: overview.netProfit,
                isCurrency: true,
                icon: TrendingUp,
                color: 'var(--success)',
                desc: 'Revenue minus expenses',
                onClick: () => navigate('/finance/transactions', {
                    state: { startDate: toLocalISOString(dateRange.start), endDate: toLocalISOString(dateRange.end) }
                })
            }
        ];
    }, [overview, navigate, dateRange]);

    return (
        <div className="finance-overview-container" style={{ padding: '24px 40px', width: '100%', margin: '0' }}>
            <div className="overview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>Finance Intelligence</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Real-time consolidated balance and growth analytics</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <DateRangeFilter
                        value={dateRange}
                        onChange={handleDateChange}
                        onApply={handleApplyFilter}
                    />
                    {isCFO && (
                        <div style={{ display: 'flex', gap: '8px', borderRight: '1px solid var(--border)', paddingRight: '12px', marginRight: '4px' }}>
                            <button 
                                className="btn btn-success btn-sm" 
                                onClick={() => navigate('/finance/transactions', { state: { openModal: true, tab: 'income' } })}
                            >
                                <ArrowUpRight size={16} /> Record Income
                            </button>
                            <button 
                                className="btn btn-danger btn-sm" 
                                onClick={() => navigate('/finance/transactions', { state: { openModal: true, tab: 'expense' } })}
                            >
                                <ArrowDownRight size={16} /> Record Expense
                            </button>
                        </div>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => fetchOverview()}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="kpi-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                {kpis.map((kpi, idx) => (
                    <div
                        key={idx}
                        className="kpi-card glass-effect clickable-card"
                        onClick={kpi.onClick}
                        style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ padding: '10px', borderRadius: '12px', background: `${kpi.color}15`, color: kpi.color }}>
                                <kpi.icon size={24} />
                            </div>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{kpi.label}</div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
                            {kpi.isCurrency ? formatCurrency(kpi.value) : kpi.value.toLocaleString()}
                        </div>
                        {kpi.desc && <div style={{ fontSize: '11px', color: 'var(--text-dim)', opacity: 0.8 }}>{kpi.desc}</div>}
                    </div>
                ))}
            </div>

            <div className="graphics-section dual-charts">
                <div className="chart-container glass-effect">
                    <div className="section-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <DollarSign size={20} className="text-dim" />
                            <h3>Financial Performance</h3>
                        </div>
                    </div>
                    <div style={{ height: 320, width: '100%', padding: '10px 0' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={overview?.monthlyBreakdown || []} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 11 }} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }} formatter={(val) => formatCurrency(val)} />
                                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                                <Bar dataKey="income" name="Income" fill="var(--success)" radius={[4, 4, 0, 0]} barSize={20}>
                                    <LabelList dataKey="income" position="top" formatter={(val) => val > 0 ? `₹${(val / 1000).toFixed(0)}k` : ''} style={{ fill: 'var(--text-dim)', fontSize: 10, fontWeight: 700 }} />
                                </Bar>
                                <Bar dataKey="expense" name="Expense" fill="var(--danger)" radius={[4, 4, 0, 0]} barSize={20}>
                                    <LabelList dataKey="expense" position="top" formatter={(val) => val > 0 ? `₹${(val / 1000).toFixed(0)}k` : ''} style={{ fill: 'var(--text-dim)', fontSize: 10, fontWeight: 700 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-container glass-effect">
                    <div className="section-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <TrendingUp size={20} className="text-dim" />
                            <h3>Growth Trends</h3>
                        </div>
                    </div>
                    <div style={{ height: 320, width: '100%', padding: '10px 0' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={overview?.monthlyBreakdown || []} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 11 }} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 11 }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 11 }} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                                <Bar yAxisId="left" dataKey="dealWins" name="Deal Wins" fill="var(--accent)" radius={[4, 4, 0, 0]} barSize={20}>
                                    <LabelList dataKey="dealWins" position="top" formatter={(val) => val > 0 ? val : ''} style={{ fill: 'var(--text-dim)', fontSize: 10, fontWeight: 700 }} />
                                </Bar>
                                <Bar yAxisId="right" dataKey="contractValue" name="Contract Value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20}>
                                    <LabelList dataKey="contractValue" position="top" formatter={(val) => val > 0 ? `₹${(val / 1000).toFixed(0)}k` : ''} style={{ fill: 'var(--text-dim)', fontSize: 10, fontWeight: 700 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="overview-content">
                <div className="data-section glass-effect">
                    <div className="section-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <BarChart3 size={20} className="text-dim" />
                            <h3>Monthly Performance Breakdown</h3>
                        </div>
                    </div>
                    <DataTable
                        data={overview?.monthlyBreakdown || []}
                        columns={monthlyColumns}
                        loading={loading}
                        hideToolbar
                        compact
                        selectable={false}
                    />

                    {!loading && overview && (
                        <div className="consolidated-stats-wrapper">
                            <div className="stats-card">
                                <div className="stats-header">Financial Summary</div>
                                <div className="stats-body">
                                    <div className="stats-row">
                                        <span className="stats-label">Total Deals Won</span>
                                        <span className="stats-value wins">{overview.monthlyBreakdown.reduce((s, m) => s + m.dealWins, 0)}</span>
                                    </div>
                                    <div className="stats-row">
                                        <span className="stats-label">Total Contract Value</span>
                                        <span className="stats-value">{formatCurrency(overview.totalContractValue)}</span>
                                    </div>
                                    <div className="stats-divider"></div>
                                    <div className="stats-row">
                                        <span className="stats-label">Total Income</span>
                                        <span className="stats-value income">{formatCurrency(overview.totalIncome)}</span>
                                    </div>
                                    <div className="stats-row">
                                        <span className="stats-label">Total Expenses</span>
                                        <span className="stats-value expense">{formatCurrency(overview.totalExpenses)}</span>
                                    </div>
                                    <div className="stats-row highlight">
                                        <span className="stats-label">Net Profit</span>
                                        <span className="stats-value profit" style={{ color: overview.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                            {formatCurrency(overview.netProfit)}
                                        </span>
                                    </div>
                                    <div className="stats-divider"></div>
                                    <div 
                                        className="stats-row pending clickable"
                                        onClick={() => navigate('/projects', { state: { acquisitionStartDate: dateRange.start, acquisitionEndDate: dateRange.end } })}
                                    >
                                        <span className="stats-label">Pending Amount</span>
                                        <span className="stats-value">{formatCurrency(overview.pendingAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .finance-overview { padding: 24px; animation: fadeIn 0.4s ease-out; }
                .kpi-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); 
                    gap: 20px; 
                    margin-bottom: 32px; 
                }
                .kpi-card {
                    padding: 24px;
                    border-radius: 20px;
                    border: 1px solid var(--border);
                    transition: transform 0.3s ease;
                }
                .kpi-card:hover { transform: translateY(-5px); border-color: var(--accent); }
                .kpi-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
                .kpi-icon { 
                    width: 48px; height: 48px; border-radius: 14px; 
                    display: flex; align-items: center; justify-content: center; 
                }
                .kpi-label { font-size: 14px; color: var(--text-dim); font-weight: 600; }
                .kpi-value { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
                .kpi-desc { font-size: 12px; color: var(--text-muted); }

                .overview-content { display: grid; grid-template-columns: 1fr; gap: 24px; }
                .data-section { 
                    padding: 24px; border-radius: 20px; border: 1px solid var(--border); 
                }
                .section-header { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
                .section-header h3 { font-size: 18px; font-weight: 700; }

                /* Data Bar Styles */
                .data-bar-wrapper {
                    flex: 1;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    overflow: hidden;
                    max-width: 80px;
                }
                .data-bar {
                    height: 100%;
                    background: linear-gradient(90deg, var(--success), #34d399);
                    border-radius: 4px;
                }

                /* Growth Tag Styles */
                .growth-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                }
                .growth-tag.up { color: var(--success); background: rgba(16, 185, 129, 0.1); }
                .growth-tag.down { color: var(--danger); background: rgba(239, 68, 68, 0.1); }

                /* Consolidated Stats Styles */
                .consolidated-stats-wrapper {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 24px;
                }
                .stats-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    width: 380px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                    border-top: 4px solid var(--accent);
                }
                .stats-header {
                    padding: 12px 20px;
                    background: rgba(255,255,255,0.02);
                    border-bottom: 1px solid var(--border);
                    font-size: 14px;
                    font-weight: 700;
                    color: var(--text-dim);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .stats-body {
                    padding: 16px 20px;
                }
                .stats-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                    font-size: 14px;
                    border-bottom: 1px solid rgba(255,255,255,0.02);
                }
                .stats-row:last-child {
                    border-bottom: none;
                }
                .stats-row.highlight {
                    margin-top: 4px;
                    padding-top: 14px;
                    border-top: 1px solid var(--border);
                }
                .stats-row.pending {
                    margin-top: 8px;
                    background: rgba(255, 193, 7, 0.05);
                    padding: 14px;
                    border-radius: 12px;
                    margin-left: -4px;
                    margin-right: -4px;
                    border: 1px solid rgba(255, 193, 7, 0.1);
                    color: #ffc107;
                }
                .stats-row.clickable {
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .stats-row.clickable:hover {
                    background: rgba(255, 193, 7, 0.1);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(255, 193, 7, 0.1);
                }
                .stats-divider {
                    height: 1px;
                    background: var(--border);
                    margin: 8px 0;
                    opacity: 0.3;
                }
                .stats-label {
                    color: var(--text-dim);
                    font-weight: 500;
                    font-size: 13px;
                }
                .stats-value {
                    font-weight: 700;
                    color: var(--text);
                    font-family: var(--font-mono, monospace);
                }
                .stats-value.wins { color: var(--accent); }
                .stats-value.income { color: var(--success); }
                .stats-value.expense { color: var(--danger); }
                .stats-value.profit { font-size: 18px; letter-spacing: -0.01em; }

                .graphics-section { margin-bottom: 32px; }
                .dual-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                .chart-container { padding: 24px; border-radius: 20px; border: 1px solid var(--border); background: var(--bg-card); }

                @media (max-width: 1200px) {
                    .dual-charts { grid-template-columns: 1fr; }
                    .kpi-bar { grid-template-columns: 1fr 1fr; }
                }

                @media (max-width: 768px) {
                    .kpi-bar { grid-template-columns: 1fr; }
                    .consolidated-stats-wrapper { justify-content: stretch; }
                    .stats-card { width: 100%; }
                }
                
                .clickable-card { cursor: pointer; }
                .clickable-cell { transition: background 0.2s; }
                .clickable-cell:hover { background: rgba(255, 255, 255, 0.05); }

                .icon-box { 
                    width: 32px; height: 32px; border-radius: 8px; 
                    display: flex; align-items: center; justify-content: center;
                }
                .icon-box.bank { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .icon-box.cash { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .icon-box.partner { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
