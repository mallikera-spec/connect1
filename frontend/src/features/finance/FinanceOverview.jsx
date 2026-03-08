import React from 'react';
import { CircleDollarSign, Clock } from 'lucide-react';

export default function FinanceOverview() {
    return (
        <div className="page-header" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ padding: '40px', background: 'var(--accent-transparent)', borderRadius: '24px', border: '1px solid var(--accent-light)', textAlign: 'center', maxWidth: '500px' }}>
                <CircleDollarSign size={64} style={{ color: 'var(--accent)', marginBottom: '24px', opacity: 0.8 }} />
                <h1 style={{ fontSize: '32px', marginBottom: '16px', fontWeight: 800 }}>Finance Module</h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Clock size={20} />
                    <span>Coming Soon</span>
                </p>
                <div style={{ marginTop: '32px', fontSize: '14px', color: 'var(--text-muted)' }}>
                    This section will provide comprehensive financial analytics, budget tracking, and revenue forecasting.
                </div>
            </div>

            <style>{`
                .page-header { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
