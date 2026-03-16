import React, { useState, useEffect, useMemo } from 'react';
import { 
    Plus, Package, Search, Download, 
    Edit, Trash2, X, Save, Calendar, Info
} from 'lucide-react';
import { financeService } from './financeService';
import DataTable from '../../components/common/DataTable';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import { formatDate, formatCurrency, toLocalISOString } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AssetRegistry() {
    const [assets, setAssets] = useState([]);
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({
        start: '2020-01-01', // Wide range by default for assets
        end: toLocalISOString(new Date())
    });

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        name: '',
        type: 'Equipment',
        cost: '',
        purchase_date: toLocalISOString(new Date()),
        entity_id: '',
        description: '',
        status: 'Active'
    });

    useEffect(() => {
        fetchInitialData();
        fetchAssets();
    }, []);

    const fetchInitialData = async () => {
        try {
            const entRes = await financeService.getEntities();
            if (entRes.success) setEntities(entRes.data);
        } catch (err) {
            console.error('Failed to load metadata', err);
        }
    };

    const fetchAssets = async (range = dateRange) => {
        try {
            setLoading(true);
            const { data, success } = await financeService.getAssets(range.start, range.end);
            if (success) setAssets(data);
        } catch (err) {
            toast.error('Failed to load assets');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilter = () => {
        fetchAssets();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { success } = await financeService.createAsset(modalData);
            if (success) {
                toast.success('Asset registered');
                setShowModal(false);
                fetchAssets();
                setModalData({
                    name: '',
                    type: 'Equipment',
                    cost: '',
                    purchase_date: toLocalISOString(new Date()),
                    entity_id: '',
                    description: '',
                    status: 'Active'
                });
            }
        } catch (err) {
            toast.error('Failed to save asset');
        }
    };

    const columns = useMemo(() => [
        { 
            key: 'name', 
            label: 'Asset Name',
            render: (val, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="asset-icon">
                        <Package size={16} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600 }}>{val}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{row.type}</div>
                    </div>
                </div>
            )
        },
        { key: 'purchase_date', label: 'Purchase Date', align: 'center', render: (val) => formatDate(val) },
        { 
            key: 'cost', 
            label: 'Cost', 
            align: 'right',
            render: (val) => (
                <span style={{ fontWeight: 700 }}>
                    {formatCurrency(val)}
                </span>
            )
        },
        { key: 'entity.name', label: 'Paid From' },
        { 
            key: 'status', 
            label: 'Status',
            align: 'center',
            render: (val) => (
                <span className={`status-pill ${val.toLowerCase()}`}>
                    {val}
                </span>
            )
        }
    ], []);

    return (
        <div className="asset-registry">
            <header className="page-header">
                <div>
                    <h1>Asset Registry</h1>
                    <p>Manage company equipment and capital investments</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <DateRangeFilter 
                        value={dateRange} 
                        onChange={setDateRange} 
                        onApply={handleApplyFilter} 
                    />
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> Register Asset
                    </button>
                </div>
            </header>

            <DataTable 
                data={assets}
                columns={columns}
                loading={loading}
                fileName="asset_registry"
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
            />

            {showModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal modal-md slideUpSheet">
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">Register New Asset</h2>
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                                    Record a new capital asset or equipment purchase.
                                </p>
                            </div>
                            <button className="btn-icon" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Asset Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control"
                                        required
                                        placeholder="e.g. MacBook Pro M3"
                                        value={modalData.name}
                                        onChange={(e) => setModalData({...modalData, name: e.target.value})}
                                    />
                                </div>

                                <div className="form-row" style={{ marginTop: '16px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select 
                                            className="form-control"
                                            value={modalData.type}
                                            onChange={(e) => setModalData({...modalData, type: e.target.value})}
                                        >
                                            <option value="Equipment">Equipment</option>
                                            <option value="Vehicle">Vehicle</option>
                                            <option value="Real Estate">Real Estate</option>
                                            <option value="Software">Software/License</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select 
                                            className="form-control"
                                            value={modalData.status}
                                            onChange={(e) => setModalData({...modalData, status: e.target.value})}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Maintenance">Maintenance</option>
                                            <option value="Disposed">Disposed</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row" style={{ marginTop: '16px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Purchase Date</label>
                                        <input 
                                            type="date" 
                                            className="form-control"
                                            required
                                            value={modalData.purchase_date}
                                            onChange={(e) => setModalData({...modalData, purchase_date: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Cost (INR)</label>
                                        <input 
                                            type="number" 
                                            className="form-control"
                                            required
                                            placeholder="0.00"
                                            value={modalData.cost}
                                            onChange={(e) => setModalData({...modalData, cost: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginTop: '16px' }}>
                                    <label className="form-label">Paid From Account</label>
                                    <select 
                                        className="form-control"
                                        required
                                        value={modalData.entity_id}
                                        onChange={(e) => setModalData({...modalData, entity_id: e.target.value})}
                                    >
                                        <option value="">Select Entity</option>
                                        {entities.map(ent => <option key={ent.id} value={ent.id}>{ent.name} ({ent.type})</option>)}
                                    </select>
                                </div>

                                <div className="form-group" style={{ marginTop: '16px' }}>
                                    <label className="form-label">Description / Specifications</label>
                                    <textarea 
                                        className="form-control"
                                        placeholder="Serial numbers, specs, etc."
                                        rows="3"
                                        value={modalData.description}
                                        onChange={(e) => setModalData({...modalData, description: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Save size={18} /> Register Asset
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .asset-registry { padding: 24px; animation: fadeIn 0.4s ease-out; }
                .asset-icon { 
                    width: 36px; height: 36px; border-radius: 10px; 
                    background: rgba(var(--accent-rgb), 0.1); color: var(--accent);
                    display: flex; align-items: center; justify-content: center;
                }
                .status-pill { 
                    padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; 
                    text-transform: uppercase; letter-spacing: 0.5px;
                }
                .status-pill.active { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
                .status-pill.maintenance { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
                .status-pill.disposed { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }

                .form-row { display: flex; gap: 16px; }
                .form-row .form-group { flex: 1; }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
