import React, { useState, useEffect } from 'react';
import { Plus, Table, Wand2, FileText, Trash2, Download, ExternalLink, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import SoWForm from './components/SoWForm';
import SoWPreview from './components/SoWPreview';
import * as sowService from './services/sowService';
import DataTable from '../../components/common/DataTable';
import { formatDate } from '../../utils/formatters';

const SoWGenerator = () => {
  const [view, setView] = useState('list'); // 'list' | 'wizard' | 'preview'
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await sowService.listProjects();
      setProjects(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch projects');
    }
  };

  const handleGenerate = async (formData) => {
    setLoading(true);
    try {
      const res = await sowService.generateSoW(formData);
      toast.success('AI Documentation generated successfully!');
      setCurrentProject(res.data);
      setView('preview');
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to generate documentation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await sowService.deleteProject(id);
      toast.success('Project deleted');
      fetchProjects();
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  const columns = [
    {
      label: 'Project Name',
      key: 'project_name',
      render: (val, item) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong style={{ color: 'var(--accent-light)' }}>{val}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{item.client_name}</span>
        </div>
      )
    },
    {
      label: 'Status',
      key: 'status',
      type: 'status',
      render: (val) => {
        const map = { finalized: 'badge badge-green', draft: 'badge badge-yellow' };
        return <span className={map[val] || 'badge'}>{val?.toUpperCase()}</span>;
      }
    },
    {
      label: 'Generated At',
      key: 'created_at',
      render: (val) => <span style={{ fontSize: '12px' }}>{formatDate(val)}</span>
    },
    {
       label: 'Actions',
       key: 'actions',
       width: '180px',
       render: (_, item) => (
         <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-icon btn-sm" title="View/Edit" onClick={() => { setCurrentProject(item); setView('preview'); }}>
              <ExternalLink size={14} />
            </button>
            {item.pdf_url && (
              <a href={item.pdf_url} target="_blank" rel="noreferrer" className="btn btn-icon btn-sm" title="Download PDF">
                <Download size={14} />
              </a>
            )}
            <button className="btn btn-icon btn-sm text-danger" title="Delete" onClick={() => handleDelete(item.id)}>
              <Trash2 size={14} />
            </button>
         </div>
       )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>AI SoW & Task Generator</h1>
          <p>Instantly generate professional project documentation and task lists using Claude AI.</p>
        </div>
        <div className="header-actions">
          {view === 'list' ? (
            <button className="btn btn-primary" onClick={() => setView('wizard')}>
              <Plus size={18} /> New Project
            </button>
          ) : (
            <button className="btn btn-ghost" onClick={() => { setView('list'); setCurrentProject(null); }}>
              <Table size={18} /> View All Projects
            </button>
          )}
        </div>
      </div>

      {view === 'list' && (
        <div className="polished-card" style={{ padding: 0 }}>
          <DataTable 
            data={projects} 
            columns={columns} 
            fileName="sow_projects" 
            onRowClick={(item) => { setCurrentProject(item); setView('preview'); }}
          />
        </div>
      )}

      {view === 'wizard' && (
        <div className="animate-fade-in">
          <SoWForm onSubmit={handleGenerate} loading={loading} />
        </div>
      )}

      {view === 'preview' && (
        <SoWPreview 
          project={currentProject} 
          onBack={() => setView('list')} 
          onUpdate={(updated) => {
            setCurrentProject(updated);
            fetchProjects();
          }}
        />
      )}

      <style>{`
        .header-actions { display: flex; gap: 12px; }
        .text-danger { color: var(--danger) !important; }
      `}</style>
    </div>
  );
};

export default SoWGenerator;
