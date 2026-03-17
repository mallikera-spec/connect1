import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Plus, TrendingUp, TrendingDown,
    CircleDollarSign, X, Save, Edit, Trash2,
    Filter, RotateCcw
} from 'lucide-react';
import { financeService } from './financeService';
import { ClientsService } from '../projects/ClientsService';
import DataTable from '../../components/common/DataTable';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import { formatDate, formatCurrency, toLocalISOString } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

const CFO_EMAILS = ['admin@argosmob.com', 'chandan@argosmob.com'];

export default function FinanceTransactions() {
    const { user } = useAuth();
    const location = useLocation();
    const isCFO = useMemo(() => user && CFO_EMAILS.includes(user.email.toLowerCase()), [user]);

    const [activeTab, setActiveTab] = useState('income');
    const [incomes, setIncomes] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [entities, setEntities] = useState([]);
    const [categories, setCategories] = useState([]);
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({
        start: toLocalISOString(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
        end: toLocalISOString(new Date())
    });

    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filters, setFilters] = useState({
        entity_id: '',
        category_id: '',
        type: ''
    });

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        date: toLocalISOString(new Date()),
        amount: '',
        type: 'Domestic',
        entity_id: '',
        client_id: '',
        project_id: '',
        description: '',
        category: 'Project',
        category_id: '',
    });

    useEffect(() => {
        fetchInitialData();
        fetchTransactions();
    }, []);

    useEffect(() => {
        if (location.state) {
            if (location.state.tab) setActiveTab(location.state.tab);
            
            if (location.state.startDate && location.state.endDate) {
                const newRange = {
                    start: location.state.startDate,
                    end: location.state.endDate
                };
                setDateRange(newRange);
                fetchTransactions(newRange);
            }

            if (location.state.openModal) {
                resetModal();
                setShowModal(true);
            }
            
            // Clear state after consuming to avoid re-triggering on fresh load
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const fetchInitialData = async () => {
        try {
            const [entRes, catRes, cliRes, projRes] = await Promise.all([
                financeService.getEntities(),
                financeService.getCategories(),
                ClientsService.getClients(),
                api.get('/projects')
            ]);
            if (entRes.success) setEntities(entRes.data);
            if (catRes.success) setCategories(catRes.data);
            if (cliRes.data?.success) setClients(cliRes.data.data);
            else if (cliRes.success) setClients(cliRes.data);
            if (projRes.data?.success) setProjects(projRes.data.data);
            else if (projRes.data) setProjects(projRes.data);
        } catch (err) {
            console.error('Failed to load metadata', err);
        }
    };

    const fetchTransactions = async (range = dateRange) => {
        try {
            setLoading(true);
            const [incRes, expRes] = await Promise.all([
                financeService.getIncomes(range.start, range.end),
                financeService.getExpenses(range.start, range.end)
            ]);
            if (incRes.success) setIncomes(incRes.data);
            if (expRes.success) setExpenses(expRes.data);
        } catch (err) {
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilter = () => {
        fetchTransactions();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const isEdit = !!modalData.id;
            const serviceCall = activeTab === 'income'
                ? (isEdit ? financeService.updateIncome : financeService.createIncome)
                : (isEdit ? financeService.updateExpense : financeService.createExpense);

            const payload = { ...modalData };
            // Cleanup related fields before sending
            if (activeTab === 'expense') {
                delete payload.client_id;
                delete payload.project_id;
                delete payload.type;
                delete payload.entity; // Remove populated relational data
                delete payload.category_info;
            } else {
                delete payload.category_id;
                delete payload.entity;
                delete payload.client;
                delete payload.project;
                // Ensure project_id is null if not selected
                if (!payload.project_id) payload.project_id = null;
            }

            const { success } = isEdit
                ? await serviceCall(modalData.id, payload)
                : await serviceCall(payload);

            if (success) {
                toast.success(`${activeTab === 'income' ? 'Income' : 'Expense'} ${isEdit ? 'updated' : 'recorded'}`);
                setShowModal(false);
                fetchTransactions();
                resetModal();
            }
        } catch (err) {
            toast.error(err.message || 'Failed to save');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this transaction?')) return;
        try {
            const serviceCall = activeTab === 'income'
                ? financeService.deleteIncome
                : financeService.deleteExpense;
            const { success } = await serviceCall(id);
            if (success) {
                toast.success('Transaction deleted');
                fetchTransactions();
            }
        } catch (err) {
            toast.error('Failed to delete');
        }
    };
    
    const { filteredIncomes, filteredExpenses, totalIncome, totalExpense, netProfit, entityBreakdown } = useMemo(() => {
        const matchesSearch = (item, term) => {
            if (!term) return true;
            const s = term.toLowerCase();
            return Object.values(item).some(val => {
                if (val === null || val === undefined) return false;
                if (typeof val === 'object') {
                    return Object.values(val).some(v => String(v).toLowerCase().includes(s));
                }
                return String(val).toLowerCase().includes(s);
            });
        };

        const fIncomes = incomes.filter(item => {
            const matchEntity = !filters.entity_id || item.entity_id === filters.entity_id;
            const matchType = !filters.type || item.type === filters.type;
            const matchSearch = matchesSearch(item, searchTerm);
            return matchEntity && matchType && matchSearch;
        });

        const fExpenses = expenses.filter(item => {
            const matchEntity = !filters.entity_id || item.entity_id === filters.entity_id;
            const matchCategory = !filters.category_id || item.category_id === filters.category_id;
            const matchSearch = matchesSearch(item, searchTerm);
            return matchEntity && matchCategory && matchSearch;
        });

        const tIncome = fIncomes.reduce((s, i) => s + Number(i.amount), 0);
        const tExpense = fExpenses.reduce((s, e) => s + Number(e.amount), 0);
        
        const eBreakdown = entities.map(ent => {
            const inc = fIncomes.filter(i => i.entity_id === ent.id).reduce((s, i) => s + Number(i.amount), 0);
            const exp = fExpenses.filter(e => e.entity_id === ent.id).reduce((s, e) => s + Number(e.amount), 0);
            return { ...ent, income: inc, expense: exp, net: inc - exp };
        }).filter(e => e.income > 0 || e.expense > 0);

        return { 
            filteredIncomes: fIncomes, 
            filteredExpenses: fExpenses, 
            totalIncome: tIncome, 
            totalExpense: tExpense, 
            netProfit: tIncome - tExpense,
            entityBreakdown: eBreakdown
        };
    }, [incomes, expenses, filters, searchTerm, entities]);

    const resetModal = () => {
        setModalData({
            date: toLocalISOString(new Date()),
            amount: '',
            type: 'Domestic',
            entity_id: '',
            client_id: '',
            project_id: '',
            description: '',
            category: 'Project',
            category_id: '',
        });
    };

    const incomeColumns = useMemo(() => [
        {
            key: 'date',
            label: 'Day',
            render: (val) => new Date(val).toLocaleDateString('en-US', { weekday: 'long' })
        },
        { key: 'date', label: 'Date', render: (val) => formatDate(val) },
        {
            key: 'type',
            label: 'Type',
            render: (val) => (
                <span className={`badge ${val === 'Domestic' ? 'badge-blue' : 'badge-purple'}`}>
                    {val}
                </span>
            )
        },
        { key: 'client.company_name', label: 'Client' },
        { key: 'project.name', label: 'Project', render: (val) => val || '--' },
        {
            key: 'amount',
            label: 'Amount',
            align: 'right',
            render: (val) => (
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                    {formatCurrency(val)}
                </span>
            )
        },
        { key: 'entity.name', label: 'Account' },
        { key: 'description', label: 'Notes' },
        {
            key: 'actions',
            label: 'Actions',
            align: 'center',
            width: '140px',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {isCFO ? (
                        <>
                            <button className="btn-icon btn-sm" title="Edit" onClick={(e) => { e.stopPropagation(); setModalData(row); setShowModal(true); }}>
                                <Edit size={14} />
                            </button>
                            <button className="btn-icon btn-sm" title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}>
                                <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                            </button>
                        </>
                    ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>View Only</span>
                    )}
                </div>
            )
        }
    ], [entities, showModal, isCFO]);

    const expenseColumns = useMemo(() => [
        {
            key: 'date',
            label: 'Day',
            render: (val) => new Date(val).toLocaleDateString('en-US', { weekday: 'long' })
        },
        { key: 'date', label: 'Date', render: (val) => formatDate(val) },
        {
            key: 'category_info.name',
            label: 'Category',
            render: (val, row) => {
                const cat = row.category_info || categories.find(c => c.name.toLowerCase() === row.category?.toLowerCase());
                const color = cat?.color || '#ccc';
                const label = val || row.category || 'General';

                return (
                    <span className="category-badge" style={{
                        background: `${color}15`,
                        color: color,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: `1px solid ${color}30`
                    }}>
                        {label}
                    </span>
                );
            }
        },
        { key: 'description', label: 'Line Item' },
        {
            key: 'amount',
            label: 'Amount',
            align: 'right',
            render: (val) => (
                <span style={{ fontWeight: 700, color: 'var(--danger)' }}>
                    {formatCurrency(val)}
                </span>
            )
        },
        { key: 'entity.name', label: 'Paid by' },
        {
            key: 'actions',
            label: 'Actions',
            align: 'center',
            width: '140px',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {isCFO ? (
                        <>
                            <button className="btn-icon btn-sm" title="Edit" onClick={(e) => { e.stopPropagation(); setModalData(row); setShowModal(true); }}>
                                <Edit size={14} />
                            </button>
                            <button className="btn-icon btn-sm" title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}>
                                <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                            </button>
                        </>
                    ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>View Only</span>
                    )}
                </div>
            )
        }
    ], [entities, categories, showModal, isCFO]);

    const displayData = activeTab === 'income' ? filteredIncomes : filteredExpenses;

    return (
        <div className="finance-transactions">
            <header className="page-header">
                <div>
                    <h1>Transaction Registry</h1>
                    <p>Track cash flow and business expenditures</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <DateRangeFilter
                        value={dateRange}
                        onChange={setDateRange}
                        onApply={handleApplyFilter}
                    />
                    <button
                        className={`btn btn-outline btn-sm ${showFilterPanel ? 'active' : ''}`}
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        style={{ background: showFilterPanel ? 'var(--bg-app)' : 'transparent', borderColor: showFilterPanel ? 'var(--accent)' : 'var(--border)' }}
                    >
                        <Filter size={14} /> {showFilterPanel ? 'Hide Filters' : 'Filters'}
                    </button>
                    {isCFO && (
                        <>
                            <button
                                className="btn btn-success btn-sm"
                                onClick={() => { setActiveTab('income'); resetModal(); setShowModal(true); }}
                            >
                                <TrendingUp size={16} /> Record Income
                            </button>
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={() => { setActiveTab('expense'); resetModal(); setShowModal(true); }}
                            >
                                <TrendingDown size={16} /> Record Expense
                            </button>
                        </>
                    )}
                </div>
            </header>

            {showFilterPanel && (
                <div className="card polished-card filter-panel slideDownAnim" style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                    <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: '11px' }}>Account / Entity</label>
                            <select
                                className="form-control"
                                value={filters.entity_id}
                                onChange={(e) => setFilters({ ...filters, entity_id: e.target.value })}
                            >
                                <option value="">All Accounts</option>
                                {entities.map(ent => <option key={ent.id} value={ent.id}>{ent.name}</option>)}
                            </select>
                        </div>

                        {activeTab === 'income' ? (
                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: '11px' }}>Income Type</label>
                                <select
                                    className="form-control"
                                    value={filters.type}
                                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                >
                                    <option value="">All Types</option>
                                    <option value="Domestic">Domestic</option>
                                    <option value="International">International</option>
                                </select>
                            </div>
                        ) : (
                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: '11px' }}>Category</label>
                                <select
                                    className="form-control"
                                    value={filters.category_id}
                                    onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setFilters({ entity_id: '', category_id: '', type: '' })}
                                style={{ height: '38px' }}
                            >
                                <RotateCcw size={14} /> Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="tab-container">
                <button
                    className={`tab ${activeTab === 'income' ? 'active' : ''}`}
                    onClick={() => setActiveTab('income')}
                >
                    <TrendingUp size={18} /> Income
                </button>
                <button
                    className={`tab ${activeTab === 'expense' ? 'active' : ''}`}
                    onClick={() => setActiveTab('expense')}
                >
                    <TrendingDown size={18} /> Expenses
                </button>
            </div>

            <DataTable
                data={displayData}
                columns={activeTab === 'income' ? incomeColumns : expenseColumns}
                loading={loading}
                fileName={`finance_${activeTab}s`}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
            />

            {!loading && (
                <div className="consolidated-stats-wrapper ledger-summary">
                    {/* Entity Breakdown Card */}
                    {entityBreakdown.length > 0 && (
                        <div className="stats-card entity-summary" style={{ borderTopColor: 'var(--info)' }}>
                            <div className="stats-header">Account Breakdown</div>
                            <div className="stats-body">
                                {entityBreakdown.map(ent => (
                                    <div key={ent.id} className="entity-summary-row">
                                        <div className="entity-info">
                                            <div className="entity-avatar-sm">{ent.name[0]}</div>
                                            <span className="entity-name">{ent.name}</span>
                                        </div>
                                        <div className="entity-amounts">
                                            <div className="ent-amt inc">+{formatCurrency(ent.income)}</div>
                                            <div className="ent-amt exp">-{formatCurrency(ent.expense)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Global Summary Card */}
                    <div className="stats-card">
                        <div className="stats-header">Transaction Summary</div>
                        <div className="stats-body">
                            <div className="stats-row">
                                <span className="stats-label">Total Income</span>
                                <span className="stats-value income">{formatCurrency(totalIncome)}</span>
                            </div>
                            <div className="stats-row">
                                <span className="stats-label">Total Expenses</span>
                                <span className="stats-value expense">{formatCurrency(totalExpense)}</span>
                            </div>
                            <div className="stats-row highlight">
                                <span className="stats-label">Net Profit</span>
                                <span className="stats-value profit" style={{ color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                    {formatCurrency(netProfit)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div 
                    className="modal-overlay" 
                    onMouseDown={(e) => {
                        // Track where the mouse started
                        e.currentTarget.dataset.mouseDownTarget = e.target === e.currentTarget;
                    }}
                    onMouseUp={(e) => {
                        // Only close if both start and end were on the overlay
                        if (e.target === e.currentTarget && e.currentTarget.dataset.mouseDownTarget === "true") {
                            setShowModal(false);
                        }
                    }}
                >
                    <div className="modal modal-md slideUpSheet">
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">Record {activeTab === 'income' ? 'Income' : 'Expense'}</h2>
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                                    {activeTab === 'income' ? 'Log payment received from a client.' : 'Log a business expenditure or bill.'}
                                </p>
                            </div>
                            <button className="btn-icon" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Date</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            required
                                            value={modalData.date}
                                            onChange={(e) => setModalData({ ...modalData, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Amount</label>
                                        <div className="input-with-icon">
                                            <CircleDollarSign size={16} />
                                            <input
                                                type="number"
                                                className="form-control"
                                                required
                                                placeholder="0.00"
                                                value={modalData.amount}
                                                onChange={(e) => setModalData({ ...modalData, amount: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row" style={{ marginTop: '16px' }}>
                                    {activeTab === 'income' ? (
                                        <>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label className="form-label">Income Type</label>
                                                    <select
                                                        className="form-control"
                                                        value={modalData.type}
                                                        onChange={(e) => setModalData({ ...modalData, type: e.target.value })}
                                                    >
                                                        <option value="Domestic">Domestic (INR)</option>
                                                        <option value="International">International (USD/Other)</option>
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Client</label>
                                                    <select
                                                        className="form-control"
                                                        required
                                                        value={modalData.client_id}
                                                        onChange={(e) => setModalData({ ...modalData, client_id: e.target.value })}
                                                    >
                                                        <option value="">Select Client</option>
                                                        {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="form-group" style={{ marginTop: '16px' }}>
                                                <label className="form-label">Project (Optional)</label>
                                                <select
                                                    className="form-control"
                                                    value={modalData.project_id}
                                                    onChange={(e) => setModalData({ ...modalData, project_id: e.target.value })}
                                                >
                                                    <option value="">Select Project</option>
                                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="form-group" style={{ flex: 2 }}>
                                            <label className="form-label">Category</label>
                                            <select
                                                className="form-control"
                                                required
                                                value={modalData.category_id}
                                                onChange={(e) => setModalData({ ...modalData, category_id: e.target.value })}
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group" style={{ marginTop: '16px' }}>
                                    <label className="form-label">
                                        {activeTab === 'income' ? 'Receiving Account' : 'Paid by (Paying Account)'}
                                    </label>
                                    <select
                                        className="form-control"
                                        required
                                        value={modalData.entity_id}
                                        onChange={(e) => setModalData({ ...modalData, entity_id: e.target.value })}
                                    >
                                        <option value="">Select Entity / Wallet</option>
                                        {entities.map(ent => <option key={ent.id} value={ent.id}>{ent.name} ({ent.type})</option>)}
                                    </select>
                                </div>



                                <div className="form-group" style={{ marginTop: '16px' }}>
                                    <label className="form-label">
                                        {activeTab === 'income' ? 'Description / Notes' : 'Line Item'}
                                    </label>
                                    <textarea
                                        className="form-control"
                                        placeholder={activeTab === 'income' ? "Add any additional details..." : "What exactly was this for?"}
                                        rows="3"
                                        value={modalData.description}
                                        onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Save size={18} /> Record {activeTab === 'income' ? 'Income' : 'Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .finance-transactions { padding: 24px; animation: fadeIn 0.4s ease-out; }
                .tab-container { display: flex; gap: 4px; margin-bottom: 24px; background: rgba(255,255,255,0.03); padding: 4px; border-radius: 12px; width: fit-content; border: 1px solid var(--border); }
                .tab { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px; border: none; background: none; color: var(--text-dim); cursor: pointer; font-weight: 600; transition: all 0.2s; }
                .tab.active { background: var(--bg-card); color: var(--accent-light); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                
                .badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
                .badge-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .badge-purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
                
                .category-badge { display: inline-flex; align-items: center; justify-content: center; }

                .form-row { display: flex; gap: 16px; }
                .form-row .form-group { flex: 1; }
                .input-with-icon { position: relative; display: flex; align-items: center; }
                .input-with-icon svg { position: absolute; left: 12px; color: var(--text-dim); pointer-events: none; }
                .input-with-icon .form-control { padding-left: 36px; }
                
                .tab.active svg { color: var(--accent-light); }

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
                    width: 320px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                    border-top: 4px solid var(--accent);
                }
                .stats-header {
                    padding: 12px 20px;
                    background: rgba(255, 255, 255, 0.03);
                    border-bottom: 1px solid var(--border);
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--text-dim);
                }
                .stats-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
                .stats-row { display: flex; justify-content: space-between; align-items: center; }
                .stats-label { font-size: 13px; color: var(--text-dim); }
                .stats-value { font-size: 15px; font-weight: 700; }
                .stats-value.income { color: var(--success); }
                .stats-value.expense { color: var(--danger); }
                .stats-row.highlight { 
                    margin-top: 8px;
                    padding-top: 12px;
                    border-top: 1px dashed var(--border);
                }
                .stats-row.highlight .stats-label { font-weight: 700; color: var(--text); }
                .stats-row.highlight .stats-value { font-size: 18px; }

                /* Entity Summary Specifics */
                .ledger-summary { gap: 24px; flex-wrap: wrap; }
                .entity-summary-row { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    padding-bottom: 8px;
                    border-bottom: 1px solid rgba(255,255,255,0.02);
                }
                .entity-summary-row:last-child { border-bottom: none; padding-bottom: 0; }
                .entity-info { display: flex; align-items: center; gap: 10px; }
                .entity-avatar-sm { 
                    width: 28px; height: 28px; border-radius: 8px; 
                    background: var(--accent); color: white; 
                    display: flex; align-items: center; justify-content: center; 
                    font-size: 11px; font-weight: 800;
                }
                .entity-name { font-size: 13px; font-weight: 600; color: var(--text-dim); }
                .entity-amounts { text-align: right; }
                .ent-amt { font-size: 11px; font-weight: 700; }
                .ent-amt.inc { color: var(--success); }
                .ent-amt.exp { color: var(--danger); opacity: 0.8; }

                .slideDownAnim { animation: slideDown 0.3s ease-out; }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
