import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Video, Repeat, Clock, AlertCircle, CheckCircle2, ListTodo, Timer } from 'lucide-react';
import api from '../../lib/api';
import { StatCard, AttendanceWidget } from './DashboardComponents'; // NotificationCard DISABLED
import DataTable from '../../components/common/DataTable';

/**
 * VideoEditorDashboard — Specialized view for Video Editors.
 * Focuses on production status, revisions, and deadlines.
 */
export default function VideoEditorDashboard({ dateRange }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params = { startDate: dateRange.startDate, endDate: dateRange.endDate };

        // Reuse the 'me' reports endpoint which provides role-contextual data
        api.get('/reports/me', { params })
            .then((res) => setStats(res.data.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [dateRange]);

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;
    if (!stats) return null;

    const total = stats.total_tasks ?? 0;
    const pending = stats.tasks_by_status?.pending ?? 0;
    const inProgress = stats.tasks_by_status?.in_progress ?? 0;
    const done = stats.tasks_by_status?.done ?? 0;
    const failed = stats.tasks_by_status?.failed ?? 0; // Usually Revisions in video context

    // For Video Editors, "Failed" tasks in the system often represent "Revisions Needed"
    const revisionCount = failed;
    const productionCount = inProgress;

    return (
        <div>
            <div className="dashboard-section-header" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-light)' }}>
                    Production Metrics
                </h3>
            </div>
            
            <div className="stats-grid" style={{ marginBottom: 32 }}>
                <AttendanceWidget />
                
                <StatCard
                    icon={Video}
                    label="Videos in Production"
                    value={productionCount}
                    color="#3b82f6"
                    to="/tasks"
                    state={{ status: 'in_progress', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                
                <StatCard
                    icon={Repeat}
                    label="Pending Revisions"
                    value={revisionCount}
                    color="#ef4444"
                    to="/tasks"
                    state={{ status: 'failed', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                
                <StatCard
                    icon={CheckCircle2}
                    label="Completions (MTD)"
                    value={done}
                    color="#10b981"
                    to="/tasks"
                    state={{ status: 'done', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />

                <StatCard
                    icon={Timer}
                    label="Total Edits Assigned"
                    value={total}
                    color="#8b5cf6"
                    to="/tasks"
                    state={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
            </div>

            <div className="dashboard-grid" style={{ marginTop: 24 }}>
                {/* <NotificationCard /> DISABLED to save Supabase resources */}
                
                {total > 0 && (
                    <div className="card" style={{ padding: '16px 20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
                            <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Progress</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{Math.round((done / total) * 100)}%</span>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ height: 12, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', display: 'flex' }}>
                                <div style={{ width: `${(done / total) * 100}%`, background: '#10b981', transition: 'width 0.5s' }} />
                                <div style={{ width: `${(inProgress / total) * 100}%`, background: '#f59e0b', transition: 'width 0.5s' }} />
                                <div style={{ width: `${(failed / total) * 100}%`, background: '#ef4444', transition: 'width 0.5s' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginTop: 16, fontSize: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                                    <span style={{ color: 'var(--text-dim)' }}>Delivered:</span>
                                    <span style={{ fontWeight: 700 }}>{done}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                                    <span style={{ color: 'var(--text-dim)' }}>Editing:</span>
                                    <span style={{ fontWeight: 700 }}>{inProgress}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                                    <span style={{ color: 'var(--text-dim)' }}>Revisions:</span>
                                    <span style={{ fontWeight: 700 }}>{failed}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' }} />
                                    <span style={{ color: 'var(--text-dim)' }}>Unstarted:</span>
                                    <span style={{ fontWeight: 700 }}>{pending}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Editing Queue Section */}
            <div className="card" style={{ marginTop: 24, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Video size={18} color="var(--accent)" />
                        Active Editing Queue
                    </h3>
                    <Link to="/tasks" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>Go to Projects</Link>
                </div>
                <DataTable
                    data={(stats.tasks || []).filter(t => ['pending', 'in_progress', 'failed'].includes(t.status))}
                    loading={loading}
                    fileName="video_editing_queue"
                    columns={[
                        { label: 'Project / Task', key: 'title' },
                        { label: 'Priority', key: 'priority' },
                        { label: 'Status', key: 'status' }
                    ]}
                    renderRow={(task, idx) => (
                        <tr key={task.id}>
                            <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: 12 }}>{idx + 1}</td>
                            <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 600 }}>{task.title}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{task.projectName || 'Internal Production'}</span>
                                    {task.qa_notes && (
                                        <div style={{ fontSize: 11, color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', padding: '6px 10px', borderRadius: 6, marginTop: 8, borderLeft: '3px solid #ef4444' }}>
                                            <strong>Revision Note:</strong> {task.qa_notes}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <span className={`badge ${task.priority === 'high' ? 'badge-red' : task.priority === 'medium' ? 'badge-yellow' : 'badge-blue'}`}>
                                    {task.priority?.toUpperCase()}
                                </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <span className={`badge ${task.status === 'failed' ? 'badge-red' : task.status === 'in_progress' ? 'badge-yellow' : 'badge-gray'}`}>
                                    {task.status === 'failed' ? 'REVISION' : task.status?.replace('_', ' ').toUpperCase()}
                                </span>
                            </td>
                        </tr>
                    )}
                />
            </div>

            {/* Recent Deliveries */}
            <div className="card" style={{ marginTop: 24, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={18} color="#10b981" />
                        Recent Deliveries
                    </h3>
                </div>
                <DataTable
                    data={(stats.tasks || []).filter(t => t.status === 'done').slice(0, 5)}
                    loading={loading}
                    fileName="recent_deliveries"
                    columns={[
                        { label: 'Title', key: 'title' },
                        { label: 'Completed Date', key: 'updated_at' }
                    ]}
                    renderRow={(task, idx) => (
                        <tr key={task.id}>
                            <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: 12 }}>{idx + 1}</td>
                            <td style={{ padding: '12px 16px' }}>
                                <span style={{ fontWeight: 600 }}>{task.title}</span>
                            </td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-dim)' }}>
                                {new Date(task.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                        </tr>
                    )}
                />
            </div>
        </div>
    );
}
