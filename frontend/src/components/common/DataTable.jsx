import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Download, FileText, ChevronUp, ChevronDown,
    ChevronLeft, ChevronRight, Settings, Copy, Check, MoreVertical,
    Search, Filter, X
} from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { formatDate, formatDateTime } from '../../utils/formatters';

const DataTable = ({
    data = [],
    columns = [],
    renderRow,
    fileName = 'data-export',
    loading = false,
    emptyMessage = 'No records found',
    // Server-side props
    totalItems: externalTotalItems,
    currentPage: externalCurrentPage,
    itemsPerPage: externalItemsPerPage,
    onPageChange,
    onLimitChange,
    onSortChange,
    onRowClick,
    onSearchChange,
    searchTerm: externalSearchTerm,
    sortConfig: externalSortConfig,
    selectable = true,
    onSelectionChange,
    bulkActions = [],
    onAdd,
    canAdd = true
}) => {
    const [internalSortConfig, setInternalSortConfig] = useState({ key: null, direction: 'asc' });
    const [internalCurrentPage, setInternalCurrentPage] = useState(1);
    const [internalItemsPerPage, setInternalItemsPerPage] = useState(50);
    const [internalSearchTerm, setInternalSearchTerm] = useState('');
    const [displaySearch, setDisplaySearch] = useState(''); // Immediate input value
    const [selectedRows, setSelectedRows] = useState([]);
    const [visibleColumns, setVisibleColumns] = useState(columns.map(c => c.key));
    const [showColumnToggle, setShowColumnToggle] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null);
    const columnToggleRef = useRef(null);

    const isServerSide = externalCurrentPage || onPageChange;
    const sortConfig = externalSortConfig || internalSortConfig;
    const currentPage = externalCurrentPage || internalCurrentPage;
    const itemsPerPage = externalItemsPerPage || internalItemsPerPage;
    const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
    const totalItems = externalTotalItems !== undefined ? externalTotalItems : data.length;

    useEffect(() => {
        setVisibleColumns(columns.map(c => c.key));
    }, [columns.length]);
    
    // Close column toggle on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (columnToggleRef.current && !columnToggleRef.current.contains(event.target)) {
                setShowColumnToggle(false);
            }
        };
        if (showColumnToggle) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColumnToggle]);

    // Synchronize local display search with external search term
    useEffect(() => {
        if (externalSearchTerm !== undefined) setDisplaySearch(externalSearchTerm);
    }, [externalSearchTerm]);

    // Handle debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (displaySearch !== searchTerm) {
                if (onSearchChange) {
                    onSearchChange(displaySearch);
                } else {
                    setInternalSearchTerm(displaySearch);
                    setInternalCurrentPage(1);
                }
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [displaySearch, onSearchChange, searchTerm]);

    const handleSearch = (val) => {
        setDisplaySearch(val);
    };

    const searchFilteredData = useMemo(() => {
        const activeSearch = displaySearch || searchTerm;
        if (!activeSearch) return data;
        
        const term = activeSearch.toLowerCase();
        return data.filter(item => {
            // Rule 8 & User Request: Search across ALL fields in the object, not just visible ones
            return Object.values(item).some(val => {
                if (val === null || val === undefined) return false;
                if (typeof val === 'object') {
                    // Also search nested objects (like profile names)
                    return Object.values(val).some(nestedVal => 
                        String(nestedVal).toLowerCase().includes(term)
                    );
                }
                return String(val).toLowerCase().includes(term);
            });
        });
    }, [data, displaySearch, searchTerm]);

    const handleSort = (key) => {
        if (!key) return;
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }

        if (onSortChange) {
            onSortChange({ key, direction });
        } else {
            setInternalSortConfig({ key, direction });
        }
    };

    const sortedData = useMemo(() => {
        if (onSortChange || !sortConfig.key) return searchFilteredData;
        return [...searchFilteredData].sort((a, b) => {
            const key = sortConfig.key;
            const getVal = (obj, path) => path.split('.').reduce((o, i) => (o ? o[i] : ''), obj);
            let aVal = getVal(a, key);
            let bVal = getVal(b, key);
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [searchFilteredData, sortConfig, onSortChange]);

    const paginatedData = useMemo(() => {
        if (onPageChange) return sortedData;
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage, onPageChange]);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(paginatedData.map((_, i) => (currentPage - 1) * itemsPerPage + i));
            if (onSelectionChange) onSelectionChange(paginatedData);
        } else {
            setSelectedRows([]);
            if (onSelectionChange) onSelectionChange([]);
        }
    };

    const handleSelectRow = (index) => {
        const newSelection = selectedRows.includes(index)
            ? selectedRows.filter(i => i !== index)
            : [...selectedRows, index];
        setSelectedRows(newSelection);
        if (onSelectionChange) {
            const selectedData = newSelection.map(i => sortedData[i]);
            onSelectionChange(selectedData);
        }
    };

    const handleCopy = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.success('Value copied to clipboard');
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleExportCSV = () => {
        if (!data.length) return;
        const exportData = sortedData.map((item, index) => {
            const row = { 'S.No': (currentPage - 1) * itemsPerPage + index + 1 };
            columns.forEach(col => {
                if (!visibleColumns.includes(col.key) || col.key === 'actions') return;
                const getVal = (obj, path) => path ? path.split('.').reduce((o, i) => (o ? o[i] : ''), obj) : '';
                const val = getVal(item, col.key);
                row[col.label] = col.exportValue ? col.exportValue(val, item) : (val || '');
            });
            return row;
        });
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleExportPDF = () => window.print();

    if (loading && data.length === 0) {
        return (
            <div className="table-skeleton-container" style={{ padding: '20px' }}>
                <div className="skeleton-header" style={{ height: '40px', background: 'var(--border)', borderRadius: '8px', marginBottom: '12px' }}></div>
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="skeleton-row" style={{ height: '44px', background: 'var(--bg-card)', borderRadius: '8px', marginBottom: '8px', opacity: 1 - i * 0.15 }}></div>
                ))}
            </div>
        );
    }

    const filteredColumns = columns.filter(col => visibleColumns.includes(col.key));

    const getAlignment = (col) => {
        if (col.align) return col.align;
        if (col.type === 'number' || col.type === 'currency' || col.type === 'percentage') return 'right';
        if (col.type === 'date' || col.type === 'datetime' || col.type === 'status' || col.type === 'boolean' || col.key === 'actions') return 'center';
        return 'left';
    };

    return (
        <div className="data-table-container" style={{ opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s', position: 'relative' }}>
            {loading && data.length > 0 && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--accent)', zIndex: 1000, overflow: 'hidden' }}>
                    <div className="loading-bar-anim" style={{ height: '100%', background: 'white', width: '30%' }}></div>
                </div>
            )}
            {/* Rule 24: Table Toolbar */}
            <div className="table-toolbar">
                <div className="table-toolbar-left">
                    {selectedRows.length > 0 ? (
                        <div className="bulk-actions-bar" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--accent)', color: 'white', padding: '6px 16px', borderRadius: '8px' }}>
                            <span>{selectedRows.length} selected</span>
                            {bulkActions.map((action, idx) => (
                                <button key={idx} className="btn btn-sm btn-ghost" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => action.handler(selectedRows.map(i => sortedData[i]))}>
                                    {action.icon} {action.label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="search-input-wrap">
                            <Search size={16} />
                            <input 
                                type="text" 
                                placeholder="Search records..." 
                                className="form-input" 
                                value={displaySearch || ''}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            {searchTerm && (
                                <X 
                                    size={14} 
                                    className="search-clear" 
                                    onClick={() => handleSearch('')}
                                />
                            )}
                        </div>
                    )}
                </div>

                <div className="table-toolbar-right" style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>
                        <Download size={14} /> CSV
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={handleExportPDF}>
                        <FileText size={14} /> PDF
                    </button>
                    <div style={{ position: 'relative' }} ref={columnToggleRef}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowColumnToggle(!showColumnToggle)}>
                            <Settings size={14} /> Columns
                        </button>
                        {showColumnToggle && (
                            <div className="column-toggle-dropdown" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 100, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', minWidth: '180px', marginTop: '4px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Visible Columns</span>
                                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setShowColumnToggle(false)} />
                                </div>
                                {columns.map(col => (
                                    <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '13px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns.includes(col.key)}
                                            onChange={() => {
                                                const next = visibleColumns.includes(col.key)
                                                    ? visibleColumns.filter(k => k !== col.key)
                                                    : [...visibleColumns, col.key];
                                                setVisibleColumns(next);
                                            }}
                                        />
                                        {col.label}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="table-responsive-wrapper" style={{ overflowX: 'auto', width: '100%', position: 'relative' }}>
                <table className="standard-data-table">
                    <thead>
                        <tr>
                            {selectable && (
                                <th style={{ width: '40px', textAlign: 'center' }}>
                                    <input type="checkbox" onChange={handleSelectAll} checked={selectedRows.length === paginatedData.length && paginatedData.length > 0} />
                                </th>
                            )}
                            {/* Rule 1 & 2: S.No Column */}
                            <th className="sticky-col sticky-left" style={{ width: '70px', textAlign: 'left' }}>S.No</th>
                            {filteredColumns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={col.key === 'actions' ? 'sticky-col sticky-right' : ''}
                                    style={{
                                        textAlign: getAlignment(col),
                                        width: col.width || 'auto',
                                        cursor: col.sortable !== false ? 'pointer' : 'default',
                                    }}
                                    onClick={() => col.sortable !== false && handleSort(col.sortKey || col.key)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: getAlignment(col) === 'right' ? 'flex-end' : getAlignment(col) === 'center' ? 'center' : 'flex-start', gap: '4px' }}>
                                        {col.label}
                                        {col.sortable !== false && (
                                            <span style={{ opacity: sortConfig.key === (col.sortKey || col.key) ? 1 : 0.2 }}>
                                                {sortConfig.key === (col.sortKey || col.key) && sortConfig.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((item, index) => {
                                const realIndex = (currentPage - 1) * itemsPerPage + index;
                                const isSelected = selectedRows.includes(realIndex);
                                return (
                                    <tr key={realIndex} className={isSelected ? 'selected' : ''} onClick={() => onRowClick && onRowClick(item, realIndex)}>
                                        {selectable && (
                                            <td style={{ textAlign: 'center' }}>
                                                <input type="checkbox" checked={isSelected} onChange={() => handleSelectRow(realIndex)} onClick={e => e.stopPropagation()} />
                                            </td>
                                        )}
                                        <td className="sticky-col sticky-left" style={{ color: 'var(--text-dim)' }}>{realIndex + 1}</td>
                                        {filteredColumns.map((col, idx) => {
                                            const getVal = (obj, path) => path ? path.split('.').reduce((o, i) => (o ? o[i] : ''), obj) : '';
                                            const val = getVal(item, col.key);
                                            return (
                                                <td key={idx}
                                                    className={col.key === 'actions' ? 'sticky-col sticky-right' : ''}
                                                    style={{ textAlign: getAlignment(col), width: col.width || 'auto' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: getAlignment(col) === 'right' ? 'flex-end' : getAlignment(col) === 'center' ? 'center' : 'flex-start', gap: '8px' }}>
                                                        <div className="cell-content" title={val != null && val !== false ? String(val) : undefined}>
                                                            {col.render ? col.render(val, item, realIndex) : (val || '--')}
                                                        </div>
                                                        {col.copyable && val && (
                                                            <button className="btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); handleCopy(val, `${realIndex}-${col.key}`); }}>
                                                                {copiedKey === `${realIndex}-${col.key}` ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={columns.length + 3} style={{ textAlign: 'center', padding: '60px' }}>
                                    <div style={{ color: 'var(--text-dim)', fontSize: '15px' }}>{emptyMessage}</div>
                                    {onAdd && canAdd && (
                                        <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={onAdd}>
                                            + Add New Record
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Rule 3 & 24: Pagination Footer */}
            <div className="table-footer">
                <div className="footer-info">
                    Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems.toLocaleString()} records
                    <select className="form-select limit-select" value={itemsPerPage} onChange={(e) => onLimitChange ? onLimitChange(Number(e.target.value)) : setInternalItemsPerPage(Number(e.target.value))}>
                        {[50, 100, 200, 500].map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                </div>

                <div className="pagination-controls">
                    <button className="btn btn-ghost btn-sm" disabled={currentPage === 1} onClick={() => onPageChange ? onPageChange(currentPage - 1) : setInternalCurrentPage(prev => prev - 1)}>
                        <ChevronLeft size={16} /> Previous
                    </button>
                    <div className="page-indicator">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const p = i + 1;
                            return (
                                <button key={p} className={`page-number ${currentPage === p ? 'active' : ''}`} onClick={() => onPageChange ? onPageChange(p) : setInternalCurrentPage(p)}>
                                    {p}
                                </button>
                            );
                        })}
                        {totalPages > 5 && <span>...</span>}
                    </div>
                    <button className="btn btn-ghost btn-sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => onPageChange ? onPageChange(currentPage + 1) : setInternalCurrentPage(prev => prev + 1)}>
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <style>{`
                .data-table-container { background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border); overflow: hidden; width: 100%; }
                .table-toolbar { padding: 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); }
                .search-input-wrap { position: relative; display: flex; align-items: center; }
                .search-input-wrap input { padding-right: 32px; }
                .search-clear { position: absolute; right: 8px; cursor: pointer; color: var(--text-dim); }
                .search-clear:hover { color: var(--text); }
                .standard-data-table { width: 100%; border-collapse: collapse; font-size: 14px; table-layout: auto; }
                .standard-data-table th { background: rgba(255,255,255,0.03); color: var(--text-dim); font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; padding: 12px; border-bottom: 2px solid var(--border); position: relative; }
                .standard-data-table td { padding: 12px; border-bottom: 1px solid var(--border); transition: background 0.2s; }
                .standard-data-table tr:hover { background: #f9fafb !important; }
                .standard-data-table tr.selected { background: rgba(124, 58, 237, 0.05) !important; }
                
                .sticky-col { position: sticky; z-index: 10; background: var(--bg-card); }
                .sticky-left { left: 0; box-shadow: 2px 0 5px rgba(0,0,0,0.05); border-right: 1px solid var(--border); }
                .sticky-right { right: 0; box-shadow: -2px 0 5px rgba(0,0,0,0.05); border-left: 1px solid var(--border); }
                th.sticky-col { background: var(--bg-app) !important; z-index: 12 !important; }
                [data-theme='dark'] th.sticky-col { background: #1a1a2e !important; }
                [data-theme='light'] th.sticky-col { background: #f8fafc !important; }
                
                .cell-content { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .table-footer { padding: 16px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); }
                .footer-info { display: flex; align-items: center; gap: 12px; font-size: 13px; color: var(--text-muted); }
                .limit-select { width: auto !important; padding: 2px 8px !important; height: 32px !important; }
                .pagination-controls { display: flex; gap: 8px; align-items: center; }
                .page-indicator { display: flex; gap: 4px; align-items: center; }
                .page-number { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text-muted); cursor: pointer; }
                .page-number.active { background: var(--accent); color: white; border-color: var(--accent); }
                
                .loading-bar-anim { animation: loading-bar 1.5s infinite linear; }
                @keyframes loading-bar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(333%); }
                }

                @media print {
                    .table-toolbar, .table-footer, .sidebar, .header, .btn, .btn-icon { display: none !important; }
                    .sticky-col { position: static !important; box-shadow: none !important; }
                    .data-table-container { border: none !important; }
                }
            `}</style>
        </div>
    );
};

export default DataTable;
