import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, ChevronDown, Download, BarChart2, PieChart as PieChartIcon, Table as TableIcon } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, LabelList
} from 'recharts';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import DataTable from '../../components/common/DataTable';

const COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function ExecutiveBI() {
    const [messages, setMessages] = useState([
        {
            role: 'ai',
            text: "Hello! I am your Executive AI Analyst. Ask me anything about your Sales, Payroll, or Projects. For example:\n• Show me total deal value grouped by lead status.\n• Analyze top developers by completed tasks.\n• Compare expected revenue vs total payroll costs."
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const endOfMessagesRef = useRef(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleAsk = async () => {
        if (!input.trim() || isLoading) return;
        const question = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: question }]);
        setIsLoading(true);

        try {
            const res = await api.post('/reports/ai-query', { question });
            if (res.data.success) {
                setMessages(prev => [...prev, {
                    role: 'ai',
                    data: res.data.data
                }]);
            } else {
                throw new Error(res.data.message);
            }
        } catch (err) {
            console.error('AI Query Error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to analyze data';
            setMessages(prev => [...prev, {
                role: 'ai',
                isError: true,
                text: `I encountered an error while analyzing the data: ${errorMessage}. Please try rephrasing your question.`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const [showVisuals, setShowVisuals] = useState({});

    const toggleVisual = (idx) => {
        setShowVisuals(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    const renderChart = (msg, idx) => {
        const aiData = msg.data;
        const { chartType, chartData } = aiData;
        const isVisualToggled = showVisuals[idx];

        if (!chartData || chartData.length === 0) return (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '14px' }}>
                No quantitative data available for visualization.
            </div>
        );

        const firstRow = chartData[0];
        const columns = Object.keys(firstRow).map(key => ({
            label: key.replace(/_/g, ' ').toUpperCase(),
            key: key,
            sortable: true
        }));

        return (
            <div style={{ marginTop: 15, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* Always Show Table */}
                <div style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <DataTable
                        data={chartData}
                        columns={columns}
                        fileName="AI_Executive_Report"
                    />
                </div>

                {/* Optional Visualization */}
                {chartType !== 'table' && (
                    <div>
                        <button
                            onClick={() => toggleVisual(idx)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'transparent',
                                border: '1px solid var(--border)',
                                color: 'var(--text-dim)',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isVisualToggled ? <BarChart2 size={14} /> : <BarChart2 size={14} />}
                            {isVisualToggled ? 'Hide Visualization' : 'Show Visualization'}
                        </button>

                        {isVisualToggled && (
                            <div style={{ height: 350, marginTop: 15, width: '100%', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartType === 'bar' ? (
                                        <BarChart data={chartData} margin={{ top: 25, right: 30, left: 10, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                            <XAxis dataKey={Object.keys(chartData[0])[0]} axisLine={{ stroke: 'var(--border)' }} tickLine={true} tick={{ fill: 'var(--text)', fontSize: 11 }} height={50} interval={0} angle={-30} textAnchor="end" />
                                            <YAxis axisLine={{ stroke: 'var(--border)' }} tickLine={true} tick={{ fill: 'var(--text)', fontSize: 11 }} />
                                            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            {Object.keys(chartData[0]).slice(1).map((k, i) => (
                                                <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]}>
                                                    <LabelList dataKey={k} position="top" style={{ fill: 'var(--text)', fontSize: 10, fontWeight: 600 }} />
                                                </Bar>
                                            ))}
                                        </BarChart>
                                    ) : chartType === 'pie' ? (
                                        <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '30px' }} />
                                        </PieChart>
                                    ) : (
                                        <LineChart data={chartData} margin={{ top: 25, right: 30, left: 10, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                            <XAxis dataKey={Object.keys(chartData[0])[0]} axisLine={{ stroke: 'var(--border)' }} tickLine={true} tick={{ fill: 'var(--text)', fontSize: 11 }} height={50} interval={0} angle={-30} textAnchor="end" />
                                            <YAxis axisLine={{ stroke: 'var(--border)' }} tickLine={true} tick={{ fill: 'var(--text)', fontSize: 11 }} />
                                            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            {Object.keys(chartData[0]).slice(1).map((k, i) => (
                                                <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{ r: 4, fill: COLORS[i % COLORS.length] }} activeDot={{ r: 6 }}>
                                                    <LabelList dataKey={k} position="top" style={{ fill: 'var(--text)', fontSize: 10, fontWeight: 600, offset: 10 }} />
                                                </Line>
                                            ))}
                                        </LineChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 200px)',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.11)',
            margin: '0 10px 10px 10px'
        }}>
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Bot size={18} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Executive AI Analyst</h3>
                        <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Securely querying Sales, HR, and Ops data</p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', scrollBehavior: 'smooth' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        gap: '12px',
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '90%',
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                    }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: msg.role === 'user' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                            color: msg.role === 'user' ? 'var(--accent)' : '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            border: '1px solid var(--border)'
                        }}>
                            {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                        </div>
                        <div style={{
                            background: msg.role === 'user' ? 'var(--accent-gradient)' : (msg.isError ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-card)'),
                            color: msg.role === 'user' ? 'white' : (msg.isError ? '#ef4444' : 'var(--text)'),
                            padding: '12px 18px',
                            borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                            position: 'relative',
                            minWidth: 80
                        }}>
                            {msg.text && <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: 14 }}>{msg.text}</div>}
                            {msg.data && (
                                <div style={{ width: '100%', minWidth: '400px' }}>
                                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, lineHeight: 1.5, color: msg.role === 'user' ? 'white' : 'var(--text)' }}>
                                        {msg.data.summary}
                                    </div>
                                    {renderChart(msg, idx)}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                            <Bot size={18} />
                        </div>
                        <div style={{ background: 'var(--bg-card)', padding: '12px 18px', borderRadius: '18px 18px 18px 4px', border: '1px solid var(--border)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <div className="typing-dot">.</div><div className="typing-dot" style={{ animationDelay: '0.2s' }}>.</div><div className="typing-dot" style={{ animationDelay: '0.4s' }}>.</div>
                        </div>
                    </div>
                )}
                <div ref={endOfMessagesRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '12px', background: 'var(--bg)', padding: '6px 6px 6px 18px', borderRadius: '30px', border: '1px solid var(--border)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Ask a question about revenue, tasks, or payroll..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                        disabled={isLoading}
                        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: 'var(--text)' }}
                    />
                    <button
                        onClick={handleAsk}
                        disabled={isLoading || !input.trim()}
                        style={{
                            background: input.trim() ? 'var(--accent-gradient)' : 'var(--border)',
                            color: 'white', border: 'none', width: 34, height: 34, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            boxShadow: input.trim() ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none'
                        }}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>

            <style>{`
        .typing-dot { font-size: 24px; line-height: 10px; animation: bounce 1.4s infinite ease-in-out both; color: var(--accent); }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
      `}</style>
        </div>
    );
}
