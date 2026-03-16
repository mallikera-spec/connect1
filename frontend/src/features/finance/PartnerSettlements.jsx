import React, { useState, useEffect } from 'react';
import { 
    Calculator, Calendar, Users, 
    ArrowRight, CheckCircle2, AlertCircle,
    Download, PieChart, TrendingUp
} from 'lucide-react';
import { financeService } from './financeService';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import { toLocalISOString } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function PartnerSettlements() {
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: toLocalISOString(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
        end: toLocalISOString(new Date())
    });
    const [settlement, setSettlement] = useState(null);

    const handleCalculate = async () => {
        try {
            setLoading(true);
            const { data, success } = await financeService.calculateSettlement(dateRange.start, dateRange.end);
            if (success) {
                setSettlement(data);
                toast.success('Settlement calculated successfully');
            }
        } catch (err) {
            toast.error('Failed to calculate settlement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settlement-container">
            <header className="page-header">
                <div>
                    <h1>Partner Settlements</h1>
                    <p>Automated profit-sharing calculator & history</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <DateRangeFilter 
                        value={dateRange} 
                        onChange={setDateRange} 
                        onApply={handleCalculate} 
                    />
                    <button className="btn-secondary">
                        <Download size={18} /> Export History
                    </button>
                </div>
            </header>

            <div className="settlement-layout">
                <div className="calculator-box card">
                    <h3><Calculator size={20} /> Settlement Calculator</h3>
                    <p className="card-desc">Select a period to calculate net profit distributions.</p>
                    
                    <div className="selected-range-display">
                        <Calendar size={16} />
                        <span>{dateRange.start} to {dateRange.end}</span>
                    </div>

                    <button className="btn-primary" onClick={handleCalculate} disabled={loading} style={{ marginTop: '20px', width: '100%' }}>
                        {loading ? 'Calculating...' : 'Calculate Share'}
                    </button>

                    <div className="logic-note">
                        <AlertCircle size={14} />
                        <span>Split logic: 4 Partners before Jan 28, 2026. 5 Partners thereafter.</span>
                    </div>
                </div>

                <div className="results-box">
                    {settlement ? (
                        <div className="results-content animate-in">
                            <div className="summary-grid">
                                <div className="result-card profit">
                                    <span className="label">Net Profit</span>
                                    <div className="value">₹{settlement.netProfit.toLocaleString()}</div>
                                </div>
                                <div className="result-card stats">
                                    <div>
                                        <span className="label">Total Income</span>
                                        <div className="sub-value">₹{settlement.totalIncome.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <span className="label">Total Expenses</span>
                                        <div className="sub-value text-red">-₹{settlement.totalExpenses.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="partner-list card">
                                <h3>Partner Distributions</h3>
                                <div className="partner-grid">
                                    {settlement.partnerSettlements.map((p, i) => (
                                        <div key={i} className="partner-share-item">
                                            <div className="p-info">
                                                <div className="p-avatar">{p.partner_name[0]}</div>
                                                <span className="p-name">{p.partner_name}</span>
                                            </div>
                                            <div className="p-amount">₹{p.share_amount.toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                                <button className="btn-success">
                                    <CheckCircle2 size={18} /> Commit Settlement
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-results card">
                            <PieChart size={64} opacity={0.3} />
                            <p>Select dates using the filter above and click calculate.</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .settlement-container { padding: 24px; animation: fadeIn 0.4s ease-out; }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
                .page-header h1 { font-size: 28px; font-weight: 800; }
                
                .settlement-layout { display: grid; grid-template-columns: 350px 1fr; gap: 24px; }
                .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; }
                .card-desc { font-size: 14px; color: var(--text-dim); margin: 8px 0 24px; }
                
                .selected-range-display { 
                    display: flex; gap: 10px; align-items: center; 
                    padding: 12px; background: rgba(255,255,255,0.03); 
                    border: 1px solid var(--border); border-radius: 8px;
                    color: var(--text); font-size: 14px; font-weight: 500;
                }

                .logic-note { display: flex; gap: 8px; align-items: center; background: #6366f115; color: #6366f1; padding: 12px; border-radius: 12px; font-size: 12px; margin-top: 24px; border: 1px solid #6366f130; }
                
                .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
                .result-card { background: var(--bg-card); border: 1px solid var(--border); padding: 20px; border-radius: var(--radius); }
                .result-card.profit { background: var(--accent); color: white; border: none; }
                .result-card .label { font-size: 13px; opacity: 0.8; margin-bottom: 8px; display: block; }
                .result-card.profit .value { font-size: 32px; font-weight: 800; }
                .sub-value { font-size: 18px; font-weight: 700; }
                .text-red { color: #ef4444; }

                .partner-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0; }
                .partner-share-item { background: var(--accent-transparent); padding: 16px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; }
                .p-info { display: flex; gap: 12px; align-items: center; }
                .p-avatar { width: 32px; height: 32px; border-radius: 8px; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
                .p-name { font-weight: 600; font-size: 14px; }
                .p-amount { font-weight: 800; color: var(--accent); }

                .empty-results { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-dim); text-align: center; gap: 16px; }
                .btn-success { width: 100%; margin-top: 12px; background: var(--success); color: white; border: none; padding: 14px; border-radius: var(--radius-sm); font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }

                .animate-in { animation: slideUp 0.4s ease-out; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
