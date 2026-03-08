import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Clock, User, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

/**
 * QAFeedbackTrail Component
 * Displays a chronological list of feedback and status changes for a specific item.
 * 
 * @param {string} type - 'task' or 'todo'
 * @param {string} itemId - The ID of the item
 * @param {boolean} refreshTrigger - Optional toggle to trigger a reload
 */
export default function QAFeedbackTrail({ type, itemId, refreshTrigger }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadHistory = useCallback(async () => {
        if (!itemId || itemId === 'undefined') return;
        setLoading(true);
        try {
            const endpoint = type === 'task'
                ? `/tasks/${itemId}/feedback`
                : `/timesheets/entries/${itemId}/feedback`;

            const res = await api.get(endpoint);
            setHistory(res.data.data || []);
        } catch (err) {
            console.error('Failed to load feedback history:', err);
        } finally {
            setLoading(false);
        }
    }, [type, itemId]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory, refreshTrigger]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'verified': return <CheckCircle size={14} color="#10b981" />;
            case 'failed': return <AlertCircle size={14} color="#ef4444" />;
            case 'done': return <RotateCcw size={14} color="#3b82f6" />;
            default: return <MessageSquare size={14} color="var(--text-dim)" />;
        }
    };

    if (loading && history.length === 0) {
        return <div style={{ padding: '20px', textAlign: 'center', opacity: 0.6 }}>Loading history...</div>;
    }

    if (history.length === 0) {
        return (
            <div style={{
                padding: '24px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                border: '1px dashed var(--border)',
                color: 'var(--text-dim)',
                fontSize: '13px'
            }}>
                No communication history yet.
            </div>
        );
    }

    return (
        <div className="feedback-trail" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <MessageSquare size={16} style={{ color: 'var(--accent)' }} />
                <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: 0 }}>
                    Communication Logs
                </h4>
            </div>

            <div style={{ position: 'relative', paddingLeft: '32px' }}>
                {/* Continuous Vertical Line (Waterfall) */}
                <div style={{
                    position: 'absolute',
                    left: '11px',
                    top: '0',
                    bottom: '0',
                    width: '3px',
                    background: 'linear-gradient(180deg, var(--accent) 0%, rgba(59, 130, 246, 0.4) 50%, var(--border) 100%)',
                    borderRadius: '4px',
                    opacity: 0.4
                }} />

                {history.map((item, idx) => {
                    const isQA = item.new_status === 'failed' || item.new_status === 'verified';
                    const isDev = item.new_status === 'done';
                    const accentColor = isQA ? (item.new_status === 'failed' ? '#ef4444' : '#10b981') : (isDev ? '#3b82f6' : 'var(--border)');

                    return (
                        <div key={item.id || idx} style={{ position: 'relative', marginBottom: '28px' }}>
                            {/* Marker Dot with Pulse Effect */}
                            <div style={{
                                position: 'absolute',
                                left: '-27px',
                                top: '8px',
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: accentColor,
                                border: '4px solid var(--modal-bg, #1a1a1a)',
                                zIndex: 2,
                                boxShadow: `0 0 10px ${accentColor}44`
                            }} />

                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                padding: '20px',
                                borderRadius: '16px',
                                border: '1px solid var(--border)',
                                borderLeftWidth: '6px',
                                borderLeftColor: accentColor,
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {item.author?.full_name || 'System'}
                                            </span>
                                            {item.new_status && (
                                                <span style={{
                                                    fontSize: '9px',
                                                    fontWeight: 800,
                                                    textTransform: 'uppercase',
                                                    padding: '2px 8px',
                                                    borderRadius: '100px',
                                                    background: item.new_status === 'failed' ? 'rgba(239, 68, 68, 0.15)' :
                                                        item.new_status === 'verified' ? 'rgba(16, 185, 129, 0.15)' :
                                                            'rgba(59, 130, 246, 0.15)',
                                                    color: item.new_status === 'failed' ? '#fb7185' :
                                                        item.new_status === 'verified' ? '#34d399' :
                                                            '#60a5fa',
                                                    border: `1px solid ${item.new_status === 'failed' ? 'rgba(239,68,68,0.2)' :
                                                        item.new_status === 'verified' ? 'rgba(16,185,129,0.2)' :
                                                            'rgba(59,130,246,0.2)'}`
                                                }}>
                                                    {item.new_status.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 500 }}>
                                            {(() => {
                                                const roles = item.author?.roles || [];
                                                const primaryRole = roles[0];
                                                const roleName = typeof primaryRole === 'string' ? primaryRole : primaryRole?.name;
                                                return roleName || (isQA ? 'QA Engineer' : 'Developer');
                                            })()}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '6px' }}>
                                        <Clock size={11} />
                                        {new Date(item.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p style={{ fontSize: '13px', lineHeight: 1.6, margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', opacity: 0.9 }}>
                                    {item.content}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
