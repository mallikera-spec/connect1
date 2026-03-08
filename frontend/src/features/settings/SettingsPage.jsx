import { useTheme } from '../../context/ThemeContext'
import { Moon, Sun, Monitor, Paintbrush, MonitorPlay, Leaf } from 'lucide-react'

const THEMES = [
    { id: 'system', name: 'System Sync', icon: Monitor, color: '#9ca3af' },
    { id: 'light', name: 'Clean Light', icon: Sun, color: '#f8fafc', textColor: '#0f172a' },
    { id: 'dark', name: 'Deep Space', icon: Moon, color: '#080810', textColor: '#fff' },
    { id: 'midnight', name: 'Midnight Ocean', icon: MonitorPlay, color: '#020617', textColor: '#38bdf8' },
    { id: 'forest', name: 'Emerald Forest', icon: Leaf, color: '#051912', textColor: '#10b981' }
]

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <h1>Settings</h1>
                    <p>Customize your ArgosMob Connect experience</p>
                </div>
            </div>

            <div className="card shadow-sm" style={{ maxWidth: 800 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ background: 'var(--accent-gradient)', padding: 10, borderRadius: 12, color: 'white' }}>
                        <Paintbrush size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Appearance</h2>
                        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Select your preferred theme for the workspace</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                    {THEMES.map(t => (
                        <div
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            style={{
                                padding: 20,
                                borderRadius: 12,
                                border: `2px solid ${theme === t.id ? 'var(--accent)' : 'var(--border)'}`,
                                background: t.color,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: theme === t.id ? '0 8px 20px rgba(0,0,0,0.15)' : 'none',
                                transform: theme === t.id ? 'translateY(-2px)' : 'none'
                            }}
                        >
                            {theme === t.id && (
                                <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--accent)', color: 'white', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderBottomLeftRadius: 8 }}>
                                    ACTIVE
                                </div>
                            )}

                            <t.icon size={28} color={t.textColor || 'var(--text)'} style={{ marginBottom: 12 }} />

                            <h3 style={{ fontSize: 15, fontWeight: 700, color: t.textColor || 'var(--text)', marginBottom: 4 }}>
                                {t.name}
                            </h3>
                            <p style={{ fontSize: 12, color: t.textColor ? t.textColor + '99' : 'var(--text-dim)' }}>
                                {t.id === 'system' ? 'Follows device setting' : `Custom ${t.name.split(' ')[1] || t.name} UI`}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
