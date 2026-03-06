import { useState, useEffect } from 'react';
import { SalesService } from './SalesService';
import { Rocket, Target, Building2, Briefcase, FileText, CheckCircle2, Clock } from 'lucide-react';

export default function LeadJourneyView({ leadId }) {
    const [journey, setJourney] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (leadId) loadJourney();
    }, [leadId]);

    const loadJourney = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await SalesService.getLeadJourney(leadId);
            setJourney(res.data);
        } catch (err) {
            setError(err.message || 'Failed to load lead journey');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" /></div>;
    if (error) return <div style={{ padding: '40px', color: 'var(--danger)', textAlign: 'center' }}>{error}</div>;
    if (!journey) return null;

    const { lead, client, projects } = journey;

    // Determine current stage for visual highlighting
    let currentStage = 1; // 1: Lead, 2: Proposal, 3: Client, 4: Projects
    if (lead.status === 'Proposal') currentStage = 2;
    if (client || lead.status === 'Won') currentStage = 3;
    if (projects && projects.length > 0) currentStage = 4;

    const StageIcon = ({ icon: Icon, active, completed }) => (
        <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: active ? 'var(--accent)' : completed ? 'var(--success)' : 'var(--bg-app)',
            color: active || completed ? '#fff' : 'var(--text-dim)',
            boxShadow: active ? '0 0 0 4px rgba(124, 58, 237, 0.2)' : 'none',
            zIndex: 1
        }}>
            {completed && !active ? <CheckCircle2 size={20} /> : <Icon size={20} />}
        </div>
    );

    const StageLine = ({ completed }) => (
        <div style={{
            flex: 1, height: '4px',
            background: completed ? 'var(--success)' : 'var(--border)',
            margin: '0 -10px',
            borderRadius: '2px',
            zIndex: 0
        }} />
    );

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Horizontal Timeline Tracker */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                <StageIcon icon={Target} active={currentStage === 1} completed={currentStage > 1} />
                <StageLine completed={currentStage > 1} />
                <StageIcon icon={FileText} active={currentStage === 2} completed={currentStage > 2} />
                <StageLine completed={currentStage > 2} />
                <StageIcon icon={Building2} active={currentStage === 3} completed={currentStage > 3} />
                <StageLine completed={currentStage > 3} />
                <StageIcon icon={Briefcase} active={currentStage === 4} completed={currentStage > 4} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginTop: '-30px', fontSize: '12px', fontWeight: 600, color: 'var(--text-dim)' }}>
                <span>Marketing</span>
                <span>Proposal</span>
                <span>Conversion</span>
                <span>Execution</span>
            </div>

            {/* Detailed Stage Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Stage 1: Lead Details */}
                <div className="card polished-card" style={{ padding: '20px', borderLeft: currentStage === 1 ? '4px solid var(--accent)' : '4px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <Target size={20} color={currentStage >= 1 ? 'var(--accent)' : 'var(--text-dim)'} />
                        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Lead Acquisition</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '13px' }}>
                        <div><span style={{ color: 'var(--text-dim)' }}>Created:</span> <b>{new Date(lead.created_at).toLocaleDateString()}</b></div>
                        <div><span style={{ color: 'var(--text-dim)' }}>Source:</span> <b>{lead.source || 'Unknown'}</b></div>
                        <div><span style={{ color: 'var(--text-dim)' }}>Initial Value:</span> <b>Rs {lead.deal_value || '0'}</b></div>
                        <div><span style={{ color: 'var(--text-dim)' }}>Interactions:</span> <b>{lead.follow_ups?.length || 0} Logged</b></div>
                    </div>
                </div>

                {/* Stage 2: Proposal (If reached) */}
                {(currentStage >= 2 || lead.status === 'Lost') && (
                    <div className="card polished-card" style={{ padding: '20px', borderLeft: currentStage === 2 ? '4px solid var(--accent)' : '4px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <FileText size={20} color={currentStage >= 2 ? 'var(--accent)' : 'var(--text-dim)'} />
                            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Proposal & Negotiation</h3>
                        </div>
                        <div style={{ fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-dim)' }}>Status:</span> <b>{lead.status}</b>
                            {lead.score > 0 && <span style={{ marginLeft: '16px' }}><span style={{ color: 'var(--text-dim)' }}>Quality Score:</span> <b>{lead.score}/10</b></span>}
                        </div>
                    </div>
                )}

                {/* Stage 3: Client Conversion (If reached) */}
                {(client || lead.status === 'Won') && (
                    <div className="card polished-card" style={{ padding: '20px', borderLeft: currentStage === 3 ? '4px solid var(--success)' : '4px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Building2 size={20} color="var(--success)" />
                            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Client Converted</h3>
                        </div>
                        {client ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '13px' }}>
                                <div><span style={{ color: 'var(--text-dim)' }}>Converted On:</span> <b>{new Date(client.created_at).toLocaleDateString()}</b></div>
                                <div><span style={{ color: 'var(--text-dim)' }}>Company:</span> <b>{client.company_name}</b></div>
                                <div><span style={{ color: 'var(--text-dim)' }}>Status:</span> <b style={{ color: 'var(--success)' }}>{client.status}</b></div>
                            </div>
                        ) : (
                            <div style={{ fontSize: '13px', color: 'var(--warning)' }}>Marked as Won, but client record not found.</div>
                        )}
                    </div>
                )}

                {/* Stage 4: Project Execution (If reached) */}
                {projects && projects.length > 0 && (
                    <div className="card polished-card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Briefcase size={20} color="#3b82f6" />
                            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Project Execution</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {projects.map(proj => (
                                <div key={proj.id} style={{ padding: '12px', background: 'var(--bg-app)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{proj.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                            <Clock size={12} /> {new Date(proj.start_date).toLocaleDateString()} - {new Date(proj.end_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                                        background: proj.status === 'Completed' ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)',
                                        color: proj.status === 'Completed' ? 'var(--success)' : '#3b82f6'
                                    }}>
                                        {proj.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
