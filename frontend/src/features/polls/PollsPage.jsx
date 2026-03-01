import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PollsService } from './PollsService';
import { Plus, Vote, BarChart2, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PollsPage() {
    const { user } = useAuth();
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''], expires_at: '' });
    const [selectedPollResults, setSelectedPollResults] = useState(null);

    const userRoles = user?.roles?.map(r => typeof r === 'string' ? r.toLowerCase() : r.name?.toLowerCase()) || [];
    const isAdminOrHR = userRoles.some(r => r.includes('admin') || r.includes('hr'));

    useEffect(() => {
        fetchPolls();
    }, []);

    const fetchPolls = async () => {
        setLoading(true);
        try {
            const res = await PollsService.getActivePolls();
            setPolls(res.data.data || []);
        } catch (err) {
            toast.error('Failed to load polls');
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (pollId, optionId) => {
        try {
            await PollsService.vote(pollId, optionId);
            toast.success('Vote recorded!');
            fetchPolls();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to vote');
        }
    };

    const handleCreatePoll = async (e) => {
        e.preventDefault();
        const filteredOptions = newPoll.options.filter(o => o.trim() !== '');
        if (filteredOptions.length < 2) return toast.error('At least 2 options are required');

        try {
            await PollsService.createPoll({ ...newPoll, options: filteredOptions });
            toast.success('Poll created successfully!');
            setIsCreateModalOpen(false);
            setNewPoll({ question: '', options: ['', ''], expires_at: '' });
            fetchPolls();
        } catch (err) {
            toast.error('Failed to create poll');
        }
    };

    const viewResults = async (pollId) => {
        try {
            const res = await PollsService.getPollResults(pollId);
            setSelectedPollResults(res.data.data);
        } catch (err) {
            toast.error('Failed to load results');
        }
    };

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;

    return (
        <div className="polls-page">
            <div className="page-header">
                <div>
                    <h1>Employee Polls</h1>
                    <p>Share your thoughts and participate in company decisions.</p>
                </div>
                {isAdminOrHR && (
                    <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus size={18} /> Create Poll
                    </button>
                )}
            </div>

            <div className="polls-grid">
                {polls.length === 0 ? (
                    <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                        <AlertCircle size={40} style={{ color: 'var(--text-dim)', marginBottom: 12 }} />
                        <h3 style={{ color: 'var(--text-dim)' }}>No active polls found</h3>
                    </div>
                ) : (
                    polls.map(poll => (
                        <div key={poll.id} className="poll-card">
                            <div className="poll-header">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <h3 className="poll-question">{poll.question}</h3>
                                    {poll.hasVoted && <CheckCircle2 size={20} style={{ color: 'var(--success)', flexShrink: 0, marginLeft: 12 }} />}
                                </div>
                                {poll.expires_at && (
                                    <div className="poll-meta">
                                        <Clock size={12} /> Expires: {new Date(poll.expires_at).toLocaleDateString()}
                                    </div>
                                )}
                            </div>

                            <div className="poll-options-list">
                                {poll.options.map(option => (
                                    <button
                                        key={option.id}
                                        className={`poll-option-btn ${poll.myVote === option.id ? 'voted' : ''}`}
                                        disabled={poll.hasVoted}
                                        onClick={() => handleVote(poll.id, option.id)}
                                    >
                                        <Vote size={16} />
                                        {option.text}
                                    </button>
                                ))}
                            </div>

                            {isAdminOrHR && (
                                <div className="poll-card-footer">
                                    <button className="btn btn-ghost" style={{ flex: 1, fontSize: 12 }} onClick={() => viewResults(poll.id)}>
                                        <BarChart2 size={14} /> View Results
                                    </button>
                                    <button className="btn btn-icon btn-danger" title="Delete Poll">
                                        <XCircle size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Create Poll Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Create New Poll</h2>
                            <button className="btn-icon" onClick={() => setIsCreateModalOpen(false)}>
                                <XCircle size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreatePoll}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Question</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="What would you like to ask?"
                                        value={newPoll.question}
                                        onChange={e => setNewPoll({ ...newPoll, question: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Options</label>
                                    {newPoll.options.map((opt, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder={`Option ${idx + 1}`}
                                                value={opt}
                                                onChange={e => {
                                                    const opts = [...newPoll.options];
                                                    opts[idx] = e.target.value;
                                                    setNewPoll({ ...newPoll, options: opts });
                                                }}
                                                required={idx < 2}
                                            />
                                            {newPoll.options.length > 2 && (
                                                <button
                                                    type="button"
                                                    className="btn btn-icon"
                                                    onClick={() => {
                                                        const opts = newPoll.options.filter((_, i) => i !== idx);
                                                        setNewPoll({ ...newPoll, options: opts });
                                                    }}
                                                >
                                                    <XCircle size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setNewPoll({ ...newPoll, options: [...newPoll.options, ''] })}
                                    >
                                        + Add Option
                                    </button>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Expiry Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={newPoll.expires_at}
                                        onChange={e => setNewPoll({ ...newPoll, expires_at: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Poll</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Results Modal */}
            {selectedPollResults && (
                <div className="modal-overlay" onClick={() => setSelectedPollResults(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Poll Results</h2>
                            <button className="btn-icon" onClick={() => setSelectedPollResults(null)}>
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <h3 className="poll-question" style={{ marginBottom: 20 }}>{selectedPollResults.question}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {selectedPollResults.options.map(opt => {
                                    const percentage = selectedPollResults.totalVotes > 0
                                        ? Math.round((opt.count / selectedPollResults.totalVotes) * 100)
                                        : 0;
                                    return (
                                        <div key={opt.id} className="poll-result-item">
                                            <div className="poll-result-info">
                                                <span>{opt.text}</span>
                                                <span style={{ fontWeight: 700 }}>{opt.count} votes ({percentage}%)</span>
                                            </div>
                                            <div className="poll-progress-bg">
                                                <div className="poll-progress-bar" style={{ width: `${percentage}%` }} />
                                            </div>
                                            {opt.voters && opt.voters.length > 0 && (
                                                <div className="poll-voters-list">
                                                    Voters: {opt.voters.join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="poll-total-footer">
                                Total Responses: <strong>{selectedPollResults.totalVotes}</strong>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setSelectedPollResults(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
