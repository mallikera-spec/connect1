import { useState, useEffect } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/common/DataTable';
import { FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SalarySlips() {
    const [slips, setSlips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSlips();
    }, []);

    const loadSlips = () => {
        setLoading(true);
        api.get('/payroll/my-slips')
            .then(res => setSlips(res.data.data))
            .catch(err => toast.error('Failed to load salary slips'))
            .finally(() => setLoading(false));
    };

    const columns = [
        {
            key: 'month_year',
            header: 'Month',
            render: (val, row) => row.period ? `${new Date(0, row.period.month - 1).toLocaleString('en', { month: 'long' })} ${row.period.year}` : 'Unknown',
            sortable: true
        },
        { key: 'present_days', header: 'Present Days', sortable: true },
        { key: 'lwp_days', header: 'LWP', sortable: true },
        {
            key: 'gross_salary',
            header: 'Gross Salary',
            render: val => `₹${parseFloat(val).toLocaleString('en-IN')}`,
            sortable: true
        },
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

    if (loading && slips.length === 0) return <div className="page-loader"><div className="spinner" /></div>;

    return (
        <div style={{ padding: '2px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <FileText className="text-accent" />
                        My Salary Slips
                    </h1>
                    <p style={{ color: 'var(--text-dim)', marginTop: 4 }}>
                        View and download your monthly salary slips.
                    </p>
                </div>
            </div>

            <div className="card polished-card" style={{ padding: 24 }}>
                <DataTable
                    columns={columns}
                    data={slips}
                    searchPlaceholder="Search by month or year..."
                    searchKeys={['period.month', 'period.year']}
                    title="Published Slips"
                    exportPdfTitle="My_Salary_Slips"
                />
            </div>
        </div>
    );
}
