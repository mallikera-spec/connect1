import { useState, useEffect } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/common/DataTable';
import { CreditCard, Play, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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

    const columns = [
        { key: 'full_name', header: 'Employee', render: (val, row) => row.profile?.full_name, sortable: true },
        { key: 'gross_salary', header: 'Gross (INR)', render: val => `₹${parseFloat(val).toLocaleString('en-IN')}`, sortable: true },
        {
            key: 'total_deductions',
            header: 'Deductions',
            render: val => <span className="text-error" style={{ fontWeight: 600 }}>₹{parseFloat(val).toLocaleString('en-IN')}</span>,
            sortable: true
        },
        {
            key: 'net_payable',
            header: 'Net Payable',
            render: val => <span className="text-success" style={{ fontWeight: 800 }}>₹{parseFloat(val).toLocaleString('en-IN')}</span>,
            sortable: true
        }
    ];

    return (
        <div style={{ padding: '2px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CreditCard className="text-accent" />
                        Admin Payroll Management
                    </h1>
                    <p style={{ color: 'var(--text-dim)', marginTop: 4 }}>
                        Calculate monthly drafts, review deductions, and publish salary slips.
                    </p>
                </div>
            </div>

            <div className="card polished-card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', padding: 20 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Month</label>
                        <select className="form-input" value={calcMonth} onChange={e => setCalcMonth(Number(e.target.value))}>
                            {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Year</label>
                        <input className="form-input" type="number" value={calcYear} onChange={e => setCalcYear(Number(e.target.value))} />
                    </div>
                    <button className="btn btn-primary" onClick={handleCalculate} disabled={loading} style={{ height: 42 }}>
                        <Play size={16} />
                        Calculate Draft Payroll
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
                <div className="card polished-card" style={{ padding: 0 }}>
                    <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Payroll Periods</h3>
                    </div>

                    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {periods.length === 0 && <div className="text-dim text-center" style={{ padding: 20 }}>No periods calculated yet.</div>}
                        {periods.map(p => (
                            <div
                                key={p.id}
                                onClick={() => { setSelectedPeriod(p); loadSlips(p.id); }}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: 8,
                                    border: `1px solid ${selectedPeriod?.id === p.id ? 'var(--accent)' : 'var(--border)'}`,
                                    background: selectedPeriod?.id === p.id ? 'var(--accent-transparent)' : 'var(--bg-card-hover)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 700 }}>{new Date(0, p.month - 1).toLocaleString('en', { month: 'long' })} {p.year}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{p.slipCount} slips generated</div>
                                </div>
                                <div>
                                    {p.status === 'published' ? (
                                        <span className="badge badge-success"><CheckCircle size={12} /> Published</span>
                                    ) : (
                                        <span className="badge badge-warning">Draft</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card polished-card" style={{ padding: 0, minHeight: 400 }}>
                    {selectedPeriod ? (
                        <>
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card-hover)', borderRadius: '12px 12px 0 0' }}>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                                        {new Date(0, selectedPeriod.month - 1).toLocaleString('en', { month: 'long' })} {selectedPeriod.year} Details
                                    </h3>
                                </div>
                                {selectedPeriod.status !== 'published' && (
                                    <button className="btn btn-success" onClick={() => handlePublish(selectedPeriod.id)} disabled={loading}>
                                        <CheckCircle size={16} /> Publish Slips
                                    </button>
                                )}
                            </div>
                            <div style={{ padding: 24 }}>
                                <DataTable
                                    columns={columns}
                                    data={slips}
                                    searchPlaceholder="Search employees..."
                                    searchKeys={['profile.full_name']}
                                    title={`${slips.length} Employees`}
                                    exportPdfTitle="Salary_Drafts"
                                />
                            </div>
                        </>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', padding: 40 }}>
                            Select a payroll period to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
