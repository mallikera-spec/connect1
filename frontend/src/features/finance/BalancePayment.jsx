import React, { useState, useEffect, useMemo } from 'react';
import { financeService } from './financeService';
import DataTable from '../../components/common/DataTable';
import { formatDate, formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { Wallet, Search, Download } from 'lucide-react';

export default function BalancePayment() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchBalancePayments();
    }, []);

    const fetchBalancePayments = async () => {
        try {
            setLoading(true);
            const res = await financeService.getBalancePayments();
            if (res.success) {
                setData(res.data);
            }
        } catch (err) {
            toast.error('Failed to load balance payments');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const s = searchTerm.toLowerCase();
        return data.filter(item => 
            String(item.project_name).toLowerCase().includes(s) ||
            String(item.client_name).toLowerCase().includes(s)
        );
    }, [data, searchTerm]);

    const columns = useMemo(() => [
        {
            key: 'acquisition_date',
            label: 'Acquisition Date',
            align: 'center',
            width: '160px',
            render: (val) => formatDate(val)
        },
        {
            key: 'project_name',
            label: 'Project Name',
            align: 'left'
        },
        {
            key: 'client_name',
            label: 'Client Name',
            align: 'left'
        },
        {
            key: 'amount_received',
            label: 'Amount Received',
            align: 'right',
            render: (val) => (
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                    {formatCurrency(val)}
                </span>
            )
        },
        {
            key: 'amount_pending',
            label: 'Amount Pending',
            align: 'right',
            render: (val) => (
                <span style={{ fontWeight: 700, color: val > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {formatCurrency(val)}
                </span>
            )
        }
    ], []);

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 className="page-title">Balance Payment</h1>
                    <p className="page-subtitle">Project-wise settlement & pending dues</p>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <DataTable
                    data={data}
                    columns={columns}
                    loading={loading}
                    selectable={false}
                    fileName="Project_Balance_Payments"
                />
            </div>

            {data.length > 0 && (
                <div className="card" style={{ marginTop: '24px', background: 'var(--surface-light)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                        <div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Amount Received</p>
                            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success)' }}>
                                {formatCurrency(data.reduce((sum, item) => sum + item.amount_received, 0))}
                            </h3>
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Amount Pending</p>
                            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--danger)' }}>
                                {formatCurrency(data.reduce((sum, item) => sum + item.amount_pending, 0))}
                            </h3>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
