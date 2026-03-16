import { useState, useEffect, useMemo } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/common/DataTable';
import { CreditCard, Play, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';

export default function HRAdminPayroll() {
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [slips, setSlips] = useState([]);
    const [loading, setLoading] = useState(false);

    // For calculation
    const [calcMonth, setCalcMonth] = useState(new Date().getMonth() + 1);
    const [calcYear, setCalcYear] = useState(new Date().getFullYear());

    const loadPeriods = () => {
        setLoading(true);
        api.get('/payroll/periods')
            .then(res => setPeriods(res.data.data))
            .catch(err => console.error('Failed to load periods', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadPeriods();
    }, []);

    const loadSlips = (periodId) => {
        api.get('/payroll/slips', { params: { periodId } })
            .then(res => setSlips(res.data.data))
            .catch(err => toast.error('Failed to load slips'));
    };

    const handleCalculate = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await api.post('/payroll/calculate', { month: calcMonth, year: calcYear });
            toast.success(`Calculated draft payroll for ${calcMonth}/${calcYear}`);
            loadPeriods();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to calculate payroll');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async (periodId) => {
        if (!window.confirm('Are you sure you want to publish this payroll? Employees will see their salary slips immediately.')) return;
        try {
            setLoading(true);
            await api.post(`/payroll/publish/${periodId}`);
            toast.success('Payroll published successfully');
            loadPeriods();
            if (selectedPeriod?.id === periodId) {
                setSelectedPeriod(prev => ({ ...prev, status: 'published' }));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to publish');
        } finally {
            setLoading(false);
        }
    };

    const columns = useMemo(() => [
        { 
            label: 'Employee', 
            key: 'profile.full_name', 
            width: '200px',
            render: (_, row) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{row.profile?.full_name || 'Unknown'}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{row.user?.email}</span>
                </div>
            )
        },
        { 
            label: 'Gross Salary', 
            key: 'gross_salary', 
            type: 'currency', 
            render: val => formatCurrency(val) 
        },
        {
            label: 'Deductions',
            key: 'total_deductions',
            type: 'currency',
            render: val => <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{formatCurrency(val)}</span>
        },
        {
            label: 'Net Payable',
            key: 'net_payable',
            type: 'currency',
            render: val => <span style={{ color: 'var(--success)', fontWeight: 800 }}>{formatCurrency(val)}</span>
        }
    ], []);

    return (
        <div className="payroll-page">
            <div className="page-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CreditCard className="text-accent" />
                        Admin Payroll
                    </h1>
                    <p>Calculate monthly drafts, review deductions, and publish salary slips.</p>
                </div>
            </div>

            <div className="card polished-card filter-bar" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', padding: 8 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Month</label>
                        <select className="form-select" value={calcMonth} onChange={e => setCalcMonth(Number(e.target.value))}>
                            {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Year</label>
                        <input className="form-input" type="number" value={calcYear} onChange={e => setCalcYear(Number(e.target.value))} style={{ width: 100 }} />
                    </div>
                    <button className="btn btn-primary" onClick={handleCalculate} disabled={loading}>
                        <Play size={16} /> Calculate Draft
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 300px) 1fr', gap: 24, alignItems: 'start' }}>
                <div className="card polished-card" style={{ padding: 0 }}>
                    <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)' }}>Payroll Periods</h3>
                    </div>

                    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {periods.length === 0 && <div className="text-dim text-center" style={{ padding: 20 }}>No periods.</div>}
                        {periods.map(p => (
                            <div
                                key={p.id}
                                onClick={() => { setSelectedPeriod(p); loadSlips(p.id); }}
                                className={`period-item ${selectedPeriod?.id === p.id ? 'active' : ''}`}
                            >
                                <div>
                                    <div style={{ fontWeight: 700 }}>{new Date(0, p.month - 1).toLocaleString('en', { month: 'long' })} {p.year}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{p.slipCount} slips</div>
                                </div>
                                <div>
                                    {p.status === 'published' ? (
                                        <span className="badge badge-green"><CheckCircle size={10} /> Published</span>
                                    ) : (
                                        <span className="badge badge-orange">Draft</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card table-card" style={{ minHeight: 500 }}>
                    {selectedPeriod ? (
                        <>
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                                    {new Date(0, selectedPeriod.month - 1).toLocaleString('en', { month: 'long' })} {selectedPeriod.year} Details
                                </h3>
                                {selectedPeriod.status !== 'published' && (
                                    <button className="btn btn-success btn-sm" onClick={() => handlePublish(selectedPeriod.id)} disabled={loading}>
                                        <CheckCircle size={14} /> Publish Slips
                                    </button>
                                )}
                            </div>
                            <DataTable
                                columns={columns}
                                data={slips}
                                fileName={`payroll_${selectedPeriod.month}_${selectedPeriod.year}`}
                                loading={loading}
                            />
                        </>
                    ) : (
                        <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                            Select a payroll period to view details
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .payroll-page { padding: 8px; }
                .period-item {
                    padding: 12px 16px;
                    border-radius: 8px;
                    border: 1px solid var(--border);
                    background: var(--bg-card);
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s;
                }
                .period-item:hover { background: var(--bg-card-hover); border-color: var(--accent); }
                .period-item.active { background: var(--accent-transparent); border-color: var(--accent); }
                .badge { padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; display: flex; alignItems: center; gap: 4px; }
                .badge-green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .badge-orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }
            `}</style>
        </div>
    );
}
