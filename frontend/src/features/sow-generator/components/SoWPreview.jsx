import React, { useState } from 'react';
import { 
  FileText, ListTodo, Download, CheckCircle, 
  ChevronLeft, FileType, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as sowService from '../services/sowService';

const SoWPreview = ({ project, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('sow');
  const [loading, setLoading] = useState(false);
  const [localProject, setLocalProject] = useState(project);

  const handleFinalize = async () => {
    setLoading(true);
    try {
      const res = await sowService.finalizeSoW(localProject.id);
      setLocalProject(res.data);
      toast.success('Project documents finalized and uploaded!');
      if (onUpdate) onUpdate(res.data);
    } catch (err) {
      toast.error('Failed to finalize documentation');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'sow', label: 'SoW Document', icon: FileText },
    { id: 'dev', label: 'Development Tasks', icon: ListTodo },
    { id: 'qa', label: 'QA & Deployment', icon: CheckCircle },
    { id: 'files', label: 'Exports & Downloads', icon: Download },
  ];

  const renderSowSection = () => (
    <div className="sow-preview-content glass-card animate-fade-in" style={{ padding: '30px', maxHeight: '70vh', overflowY: 'auto' }}>
      <h2 style={{ color: 'var(--accent-light)', marginBottom: '20px' }}>{localProject.sow_data.project_overview.project_summary_table.find(r => r.key === 'Project Name')?.value}</h2>
      
      <section className="sow-mb-8">
         <h3 className="sow-section-title">Project Objective</h3>
         <p className="sow-text-p">{localProject.sow_data.project_overview.project_objective}</p>
      </section>

      <section className="sow-mb-8">
         <h3 className="sow-section-title">In-Scope Deliverables</h3>
         {localProject.sow_data.scope.in_scope.map((s, i) => (
           <div key={i} style={{ marginBottom: '15px' }}>
              <strong style={{ display: 'block', marginBottom: '5px', color: 'var(--text)' }}>{s.section}</strong>
              <ul className="sow-pl-5 sow-list-disc">
                 {s.items.map((item, j) => <li key={j} className="sow-text-li">{item}</li>)}
              </ul>
           </div>
         ))}
      </section>

      <section className="sow-mb-8">
         <h3 className="sow-section-title">Technology Stack</h3>
         <div className="sow-table-wrapper">
            <table className="sow-standard-table">
               <thead>
                  <tr><th>Layer</th><th>Tech</th><th>Purpose</th></tr>
               </thead>
               <tbody>
                  {localProject.sow_data.tech_stack.table.map((row, i) => (
                    <tr key={i}><td>{row.layer}</td><td>{row.technology}</td><td>{row.purpose}</td></tr>
                  ))}
               </tbody>
            </table>
         </div>
      </section>
    </div>
  );

  const renderTasks = (tasks) => (
    <div className="animate-fade-in">
       <div className="sow-table-wrapper">
          <table className="sow-standard-table">
             <thead>
                <tr>
                   <th>Task Name</th>
                   <th>Module</th>
                   <th>Hours</th>
                   <th>Priority</th>
                </tr>
             </thead>
             <tbody>
                {tasks.map((task, i) => (
                  <tr key={i}>
                     <td>
                        <div style={{ fontWeight: 600 }}>{task.task_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{task.description}</div>
                     </td>
                     <td>{task.module}</td>
                     <td>{task.estimated_hours}</td>
                     <td><span className={`badge ${task.priority === 'High' ? 'badge-red' : 'badge-blue'}`}>{task.priority}</span></td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  return (
    <div className="sow-preview-container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
         <button className="btn btn-ghost" onClick={onBack}>
            <ChevronLeft size={18} /> Back to Projects
         </button>
         <div style={{ display: 'flex', gap: '10px' }}>
            {localProject.status === 'draft' && (
              <button className="btn btn-primary" onClick={handleFinalize} disabled={loading}>
                 {loading ? <span className="spinner" /> : <Send size={18} style={{ marginRight: 8 }} />}
                 Finalize & Upload
              </button>
            )}
            {localProject.status === 'finalized' && (
              <div className="badge badge-green" style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                 <CheckCircle size={16} /> Finalized
              </div>
            )}
         </div>
      </div>

      {/* Tabs */}
      <div className="sow-tabs-container" style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {tabs.map(tab => (
          <button key={tab.id} 
            className={`sow-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
             <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="sow-preview-body">
         {activeTab === 'sow' && renderSowSection()}
         {activeTab === 'dev' && renderTasks(localProject.dev_tasks)}
         {activeTab === 'qa' && (
            <div className="sow-space-y-8">
               <h3 className="sow-section-title">QA Verification Tasks</h3>
               {renderTasks(localProject.qa_tasks)}
               <h3 className="sow-section-title">Deployment Steps</h3>
               {renderTasks(localProject.deployment_tasks)}
            </div>
         )}
         {activeTab === 'files' && (
            <div className="sow-grid sow-grid-cols-2 sow-gap-6">
               <div className="glass-card sow-flex sow-items-center sow-justify-between sow-p-6">
                  <div className="sow-flex sow-items-center sow-gap-4">
                     <div className="bg-red-500/20 sow-p-3 sow-rounded-lg"><FileType className="text-red-500" /></div>
                     <div>
                        <h4 className="sow-font-bold">Project SoW (PDF)</h4>
                        <p className="sow-text-xs sow-text-dim">Branded document with signature block</p>
                     </div>
                  </div>
                  {localProject.pdf_url ? (
                    <a href={localProject.pdf_url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Download</a>
                  ) : <span className="sow-text-xs sow-text-muted sow-italic">Pending Finalization</span>}
               </div>
               
               <div className="glass-card sow-flex sow-items-center sow-justify-between sow-p-6">
                  <div className="sow-flex sow-items-center sow-gap-4">
                     <div className="bg-blue-500/20 sow-p-3 sow-rounded-lg"><FileType className="text-blue-500" /></div>
                     <div>
                        <h4 className="sow-font-bold">Project SoW (Word)</h4>
                        <p className="sow-text-xs sow-text-dim">Editable document for manual revisions</p>
                     </div>
                  </div>
                  {localProject.docx_url ? (
                    <a href={localProject.docx_url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Download</a>
                  ) : <span className="sow-text-xs sow-text-muted sow-italic">Pending Finalization</span>}
               </div>

               <div className="glass-card sow-flex sow-items-center sow-justify-between sow-p-6">
                  <div className="sow-flex sow-items-center sow-gap-4">
                     <div className="bg-green-500/20 sow-p-3 sow-rounded-lg"><ListTodo className="text-green-500" /></div>
                     <div>
                        <h4 className="sow-font-bold">Task Lists (CSV)</h4>
                        <p className="sow-text-xs sow-text-dim">Importable file for Jira/ClickUp/Monday</p>
                     </div>
                  </div>
                  {localProject.dev_csv_url ? (
                    <a href={localProject.dev_csv_url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Download Zip</a>
                  ) : <span className="sow-text-xs sow-text-muted sow-italic">Pending Finalization</span>}
               </div>
            </div>
         )}
      </div>

      <style>{`
        .sow-preview-container .sow-tab-btn { background: none; border: none; padding: 12px 24px; border-bottom: 2px solid transparent; color: var(--text-dim); font-weight: 700; cursor: pointer; display: flex; gap: 10px; align-items: center; transition: all 0.2s; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
        .sow-preview-container .sow-tab-btn:hover { color: var(--text); background: rgba(255,255,255,0.03); }
        .sow-preview-container .sow-tab-btn.active { color: var(--accent-light); border-bottom-color: var(--accent); background: rgba(124, 58, 237, 0.1); }
        
        .sow-section-title { font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 16px; margin-top: 32px; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 10px; }
        .sow-section-title::before { content: ''; width: 4px; height: 16px; background: var(--accent); border-radius: 2px; }

        .sow-text-p { color: var(--text-muted); margin-bottom: 16px; font-size: 14px; line-height: 1.7; }
        .sow-text-li { color: var(--text-muted); margin-bottom: 8px; font-size: 14px; }

        .sow-mb-8 { margin-bottom: 2rem; }
        .sow-pl-5 { padding-left: 1.25rem; }
        .sow-list-disc { list-style-type: disc; }
        .sow-grid { display: grid; }
        .sow-grid-cols-2 { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        .sow-gap-6 { gap: 1.5rem; }
        .sow-flex { display: flex; }
        .sow-items-center { align-items: center; }
        .sow-justify-between { justify-content: space-between; }
        .sow-p-6 { padding: 1.5rem; }
        .sow-p-3 { padding: 0.75rem; }
        .sow-rounded-lg { border-radius: 0.5rem; }
        .sow-font-bold { font-weight: 700; }
        .sow-text-xs { font-size: 0.75rem; }
        .sow-text-dim { color: var(--text-dim); }
        .sow-text-muted { color: #888; }
        .sow-italic { font-style: italic; }
        .sow-space-y-8 > * + * { margin-top: 2rem; }
        .sow-gap-4 { gap: 1rem; }

        .sow-standard-table { width: 100%; border-collapse: collapse; }
        .sow-standard-table th { text-align: left; padding: 12px; background: rgba(255,255,255,0.05); font-size: 11px; text-transform: uppercase; color: var(--text-dim); }
        .sow-standard-table td { padding: 12px; border-bottom: 1px solid var(--border); font-size: 13px; color: var(--text-muted); }
      `}</style>
    </div>
  );
};

export default SoWPreview;
