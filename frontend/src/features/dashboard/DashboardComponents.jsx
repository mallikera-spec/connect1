import { useNavigate, Link } from 'react-router-dom';

export function StatCard({ icon: Icon, label, value, color, to, state }) {
    return (
        <Link to={to} state={state} style={{ textDecoration: 'none' }}>
            <div className="stat-card">
                <div>
                    <div className="stat-value">{value ?? '—'}</div>
                    <div className="stat-label">{label}</div>
                </div>
                <div className="stat-icon" style={{ background: color }}>
                    <Icon size={22} color="#fff" />
                </div>
            </div>
        </Link>
    );
}

export function EmployeeCard({ employee, isAdminView, currentRange }) {
    const navigate = useNavigate();

    const goToTasks = (status = '') => {
        navigate('/tasks', {
            state: {
                assigned_to: employee.id,
                status,
                startDate: currentRange?.startDate,
                endDate: currentRange?.endDate
            }
        });
    };

    const goToPersonalTimesheet = () => {
        if (isAdminView) {
            navigate('/timesheet', {
                state: {
                    viewUserId: employee.id,
                    startDate: currentRange?.startDate,
                    endDate: currentRange?.endDate
                }
            });
        }
    };

    return (
        <div
            className="card"
            style={{
                padding: '16px',
                minWidth: '300px',
                flex: '1 1 350px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                cursor: isAdminView ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onClick={goToPersonalTimesheet}
            onMouseOver={(e) => isAdminView && (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseOut={(e) => isAdminView && (e.currentTarget.style.transform = 'translateY(0)')}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {employee.avatar_url ? (
                    <img src={employee.avatar_url} alt={employee.full_name} className="emp-avatar-img" />
                ) : (
                    <div className="user-avatar" style={{ margin: 0 }}>{employee.full_name?.slice(0, 2).toUpperCase()}</div>
                )}
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{employee.full_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{employee.designation || 'Specialist'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-light)' }}>{employee.total_hours}h</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Logged</div>
                </div>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: 0 }}>
                <div
                    style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); goToTasks(); }}
                >
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{employee.total_tasks}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tasks</div>
                </div>
                <div
                    style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); goToTasks('pending'); }}
                >
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-light)' }}>{employee.pending_tasks}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Pending</div>
                </div>
                <div
                    style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); goToTasks('done'); }}
                >
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)' }}>{employee.done_tasks}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Done</div>
                </div>
            </div>

            {employee.timesheet_items?.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                        Recent Timesheet Items
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {employee.timesheet_items.slice(0, 3).map(item => (
                            <div key={item.id} style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '6px', fontSize: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                    <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '8px' }}>
                                        {item.title}
                                    </span>
                                    <span style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{item.hours}</span>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{item.project}</span>
                                    <span>{new Date(item.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                        {employee.timesheet_items.length > 3 && (
                            <Link to="/reports" style={{ fontSize: '11px', color: 'var(--accent-light)', textDecoration: 'none', textAlign: 'center', marginTop: '4px', display: 'block' }} onClick={(e) => e.stopPropagation()}>
                                + {employee.timesheet_items.length - 3} more items
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
