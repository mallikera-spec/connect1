import React, { useState, useMemo } from 'react';
import { Download, FileText, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Papa from 'papaparse';

/**
 * DataTable Component
 * @param {Object} props
 * @param {Array} props.data - The array of objects to display
 * @param {Array} props.columns - Column configuration: [{ label: 'Name', key: 'full_name', sortKey: 'full_name' }]
 * @param {Function} props.renderRow - Custom row renderer (optional)
 * @param {String} props.fileName - Base name for exported files
 * @param {Boolean} props.loading - Loading state
 */
const DataTable = ({
    data = [],
    columns = [],
    renderRow,
    fileName = 'data-export',
    loading = false,
    emptyMessage = 'No data found',
    // Server-side props
    totalItems: externalTotalItems,
    currentPage: externalCurrentPage,
    itemsPerPage: externalItemsPerPage,
    onPageChange,
    onLimitChange,
    onSortChange,
    onRowClick,
    sortConfig: externalSortConfig
}) => {
    const [internalSortConfig, setInternalSortConfig] = useState({ key: null, direction: 'asc' });
    const [internalCurrentPage, setInternalCurrentPage] = useState(1);
    const [internalItemsPerPage, setInternalItemsPerPage] = useState(50);

    const isServerSide = externalCurrentPage || onPageChange; // Basic check

    const sortConfig = externalSortConfig || internalSortConfig;
    const currentPage = externalCurrentPage || internalCurrentPage;
    const itemsPerPage = externalItemsPerPage || internalItemsPerPage;
    const totalItems = externalTotalItems !== undefined ? externalTotalItems : data.length;

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
        if (onSortChange || !sortConfig.key) return data;

        return [...data].sort((a, b) => {
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
    }, [data, sortConfig, onSortChange]);

    const paginatedData = useMemo(() => {
        if (onPageChange) return sortedData; // Data is already paginated by server
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage, onPageChange]);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handleExportCSV = () => {
        if (!data.length) return;

        // If it's server side, we might only have one page. 
        // But the user rule says "download csv and pdf facility should be there".
        // For now, we export what we have in 'data'.
        const csvData = sortedData.map((item, index) => {
            const row = { 'S.No': (currentPage - 1) * itemsPerPage + index + 1 };
            columns.forEach(col => {
                if (col.key === 'checkbox' || col.key === 'actions') return;

                const getVal = (obj, path) => path ? path.split('.').reduce((o, i) => (o ? o[i] : ''), obj) : '';
                const val = getVal(item, col.key);

                let exportVal = val;
                if (col.exportValue) {
                    exportVal = col.exportValue(val, item, index);
                } else if (col.render) {
                    const rendered = col.render(val, item, index);
                    if (typeof rendered === 'string' || typeof rendered === 'number') {
                        exportVal = rendered;
                    }
                }

                row[col.label] = exportVal || '';
            });
            return row;
        });

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleExportPDF = () => {
        window.print();
    };

    if (loading) {
        return <div className="page-loader"><div className="spinner" /></div>;
    }

    return (
        <div className="data-table-container">
            <div className="table-actions-top" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '12px' }}>
                <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>
                    <Download size={14} style={{ marginRight: '4px' }} /> Download CSV
                </button>
                <button className="btn btn-outline btn-sm" onClick={handleExportPDF}>
                    <FileText size={14} style={{ marginRight: '4px' }} /> Download PDF
                </button>
            </div>

            <div className="table-responsive-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
                <table className="standard-data-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '40px', textAlign: 'left', padding: '10px 12px', fontSize: '12px' }}>S.No</th>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    style={{
                                        textAlign: 'left',
                                        padding: '10px 12px',
                                        fontSize: '12px',
                                        width: col.width || 'auto',
                                        whiteSpace: col.wrap ? 'normal' : 'nowrap',
                                        cursor: (col.sortable || col.key) ? 'pointer' : 'default',
                                        userSelect: 'none'
                                    }}
                                    onClick={() => (col.sortable || col.key) && handleSort(col.sortKey || col.key)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {col.label}
                                        {(col.sortable || col.key) && (
                                            <span style={{ display: 'inline-flex', flexDirection: 'column', opacity: sortConfig.key === (col.sortKey || col.key) ? 1 : 0.3 }}>
                                                <ChevronUp size={10} style={{ marginBottom: '-4px', color: (sortConfig.key === (col.sortKey || col.key) && sortConfig.direction === 'asc') ? 'var(--accent)' : 'inherit' }} />
                                                <ChevronDown size={10} style={{ color: (sortConfig.key === (col.sortKey || col.key) && sortConfig.direction === 'desc') ? 'var(--accent)' : 'inherit' }} />
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
                                return renderRow ? renderRow(item, realIndex) : (
                                    <tr
                                        key={realIndex}
                                        onClick={() => onRowClick && onRowClick(item, realIndex)}
                                        style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                                    >
                                        <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-dim)', width: '40px' }}>{realIndex + 1}</td>
                                        {columns.map((col, idx) => {
                                            const getVal = (obj, path) => path ? path.split('.').reduce((o, i) => (o ? o[i] : ''), obj) : '';
                                            const val = getVal(item, col.key);
                                            return (
                                                <td
                                                    key={idx}
                                                    style={{
                                                        padding: '10px 12px',
                                                        whiteSpace: col.wrap ? 'normal' : 'nowrap',
                                                        fontSize: '12px',
                                                        width: col.width || 'auto'
                                                    }}
                                                >
                                                    {col.render ? col.render(val, item, realIndex) : (val || '--')}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '40px' }}>
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="table-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <span>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries</span>
                    <select
                        className="form-select"
                        style={{ width: 'auto', padding: '2px 8px', height: 'auto', fontSize: '12px' }}
                        value={itemsPerPage}
                        onChange={(e) => {
                            const newLimit = Number(e.target.value);
                            if (onLimitChange) {
                                onLimitChange(newLimit);
                            } else {
                                setItemsPerPage(newLimit);
                                setInternalCurrentPage(1);
                            }
                        }}
                    >
                        {[50, 100, 200, 500].map(size => (
                            <option key={size} value={size}>{size} per page</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        className="btn btn-ghost btn-sm"
                        disabled={currentPage === 1}
                        onClick={() => {
                            if (onPageChange) onPageChange(currentPage - 1);
                            else setInternalCurrentPage(prev => prev - 1);
                        }}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '13px' }}>
                        Page {currentPage} of {totalPages || 1}
                    </div>
                    <button
                        className="btn btn-ghost btn-sm"
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => {
                            if (onPageChange) onPageChange(currentPage + 1);
                            else setInternalCurrentPage(prev => prev + 1);
                        }}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <style>{`
                .standard-data-table thead tr {
                    background-color: var(--bg-hover, #f8fafc);
                    border-bottom: 2px solid var(--border, #e2e8f0);
                }
                .standard-data-table tbody tr {
                    border-bottom: 1px solid var(--border, #f1f5f9);
                    transition: background-color 0.2s ease;
                }
                .standard-data-table tbody tr:hover {
                    background-color: var(--bg-app, #f8fafc);
                }
                .standard-data-table th {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 700;
                    color: var(--text-muted, #64748b);
                }
                .standard-data-table td {
                    font-size: 0.875rem;
                    color: var(--text-primary, #1e293b);
                }
                
                @media print {
                    .table-actions-top, .table-footer, .sidebar, .header, .btn, .no-print {
                        display: none !important;
                    }
                    .data-table-container {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .standard-data-table {
                        width: 100% !important;
                        table-layout: auto !important;
                    }
                    body {
                        background: white !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default DataTable;
