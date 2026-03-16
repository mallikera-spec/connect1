import React, { useState, useEffect, useMemo } from 'react';
import { 
    CircleDollarSign, TrendingUp, TrendingDown, 
    Wallet, Briefcase, Calendar, RefreshCw, BarChart3
} from 'lucide-react';
import { financeService } from './financeService';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import DataTable from '../../components/common/DataTable';
import { formatCurrency, toLocalISOString } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function FinanceOverview() {
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

    const entityColumns = useMemo(() => [
        { 
            key: 'name', 
            label: 'Entity / account',
            render: (val, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className={`icon-box ${row.type.toLowerCase()}`}>
                        {row.type === 'Bank' ? <Briefcase size={16} /> : <Wallet size={16} />}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600 }}>{val}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{row.type}</div>
                    </div>
                </div>
            )
        },
        { 
            key: 'balance', 
            label: 'Current Balance',
            align: 'right',
            render: (val) => (
                <span style={{ 
                    fontWeight: 700, 
                    color: val >= 0 ? 'var(--success)' : 'var(--danger)',
                    fontFamily: 'monospace',
                    fontSize: '15px'
                }}>
                    {formatCurrency(val)}
                </span>
            )
        }
    ], []);

    const kpis = [
        { 
            label: 'Total Revenue', 
            value: overview?.totalIncome || 0, 
            icon: TrendingUp, 
            color: 'var(--success)',
            desc: 'Gross income for period'
        },
        { 
            label: 'Total Expenses', 
            value: overview?.totalExpenses || 0, 
            icon: TrendingDown, 
            color: 'var(--danger)',
            desc: 'Operational expenditure'
        },
        { 
            label: 'Net Profit', 
            value: overview?.netProfit || 0, 
            icon: CircleDollarSign, 
            color: 'var(--accent)',
            desc: 'Revenue minus expenses'
        },
        { 
            label: 'Assets Value', 
            value: overview?.totalAssets || 0, 
            icon: BarChart3, 
            color: 'var(--warning)',
            desc: 'Total equipment & inventory'
        }
    ];

    return (
        <div className="finance-overview">
            <header className="page-header">
                <div>
                    <h1>Financial Intelligence</h1>
                    <p>Real-time consolidated balance and health analytics</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <DateRangeFilter 
                        value={dateRange} 
                        onChange={handleDateChange} 
                        onApply={handleApplyFilter} 
                    />
                    <button className="btn-icon" onClick={() => fetchOverview()} title="Refresh">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            <div className="kpi-grid">
                {kpis.map((kpi, i) => (
                    <div key={i} className="kpi-card glass-effect">
                        <div className="kpi-header">
                            <div className="kpi-icon" style={{ background: `${kpi.color}15`, color: kpi.color }}>
                                <kpi.icon size={24} />
                            </div>
                            <span className="kpi-label">{kpi.label}</span>
                        </div>
                        <div className="kpi-value">{formatCurrency(kpi.value)}</div>
                        <div className="kpi-desc">{kpi.desc}</div>
                    </div>
                ))}
            </div>

            <div className="overview-content">
                <div className="data-section glass-effect">
                    <div className="section-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Wallet size={20} className="text-dim" />
                            <h3>Entity & Wallet Balances</h3>
                        </div>
                    </div>
                    <DataTable 
                        data={overview?.entityBalances || []}
                        columns={entityColumns}
                        loading={loading}
                        hideToolbar
                        compact
                    />
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
