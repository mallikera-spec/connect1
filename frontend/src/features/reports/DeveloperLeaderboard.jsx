import { useEffect, useState, useMemo } from 'react';
import api from '../../lib/api';
import { Award, Trophy, Medal, Star, Target, ShieldCheck, Zap, TrendingUp } from 'lucide-react';
import { getISTMonthStartString, getISTTodayString } from '../../lib/dateUtils';
import DateRangePicker from '../../components/DateRangePicker';

export default function DeveloperLeaderboard() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: getISTMonthStartString(),
        endDate: getISTTodayString()
    });

    const load = () => {
        setLoading(true);
        api.get('/reports/employee-overview', { params: dateRange })
            .then(res => {
                const allDepartments = res.data.data || {};
                const devs = [];
                Object.values(allDepartments).forEach(deptUsers => {
                    deptUsers.forEach(u => {
                        if (u.isDeveloper && u.metrics) {
                            devs.push(u);
                        }
                    });
                });
                // Sort by performance score
                devs.sort((a, b) => (b.metrics?.performance_score || 0) - (a.metrics?.performance_score || 0));
                setData(devs);
            })
            .catch(err => console.error('Failed to load leaderboard:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [dateRange]);

    const topThree = data.slice(0, 3);
    const remaining = data.slice(3);

    const PodiumItem = ({ user, rank, height }) => {
        if (!user) return <div style={{ flex: 1 }} />;
        const icons = { 1: Trophy, 2: Medal, 3: Medal };
        const rankColors = { 1: '#fcd34d', 2: '#e2e8f0', 3: '#fb923c' }; // more vibrant
        const rankGradients = {
            1: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
            2: 'linear-gradient(180deg, #94a3b8 0%, #475569 100%)',
            3: 'linear-gradient(180deg, #ea580c 0%, #9a3412 100%)'
        };
        const Icon = icons[rank];

        return (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                <div style={{ position: 'relative', marginBottom: 16 }}>
                    <div style={{ padding: 4, borderRadius: '50%', background: rankGradients[rank], boxShadow: `0 10px 25px ${rankColors[rank]}44` }}>
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} style={{ width: 84, height: 84, borderRadius: '50%', border: '4px solid #1a1635' }} />
                        ) : (
                            <div className="user-avatar" style={{ width: 84, height: 84, fontSize: 24, margin: 0, border: '4px solid #1a1635' }}>{user.full_name?.slice(0, 2).toUpperCase()}</div>
                        )}
                    </div>
                    <div style={{ position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)', background: rankGradients[rank], color: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, border: '3px solid #1a1635', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                        {rank}
                    </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, textAlign: 'center', marginBottom: 4, color: '#fff' }}>{user.full_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{user.designation}</div>

                <div style={{
                    width: '100%',
                    background: rankGradients[rank],
                    height: height,
                    borderRadius: '16px 16px 0 0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '32px 16px',
                    gap: 12,
                    boxShadow: i => i === 1 ? '0 -10px 40px rgba(245, 158, 11, 0.2)' : 'none',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.1) 55%, transparent 60%)', animation: 'shine 3s infinite linear' }} />
                    <Icon size={40} color="#fff" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>{(user.metrics?.performance_score || 0).toFixed(1)}</div>
                        <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em' }}>Elite Score</div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading && data.length === 0) return <div className="page-loader"><div className="spinner" /></div>;

    return (
        <div style={{ padding: '2px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Award className="text-accent" />
                        Developer Elite Leaderboard
                    </h1>
                    <p style={{ color: 'var(--text-dim)', marginTop: 4 }}>
                        Celebrating technical excellence and consistent high-quality delivery.
                    </p>
                </div>
                <DateRangePicker
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    onRangeChange={setDateRange}
                />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 60, height: 400, padding: '0 40px' }}>
                <PodiumItem user={topThree[1]} rank={2} height={200} />
                <PodiumItem user={topThree[0]} rank={1} height={280} />
                <PodiumItem user={topThree[2]} rank={3} height={160} />
            </div>

            <div className="card polished-card" style={{ padding: 0 }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800 }}>Full Ranking Matrix</h3>
                </div>
                <div style={{ padding: '12px' }}>
                    {remaining.length === 0 && topThree.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>No performance data available for this range.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead>
                                <tr style={{ color: 'var(--text-dim)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                                    <th style={{ padding: '12px 20px', textAlign: 'left', width: 80 }}>Rank</th>
                                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>Developer</th>
                                    <th style={{ padding: '12px 20px', textAlign: 'center' }}>Pass Rate</th>
                                    <th style={{ padding: '12px 20px', textAlign: 'center' }}>Accuracy</th>
                                    <th style={{ padding: '12px 20px', textAlign: 'center' }}>Efficiency</th>
                                    <th style={{ padding: '12px 20px', textAlign: 'center' }}>Verdict Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((u, i) => (
                                    <tr key={u.id} className="leaderboard-row" style={{ background: i < 3 ? 'var(--accent-transparent)' : 'var(--card-bg)', transition: 'transform 0.2s' }}>
                                        <td style={{ padding: '16px 20px', borderRadius: '12px 0 0 12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontWeight: 900, fontSize: 18, color: i < 3 ? 'var(--accent)' : 'var(--text-dim)' }}>#{i + 1}</span>
                                                {i < 3 && <Star size={14} fill="var(--accent)" color="var(--accent)" />}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                {u.avatar_url ? (
                                                    <img src={u.avatar_url} alt={u.full_name} style={{ width: 40, height: 40, borderRadius: '50%' }} />
                                                ) : (
                                                    <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 12, margin: 0 }}>{u.full_name?.slice(0, 2).toUpperCase()}</div>
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{u.full_name}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{u.designation}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                                                    <div style={{ width: `${u.metrics?.qa_pass_rate}%`, height: '100%', background: 'var(--success)' }} />
                                                </div>
                                                <span style={{ fontSize: 13, fontWeight: 700 }}>{(u.metrics?.qa_pass_rate || 0).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--warning)' }}>{(u.metrics?.estimation_accuracy || 0).toFixed(0)}%</span>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{(u.metrics?.efficiency || 0).toFixed(2)}</span>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'center', borderRadius: '0 12px 12px 0' }}>
                                            <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--accent)' }}>{(u.metrics?.performance_score || 0).toFixed(1)}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <style>{`
                .leaderboard-row {
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                .leaderboard-row:hover {
                    transform: translateY(-2px);
                    background: var(--bg-card-hover) !important;
                    box-shadow: 0 8px 16px rgba(0,0,0,0.2);
                }
                @keyframes shine {
                    0% { transform: translateX(-100%) skewX(-15deg); }
                    100% { transform: translateX(200%) skewX(-15deg); }
                }
            `}</style>
        </div>
    );
}
