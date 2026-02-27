import React from 'react';
import { Briefcase, Phone, Mail, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';

/**
 * LeadLifecycleBoard — Visual Kanban representation of the lead lifecycle.
 * Groups existing statuses into Cold, Warm, and Client stages.
 */
export default function LeadLifecycleBoard({ leads, onSelectLead }) {
    // 1. Define Stages & Mapping
    const stages = [
        {
            id: 'cold',
            title: 'Cold Phase',
            subtitle: 'Initial Contact & Discovery',
            color: 'var(--info)',
            bg: 'rgba(59, 130, 246, 0.05)',
            border: 'rgba(59, 130, 246, 0.2)',
            statuses: ['New', 'Contacted'],
            icon: <Clock size={16} />
        },
        {
            id: 'warm',
            title: 'Warm Phase',
            subtitle: 'Active Engagement & Proposal',
            color: 'var(--warning)',
            bg: 'rgba(245, 158, 11, 0.05)',
            border: 'rgba(245, 158, 11, 0.2)',
            statuses: ['Qualified', 'Proposal'],
            icon: <Briefcase size={16} />
        },
        {
            id: 'client',
            title: 'Client',
            subtitle: 'Successfully Closed Deals',
            color: 'var(--success)',
            bg: 'rgba(16, 185, 129, 0.05)',
            border: 'rgba(16, 185, 129, 0.2)',
            statuses: ['Won'],
            icon: <CheckCircle size={16} />
        }
    ];

    // 2. Group Leads by Stage
    const groupedLeads = stages.map(stage => {
        return {
            ...stage,
            items: leads.filter(lead => stage.statuses.includes(lead.status))
        };
    });

    const lostLeadsCount = leads.filter(l => l.status === 'Lost').length;

    return (
        <div className="lifecycle-board">
            <div className="board-grid">
                {groupedLeads.map(stage => (
                    <div key={stage.id} className="board-column" style={{ background: stage.bg, borderColor: stage.border }}>
                        <div className="column-header" style={{ borderBottomColor: stage.border }}>
                            <div className="header-icon" style={{ color: stage.color, background: 'var(--bg-card)' }}>
                                {stage.icon}
                            </div>
                            <div>
                                <h3>{stage.title}</h3>
                                <p>{stage.subtitle}</p>
                            </div>
                            <div className="column-count" style={{ background: 'var(--bg-card)', color: stage.color }}>
                                {stage.items.length}
                            </div>
                        </div>

                        <div className="column-content">
                            {stage.items.length === 0 ? (
                                <div className="empty-column">No leads in this phase</div>
                            ) : (
                                stage.items.map(lead => (
                                    <div key={lead.id} className="lead-card card polished-card" onClick={() => onSelectLead(lead.id)}>
                                        <div className="lead-card-header">
                                            <h4>{lead.name}</h4>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                {lead.follow_ups?.some(f => f.status === 'Pending') && (
                                                    <div title="Pending Callback/Follow-up" style={{ color: 'var(--warning)' }}>
                                                        <AlertCircle size={14} />
                                                    </div>
                                                )}
                                                <span className={`status-badge min ${lead.status.toLowerCase().replace(' ', '-')}`}>
                                                    {lead.status}
                                                </span>
                                            </div>
                                        </div>
                                        {lead.company && <div className="lead-company"><Briefcase size={12} /> {lead.company}</div>}

                                        <div className="lead-meta">
                                            {lead.phone && <span><Phone size={12} /> {lead.phone}</span>}
                                        </div>

                                        <div className="lead-card-footer">
                                            <div className="value">${parseFloat(lead.deal_value || 0).toLocaleString()}</div>
                                            <div className="agent">
                                                {lead.assigned_agent?.full_name ? (
                                                    <div className="agent-avatar" title={lead.assigned_agent.full_name}>
                                                        {lead.assigned_agent.full_name.charAt(0)}
                                                    </div>
                                                ) : (
                                                    <span className="unassigned">Unassigned</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {lostLeadsCount > 0 && (
                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-dim)' }}>
                    <em>{lostLeadsCount} lead{lostLeadsCount !== 1 ? 's' : ''} categorized as "Lost" are hidden from the active lifecycle view. Switch to List View to see them.</em>
                </div>
            )}

            <style>{`
                .lifecycle-board {
                    padding: 0;
                    height: 100%;
                }
                .board-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    align-items: flex-start;
                }
                .board-column {
                    border-radius: 12px;
                    border: 1px solid transparent;
                    display: flex;
                    flex-direction: column;
                    min-height: 500px;
                }
                .column-header {
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border-bottom: 1px solid transparent;
                }
                .header-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .column-header h3 {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--text);
                }
                .column-header p {
                    margin: 2px 0 0 0;
                    font-size: 11px;
                    color: var(--text-dim);
                }
                .column-count {
                    margin-left: auto;
                    font-size: 13px;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 12px;
                }
                .column-content {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .empty-column {
                    text-align: center;
                    padding: 40px 0;
                    color: var(--text-dim);
                    font-style: italic;
                    font-size: 13px;
                }
                .lead-card {
                    padding: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1px solid var(--border);
                }
                .lead-card:hover {
                    transform: translateY(-2px);
                    border-color: var(--accent);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                }
                .lead-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 8px;
                }
                .lead-card-header h4 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 700;
                }
                .lead-company {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: var(--text-dim);
                    margin-bottom: 8px;
                }
                .lead-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    font-size: 11px;
                    color: var(--text-dim);
                    margin-bottom: 16px;
                }
                .lead-meta span {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .lead-card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 12px;
                    border-top: 1px solid var(--border);
                }
                .lead-card-footer .value {
                    font-weight: 700;
                    font-size: 14px;
                    color: var(--text);
                }
                .agent-avatar {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: var(--accent-light);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: 700;
                }
                .unassigned {
                    font-size: 11px;
                    color: var(--text-dim);
                    font-style: italic;
                }
                .status-badge.min {
                    padding: 2px 8px;
                    font-size: 9px;
                }
            `}</style>
        </div>
    );
}
