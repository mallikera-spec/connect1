import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Clock, Send, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

/**
 * QAFeedbackTrail Component
 * Displays a chronological list of feedback and status changes for a specific item.
 * 
 * @param {string} type - 'task' or 'todo'
 * @param {string} itemId - The ID of the item
 * @param {boolean} refreshTrigger - Optional toggle to trigger a reload
 * @param {boolean} allowPost - Whether to show the note input box
 */
export default function QAFeedbackTrail({ type, itemId, refreshTrigger, allowPost = false }) {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [posting, setPosting] = useState(false);
    const [localRefresh, setLocalRefresh] = useState(0);

    const roles = user?.roles?.map(r => (typeof r === 'string' ? r : r.name || '').toLowerCase()) || [];
    const isDirector = roles.some(r => r.includes('director') || r.includes('super admin') || r.includes('super_admin') || r.includes('admin'));
    const isTester = roles.includes('tester');
    const isDeveloper = roles.includes('developer');

    const actingRoleLabel = isDirector ? 'Director' : isTester ? 'Tester' : isDeveloper ? 'Developer' : 'User';

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
    }, [type, itemId, localRefresh]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory, refreshTrigger]);

    const handleAddNote = async (e) => {
        if (e) e.preventDefault();
        if (!newNote.trim() || posting) return;

        setPosting(true);
        try {
            const endpoint = type === 'task'
                ? `/tasks/${itemId}/feedback`
                : `/timesheets/entries/${itemId}/feedback`;

            await api.post(endpoint, {
                content: newNote.trim(),
                role_type: actingRoleLabel.toLowerCase()
            });
            
            setNewNote('');
            setLocalRefresh(p => p + 1);
            toast.success('Note added');
        } catch (err) {
            toast.error('Failed to add note');
        } finally {
            setPosting(false);
        }
    };

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
                {history.length > 0 && (
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
                )}

                {history.length === 0 ? (
                    <div style={{
                        padding: '24px',
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '12px',
                        border: '1px dashed var(--border)',
                        color: 'var(--text-dim)',
                        fontSize: '13px',
                        marginBottom: '20px'
                    }}>
                        No communication history yet.
                    </div>
                ) : (
                    history.map((item, idx) => {
                        const isQAFeedback = item.new_status === 'failed' || item.new_status === 'verified' || item.role_type === 'tester';
                        const isDevFeedback = item.new_status === 'done' || item.role_type === 'developer';
                        const accentColor = isQAFeedback ? (item.new_status === 'failed' ? '#ef4444' : '#10b981') : (isDevFeedback ? '#3b82f6' : 'var(--border)');

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
                                                    const roleName = typeof primaryRole === 'string' ? roleName : primaryRole?.name;
                                                    return roleName || (item.role_type ? (item.role_type.charAt(0).toUpperCase() + item.role_type.slice(1)) : 'System');
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
                    })
                )}

                {allowPost && (
                    <div style={{ position: 'relative', marginTop: 16 }}>
                        <div style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            color: 'var(--accent)',
                            marginBottom: '6px',
                            marginLeft: '2px',
                            letterSpacing: '0.05em',
                            opacity: 0.8
                        }}>
                            Post as {actingRoleLabel}
                        </div>
                        <div style={{
                            position: 'absolute',
                            left: '-27px',
                            top: '8px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: 'var(--accent)',
                            border: '4px solid var(--modal-bg, #1a1a1a)',
                            zIndex: 2,
                        }} />
                        <div style={{ position: 'relative' }}>
                            <textarea
                                className="form-input"
                                placeholder="Leave a note..."
                                value={newNote}
                                onChange={e => setNewNote(e.target.value)}
                                rows={3}
                                style={{
                                    width: '100%',
                                    paddingRight: '50px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '16px',
                                    fontSize: '13px',
                                    border: '1px solid var(--border)',
                                    resize: 'none',
                                    paddingTop: '12px',
                                    paddingBottom: '12px'
                                }}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddNote(e)}
                            />
                            <button
                                onClick={handleAddNote}
                                disabled={posting || !newNote.trim()}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    bottom: '12px',
                                    background: 'var(--accent)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    opacity: posting || !newNote.trim() ? 0.5 : 1
                                }}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
