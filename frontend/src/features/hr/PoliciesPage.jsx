import { Shield, Clock, Calendar, CheckCircle2, Info, Gift, Coffee, Sparkles, Smile, Shirt, ShieldAlert, HeartPulse } from 'lucide-react';

export default function PoliciesPage() {
    const categories = [
        {
            id: 'attendance',
            title: 'Leave & Attendance',
            icon: Clock,
            color: '#7c3aed',
            items: [
                {
                    title: 'Leave Policy',
                    content: [
                        { name: 'Earned Leave', limit: '18 Days/FY', desc: '1 day/month (first 6 mo), then 1.5. No rollover to next FY.' },
                        { name: 'Unpaid Leave', limit: 'As needed', desc: 'Available for emergencies. Results in salary deduction.' }
                    ]
                },
                {
                    title: 'Work Hours',
                    points: [
                        'Standard Hours: 10:00 AM to 7:00 PM.',
                        'Mandatory check-in/out via the portal.',
                        'Full Day: Min 9 hours; Half Day: 4-6 hours.',
                        'Daily timesheet entry mandatory before EOD.'
                    ]
                }
            ]
        },
        {
            id: 'conduct',
            title: 'Office Conduct & Hygiene',
            icon: ShieldAlert,
            color: '#ef4444',
            items: [
                {
                    title: 'Dress Code',
                    icon: Shirt,
                    points: [
                        'Business Casual: Monday to Thursday.',
                        'Smart Casuals: Fridays and Saturdays.',
                        'Attire should be clean, professional, and well-groomed.'
                    ]
                },
                {
                    title: 'Behavioral Standards',
                    icon: Smile,
                    points: [
                        'Maintain professional decorum at all times.',
                        'Zero tolerance for harassment or discrimination.',
                        'Timely communication and respect for colleagues.',
                        'Conflict resolution through HR or Management only.'
                    ]
                },
                {
                    title: 'Hygiene & Cleanliness',
                    icon: HeartPulse,
                    points: [
                        'Keep workstations clean and clutter-free.',
                        'Dispose of food waste in designated bins only.',
                        'Maintain personal hygiene for a healthy work environment.'
                    ]
                }
            ]
        },
        {
            id: 'culture',
            title: 'Culture & Events',
            icon: Sparkles,
            color: '#f59e0b',
            items: [
                {
                    title: 'Fun Activities',
                    icon: Coffee,
                    points: [
                        'The last working day of the month is dedicated to team building.',
                        'Post-lunch sessions feature games, birthdays, and celebrations.',
                        'Participation is encouraged for better team bonding.'
                    ]
                }
            ]
        }
    ];

    const holidays = [
        { date: '26-Jan-26', day: 'Monday', desc: 'Republic Day', status: 'Off' },
        { date: '15-Feb-26', day: 'Sunday', desc: 'Mahashivratri', status: 'Off' },
        { date: '05-Mar-26', day: 'Wednesday', desc: 'Holi', status: 'Off' },
        { date: '26-Mar-26', day: 'Thursday', desc: 'Shri Ram Navami', status: 'Working' },
        { date: '28-Aug-26', day: 'Friday', desc: 'Raksha Bandhan', status: 'Off' },
        { date: '02-Oct-26', day: 'Friday', desc: 'Mahatma Gandhi Jayanti', status: 'Off' },
        { date: '20-Oct-26', day: 'Tuesday', desc: 'Dussehra', status: 'Off' },
        { date: '10-Nov-26', day: 'Tuesday', desc: 'Diwali-Balipratipada', status: 'Off' },
    ];

    // Simplified holiday list for brevity on page
    const workingHolidays = [
        'Shri Ram Navami', 'Shri Mahavir Jayanti', 'Good Friday',
        'Dr. Ambedkar Jayanti', 'Maharashtra Day', 'Bakri Id',
        'Muharram', 'Ganesh Chaturthi', 'Prakash Gurpurb', 'Christmas'
    ];

    return (
        <div className="animate-in" style={{ paddingBottom: '40px' }}>
            <div className="page-header">
                <div>
                    <h1>Argomsob Policies</h1>
                    <p>Standard guidelines and cultural values of ArgosMob Connect</p>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '48px' }}>
                {categories.map(cat => {
                    const CatIcon = cat.icon;
                    return (
                        <div key={cat.id}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                                <div style={{ color: cat.color }}><CatIcon size={24} /></div>
                                <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{cat.title}</h2>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                                {cat.items.map((item, idx) => (
                                    <div key={idx} className="card" style={{ padding: '24px', height: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: cat.color }}>
                                            {item.icon && <item.icon size={18} />}
                                            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{item.title}</h3>
                                        </div>

                                        {item.content ? (
                                            <div style={{ display: 'grid', gap: '12px' }}>
                                                {item.content.map(lv => (
                                                    <div key={lv.name} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{lv.name}</span>
                                                            <span style={{ color: cat.color, fontWeight: 700, fontSize: '12px' }}>{lv.limit}</span>
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.4' }}>{lv.desc}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'grid', gap: '10px' }}>
                                                {item.points.map((p, i) => (
                                                    <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '13px', color: 'var(--text-dim)', lineHeight: '1.5' }}>
                                                        <div style={{ color: cat.color, marginTop: '2px' }}>•</div>
                                                        {p}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Holiday Calendar Section */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                        <div style={{ color: '#22c55e' }}><Gift size={24} /></div>
                        <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Holiday Calendar 2026</h2>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)' }}>Date</th>
                                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)' }}>Holiday Name</th>
                                    <th style={{ textAlign: 'center', padding: '12px 20px', color: 'var(--text-muted)' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holidays.map((h, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                        <td style={{ padding: '12px 20px', fontWeight: 500 }}>{h.date} ({h.day.substring(0, 3)})</td>
                                        <td style={{ padding: '12px 20px' }}>{h.desc}</td>
                                        <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800,
                                                background: 'rgba(34,197,94,0.1)', color: '#22c55e'
                                            }}>PAID OFF</span>
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{ background: 'rgba(234,179,8,0.03)' }}>
                                    <td colSpan="3" style={{ padding: '12px 20px', fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                        <strong>Working Holidays:</strong> {workingHolidays.join(', ')}. Standard office rules apply.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Final Note */}
                <div style={{
                    background: 'rgba(124,58,237,0.05)',
                    border: '1px dashed var(--accent)',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center'
                }}>
                    <Info size={32} style={{ color: 'var(--accent)', marginBottom: '12px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Policy Compliance</h3>
                    <p style={{ maxWidth: '700px', margin: '0 auto', color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                        These policies are designed to maintain a healthy, productive, and respectful work environment for all.
                        Argomsob Management reserves the right to modify these guidelines.
                        <strong> Failure to comply with conduct policies may result in disciplinary action.</strong>
                    </p>
                </div>
            </div>
        </div>
    );
}
