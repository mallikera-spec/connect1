import React, { useState, useEffect, useMemo } from 'react';
import { 
    Plus, Search, Download, Edit, Trash2, 
    Layers, Palette, X, Save, AlertTriangle
} from 'lucide-react';
import { financeService } from './financeService';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';

export default function CategoryManager() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        color: '#6366f1',
        icon: 'Layers'
    });

    const colorPresets = [
        '#6366f1', '#10b981', '#ef4444', '#f59e0b', 
        '#ec4899', '#8b5cf6', '#06b6d4', '#f97316',
        '#14b8a6', '#475569'
    ];

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data, success } = await financeService.getCategories();
            if (success) setCategories(data);
        } catch (err) {
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                color: category.color,
                icon: category.icon || 'Layers'
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                color: '#6366f1',
                icon: 'Layers'
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let result;
            if (editingCategory) {
                result = await financeService.updateCategory(editingCategory.id, formData);
            } else {
                result = await financeService.createCategory(formData);
            }

            if (result.success) {
                toast.success(editingCategory ? 'Category updated' : 'Category created');
                setShowModal(false);
                fetchCategories();
            }
        } catch (err) {
            toast.error(err.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This may affect expenses linked to this category.')) return;
        try {
            const { success } = await financeService.deleteCategory(id);
            if (success) {
                toast.success('Category deleted');
                fetchCategories();
            }
        } catch (err) {
            toast.error('Failed to delete category');
        }
    };

    const columns = useMemo(() => [
        { 
            key: 'name', 
            label: 'Category Name',
            render: (val, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '8px', 
                        background: `${row.color}20`,
                        color: row.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Layers size={18} />
                    </div>
                    <span style={{ fontWeight: 600 }}>{val}</span>
                </div>
            )
        },
        { 
            key: 'color', 
            label: 'Color Code',
            render: (val) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: val }} />
                    <code style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{val.toUpperCase()}</code>
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            type: 'actions',
            render: (_, row) => (
                <div className="action-btns">
                    <button onClick={() => handleOpenModal(row)} title="Edit">
                        <Edit size={16} />
                    </button>
                    {!row.is_default && (
                        <button onClick={() => handleDelete(row.id)} title="Delete" className="text-red">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            )
        }
    ], []);

    return (
        <div className="category-manager">
            <header className="page-header">
                <div>
                    <h1>Expense Categories</h1>
                    <p>Manage classification tags for business expenditure</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Add Category
                </button>
            </header>

            <DataTable
                data={categories}
                columns={columns}
                loading={loading}
                fileName="expense_categories"
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
            />

            {showModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal modal-sm" style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">{editingCategory ? 'Edit Category' : 'Create New Category'}</h2>
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                                    Define tax or business tags for grouping expenses.
                                </p>
                            </div>
                            <button className="btn-icon" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Category Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control"
                                        required
                                        placeholder="e.g. Marketing, Server Costs"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>

                                <div className="form-group" style={{ marginTop: '20px' }}>
                                    <label className="form-label">Theme Color</label>
                                    <div className="color-picker-grid">
                                        {colorPresets.map(c => (
                                            <button 
                                                key={c}
                                                type="button"
                                                className={`color-preset ${formData.color === c ? 'active' : ''}`}
                                                style={{ background: c }}
                                                onClick={() => setFormData({...formData, color: c})}
                                            />
                                        ))}
                                        <div style={{ position: 'relative', width: '36px', height: '36px' }}>
                                            <Plus size={16} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', color: 'var(--text-dim)' }} />
                                            <input 
                                                type="color" 
                                                value={formData.color}
                                                onChange={(e) => setFormData({...formData, color: e.target.value})}
                                                className="custom-color-input"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="info-box">
                                    <Palette size={16} />
                                    <span>Choose a distinct color to help identify this category in charts.</span>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Save size={18} /> {editingCategory ? 'Update Changes' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .category-manager { padding: 24px; animation: fadeIn 0.4s ease-out; }
                .color-picker-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-top: 8px; }
                .color-preset { width: 36px; height: 36px; border-radius: 10px; border: 2px solid transparent; cursor: pointer; transition: all 0.2s; }
                .color-preset:hover { transform: scale(1.1); }
                .color-preset.active { border-color: white; box-shadow: 0 0 0 2px var(--accent); }
                .custom-color-input { width: 36px; height: 36px; padding: 0; border: none; background: rgba(255,255,255,0.05); border-radius: 10px; cursor: pointer; }
                
                .info-box { display: flex; gap: 10px; align-items: center; background: rgba(99, 102, 241, 0.1); color: #6366f1; padding: 12px; border-radius: 12px; font-size: 13px; margin-top: 20px; border: 1px solid rgba(99, 102, 241, 0.2); }
                .action-btns { display: flex; gap: 8px; }
                .action-btns button { 
                    background: var(--bg-card); border: 1px solid var(--border); color: var(--text-muted);
                    padding: 6px; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s;
                }
                .action-btns button:hover { border-color: var(--accent); color: var(--accent-light); }
                .action-btns button.text-red:hover { border-color: var(--danger); color: var(--danger); }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
