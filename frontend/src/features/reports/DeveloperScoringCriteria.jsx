import { useState } from 'react';
import { Star, Info, Target, Trophy, Clock } from 'lucide-react';
import DataTable from '../../components/common/DataTable';

// Default scoring criteria placeholders
const CRITERIA_DATA = [
    {
        id: 1,
        category: 'Efficiency (Items per Hour)',
        metric: 'Items Completed / Total Hours Logged',
        target: '1.5+ items/hour',
        points: 'Up to 30 points',
        description: 'Measures how quickly tasks and todos are delivered without sacrificing quality.'
    },
    {
        id: 2,
        category: 'QA Pass Rate (Accuracy)',
        metric: 'Passed Testing Todos / Total Todos Audited',
        target: '> 85%',
        points: 'Up to 30 points',
        description: 'Measures the first-time pass rate of work submitted for testing.'
    },
    {
        id: 3,
        category: 'Delivery Volume',
        metric: 'Total Items Completed',
        target: 'Matches sprint velocity',
        points: 'Up to 20 points',
        description: 'Raw output of completed project tasks and internal todos within the period.'
    },
    {
        id: 4,
        category: 'Code Quality & Standard adherence',
        metric: 'Manual QA/Code Review Score',
        target: 'Minimal rework requests',
        points: 'Up to 10 points',
        description: 'Based on adherence to ArgosMob best practices and clean code guidelines.'
    },
    {
        id: 5,
        category: 'Timeliness & Communication',
        metric: 'Updates to Jira / Internal Tracker',
        target: 'Daily timely updates',
        points: 'Up to 10 points',
        description: 'Proactiveness in updating task statuses, timesheets, and communicating blockers.'
    }
];

export default function DeveloperScoringCriteria() {
    return (
        <div className="page-content">
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Star className="text-accent" />
                        Developer Scoring Criteria
                    </h1>
                    <p style={{ color: 'var(--text-dim)', marginTop: 4 }}>
                        Overview of how engineering performance is evaluated and scored across the organization.
                    </p>
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="card polished-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>Maximum Score</div>
                            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>100 pts</div>
                        </div>
                        <div style={{ background: '#3b82f620', padding: 10, borderRadius: 10 }}>
                            <Trophy size={20} color="#3b82f6" />
                        </div>
                    </div>
                </div>
                <div className="card polished-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>Evaluation Period</div>
                            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>Monthly</div>
                        </div>
                        <div style={{ background: '#10b98120', padding: 10, borderRadius: 10 }}>
                            <Clock size={20} color="#10b981" />
                        </div>
                    </div>
                </div>
                <div className="card polished-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>Passing Goal</div>
                            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>&gt; 70 pts</div>
                        </div>
                        <div style={{ background: '#f59e0b20', padding: 10, borderRadius: 10 }}>
                            <Target size={20} color="#f59e0b" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm" style={{ padding: 0 }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>Scoring Matrix Breakdown</h3>
                    <Info size={16} color="var(--text-muted)" />
                </div>

                <DataTable
                    data={CRITERIA_DATA}
                    fileName="Developer_Scoring_Criteria"
                    columns={[
                        { label: 'Category', key: 'category', sortable: true, render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
                        { label: 'Metric / Calculation', key: 'metric', sortable: true, render: (val) => <span style={{ color: 'var(--text-dim)' }}>{val}</span> },
                        { label: 'Target / Benchmark', key: 'target', sortable: true, render: (val) => <span className="badge-pill badge-purple" style={{ fontSize: 11 }}>{val}</span> },
                        { label: 'Points Allocation', key: 'points', sortable: true, render: (val) => <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{val}</span> },
                        { label: 'Description', key: 'description', sortable: false, wrap: true }
                    ]}
                />
            </div>

            <div className="card shadow-sm" style={{ marginTop: 24, padding: 24, background: 'rgba(59, 130, 246, 0.05)', borderLeft: '4px solid var(--accent)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>What these scores mean:</h4>
                <ul style={{ listStyleType: 'disc', paddingLeft: 20, fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <li><strong>85 - 100 points (Exceptional):</strong> Consistently delivers bug-free features ahead of schedule. Candidate for leadership/bonuses.</li>
                    <li><strong>70 - 84 points (Solid/Passing):</strong> Meets expectations on both quality and velocity. Reliable contributor.</li>
                    <li><strong>50 - 69 points (Needs Improvement):</strong> Often misses sprint targets or requires significant rework identified in QA.</li>
                    <li><strong>&lt; 50 points (Critical):</strong> Requires immediate performance plan or technical intervention.</li>
                </ul>
            </div>
        </div>
    );
}
