import React, { useState } from 'react';
import api from '../../lib/api';
import {
    FileText, Download, ChevronRight, ChevronLeft, Sparkles,
    Check, X, Plus, Eye, Edit3, Loader2, RefreshCw
} from 'lucide-react';
import './Quotation.css';

// ── Wizard Steps ─────────────────────────────────────────────────
const STEPS = [
    { id: 1, icon: '🏢', title: "Client Company", field: 'clientName', type: 'text', question: "What is your client's company name?", hint: "Name as it appears in the proposal", placeholder: 'e.g. TechNova Solutions Pvt. Ltd.' },
    { id: 2, icon: '🌐', title: "Industry", field: 'industry', type: 'select-custom', question: "Which industry does your client operate in?", hint: "Select a sector or type your own", options: ['Healthcare', 'Retail & E-commerce', 'Finance & Banking', 'Education & EdTech', 'Logistics & Supply Chain', 'Real Estate', 'Manufacturing', 'Food & Restaurant', 'Travel & Hospitality', 'Legal & Compliance', 'HR & Recruitment', 'Other'] },
    { id: 3, icon: '💡', title: "Solution Type", field: 'projectType', type: 'multi-cards', question: "What type of solution are they looking for?", hint: "Select all that apply — you can also type a custom one below", options: [{ label: 'Mobile App', icon: '📱', desc: 'iOS/Android/Cross-platform' }, { label: 'Website / Web App', icon: '🌐', desc: 'Landing page to full SaaS' }, { label: 'AI Solution', icon: '🤖', desc: 'Automation, chatbots, ML' }, { label: 'Process Automation', icon: '⚙️', desc: 'Workflow, RPA, integrations' }, { label: 'ERP / CRM System', icon: '🗂️', desc: 'Enterprise resource management' }, { label: 'Custom Software', icon: '💻', desc: 'Tailor-fit business software' }] },
    { id: 4, icon: '🎯', title: "Problem Statement", field: 'problemStatement', type: 'textarea', question: "What problem is the client trying to solve?", hint: "Summarise the pain point from your discussion", placeholder: 'e.g. They manage inventory on Excel sheets, causing stock-out issues across 3 warehouses...' },
    { id: 5, icon: '✨', title: "Key Features", field: 'keyFeatures', type: 'tags', question: "What are the key features they discussed?", hint: "Press Enter after each feature to add it", placeholder: 'Type a feature and press Enter...' },
    { id: 6, icon: '👥', title: "Target Users", field: 'targetAudience', type: 'textarea', question: "Who are the primary users of this system?", hint: "Describe end-users and their roles", placeholder: 'e.g. ~50 warehouse staff, 5 managers, 3 super admins. Staff are non-technical...' },
    { id: 7, icon: '💰', title: "Budget & Timeline", field: ['budget', 'timeline'], type: 'dual', question: "What is their budget & expected timeline?", hint: "Rough figures help the AI calibrate", placeholders: ['e.g. 8,00,000 INR', 'e.g. 4 months'] },
    { id: 8, icon: '⚙️', title: "Settings", field: ['provider', 'style'], type: 'selection', question: "Choose document style", hint: "This controls the visual theme of your final quotation", options: [{ value: 'template1', label: 'Template 1', desc: 'Consulting / Enterprise Style' }, { value: 'template2', label: 'Template 2', desc: 'Standard Corporate Style' }, { value: 'template3', label: 'Template 3', desc: 'Features Explained Style' }] },
];

function TagInput({ value = [], onChange, placeholder }) {
    const [inputVal, setInputVal] = useState('');
    const addTag = () => {
        const tag = inputVal.trim();
        if (tag && !value.includes(tag)) onChange([...value, tag]);
        setInputVal('');
    };
    const removeTag = (tag) => onChange(value.filter(t => t !== tag));
    const onKeyDown = (e) => { if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); addTag(); } };
    return (
        <div className="q-tag-input-wrapper">
            <div className="q-tags-container">
                {value.map(tag => (
                    <span key={tag} className="q-tag-chip">{tag}
                        <button type="button" onClick={() => removeTag(tag)} className="q-tag-remove"><X size={11} /></button>
                    </span>
                ))}
                <input className="q-tag-input" value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={onKeyDown} placeholder={value.length === 0 ? placeholder : 'Add more...'} />
            </div>
            {inputVal.trim() && <button type="button" className="q-tag-add-btn" onClick={addTag}><Plus size={13} />Add</button>}
        </div>
    );
}

function EditableBullets({ items, onChange }) {
    const safeItems = Array.isArray(items) ? items : [];
    const update = (i, val) => { const arr = [...safeItems]; arr[i] = val; onChange(arr); };
    const remove = (i) => onChange(safeItems.filter((_, idx) => idx !== i));
    const add = () => onChange([...safeItems, '']);
    return (
        <div className="q-edit-bullets">
            {safeItems.map((item, i) => (
                <div key={i} className="q-edit-bullet-row">
                    <span className="q-bullet-chevron">›</span>
                    <input className="q-edit-bullet-input" value={item} onChange={e => update(i, e.target.value)} />
                    <button className="q-edit-bullet-remove" onClick={() => remove(i)}><X size={11} /></button>
                </div>
            ))}
            <button className="q-edit-bullet-add" onClick={add}><Plus size={13} /> Add point</button>
        </div>
    );
}

function PreviewPanel({ formData, currentStep, previewData, setPreviewData, isGeneratingPreview, isGeneratingFinal, onGeneratePreview, onFinalize, error, previewError }) {
    const doneStepIndices = new Set(STEPS.map((_, i) => i).filter(i => i < currentStep));
    const completion = Math.round((currentStep / STEPS.length) * 100);

    const updateField = (field, value) => {
        setPreviewData(prev => ({ ...prev, [field]: value }));
    };
    const updateFeature = (fi, key, value) => {
        const features = [...(previewData.features || [])];
        features[fi] = { ...features[fi], [key]: value };
        setPreviewData(prev => ({ ...prev, features }));
    };

    if (!previewData && !isGeneratingPreview) {
        return (
            <div className="q-preview-panel">
                <div className="q-preview-header">
                    <Eye size={18} /> <span>Quotation Preview</span>
                </div>
                <div className="q-preview-empty">
                    <div className="q-preview-progress-ring">
                        <svg width="90" height="90" viewBox="0 0 90 90">
                            <circle cx="45" cy="45" r="38" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                            <circle cx="45" cy="45" r="38" fill="none" stroke="#1a1a2e" strokeWidth="8"
                                strokeDasharray={`${2 * Math.PI * 38 * completion / 100} ${2 * Math.PI * 38}`}
                                strokeLinecap="round" transform="rotate(-90 45 45)" style={{ transition: 'stroke-dasharray 0.4s' }} />
                        </svg>
                        <span className="q-ring-label">{completion}%</span>
                    </div>
                    <p className="q-preview-empty-title">Wizard {completion}% complete</p>
                    <div className="q-preview-checklist">
                        {STEPS.map((s, i) => {
                            const done = doneStepIndices.has(i);
                            return (
                                <div key={s.id} className={`q-checklist-row ${done ? 'done' : i === currentStep ? 'active-step' : ''}`}>
                                    {done ? <Check size={13} /> : <span className="q-c-dot">{s.id}</span>}
                                    <span>{s.icon} {s.title}</span>
                                </div>
                            );
                        })}
                    </div>
                    {previewError && (
                        <div className="q-preview-error" style={{ margin: '15px 0', width: '100%', maxWidth: '280px' }}>
                            <X size={14} /> {previewError}
                        </div>
                    )}
                    <p className="q-preview-hint">Complete all steps and click<br /><strong>"Generate Preview"</strong> to see the AI draft</p>
                </div>
            </div>
        );
    }

    if (isGeneratingPreview) {
        return (
            <div className="q-preview-panel">
                <div className="q-preview-header"><Sparkles size={18} /> <span>Generating Draft…</span></div>
                <div className="q-preview-loading">
                    <div className="q-ai-pulse"><Sparkles size={36} /></div>
                    <p>AI is crafting your proposal for<br /><strong>{formData.projectName || formData.clientName || formData.industry}</strong></p>
                    <div className="q-loading-dots"><span /><span /><span /></div>
                </div>
            </div>
        );
    }

    return (
        <div className="q-preview-panel">
            <div className="q-preview-header">
                <Edit3 size={16} /> <span>Edit & Review Draft</span>
                <button className="q-regen-btn" onClick={onGeneratePreview} title="Regenerate"><RefreshCw size={14} /></button>
            </div>

            <div className="q-preview-content">
                {previewError && <div className="q-preview-error">{previewError}</div>}

                <div className="q-preview-section">
                    <div className="q-preview-section-label">🏗️ Project Name</div>
                    <input className="q-edit-project-name-input"
                        style={{ width: '100%', padding: '10px', fontSize: '18px', fontWeight: '800', border: '2px solid #e5e7eb', borderRadius: '8px', marginBottom: '16px', color: '#1a1a2e', background: 'white' }}
                        value={previewData.projectName || ''}
                        onChange={e => updateField('projectName', e.target.value)}
                        placeholder="Catchy Project Title" />
                </div>

                {previewData.overview && (
                    <div className="q-preview-section">
                        <div className="q-preview-section-label">📋 Executive Overview</div>
                        <EditableBullets items={previewData.overview || []} onChange={v => updateField('overview', v)} />
                    </div>
                )}

                {previewData.introduction && (
                    <div className="q-preview-section">
                        <div className="q-preview-section-label">📋 Project Introduction</div>
                        <textarea style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #e5e7eb', borderRadius: '4px', height: '80px', fontFamily: 'inherit' }}
                            value={previewData.introduction || ''} onChange={e => updateField('introduction', e.target.value)} />
                    </div>
                )}

                {previewData.scope && (
                    <div className="q-preview-section">
                        <div className="q-preview-section-label">🔭 Technical Scope</div>
                        <EditableBullets items={previewData.scope || []} onChange={v => updateField('scope', v)} />
                    </div>
                )}

                {previewData.deliveryScope && (
                    <div className="q-preview-section">
                        <div className="q-preview-section-label">🔭 Delivery Scope</div>
                        <EditableBullets items={previewData.deliveryScope || []} onChange={v => updateField('deliveryScope', v)} />
                    </div>
                )}

                {previewData.features && (
                    <div className="q-preview-section">
                        <div className="q-preview-section-label">⚙️ Feature Modules</div>
                        {(previewData.features || []).map((f, fi) => (
                            <div key={fi} className="q-preview-feature">
                                <input className="q-feature-name-input" value={f.module || ''} onChange={e => updateFeature(fi, 'module', e.target.value)} placeholder="Module name" />
                                <EditableBullets items={f.items || []} onChange={v => updateFeature(fi, 'items', v)} />
                            </div>
                        ))}
                    </div>
                )}

                {previewData.keyModules && (
                    <div className="q-preview-section">
                        <div className="q-preview-section-label">⚙️ Key Modules</div>
                        {(previewData.keyModules || []).map((mod, mi) => (
                            <div key={mi} className="q-preview-feature" style={{ marginBottom: '15px', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                                <input className="q-feature-name-input" style={{ width: '100%', marginBottom: '5px', fontWeight: 'bold' }} value={mod.title || ''} onChange={e => { const arr = [...previewData.keyModules]; arr[mi] = { ...arr[mi], title: e.target.value }; updateField('keyModules', arr); }} placeholder="Module Title" />
                                <input style={{ width: '100%', marginBottom: '10px', padding: '6px', border: '1px solid #eee' }} value={mod.description || ''} onChange={e => { const arr = [...previewData.keyModules]; arr[mi] = { ...arr[mi], description: e.target.value }; updateField('keyModules', arr); }} placeholder="Description" />
                                <EditableBullets items={mod.features || []} onChange={v => { const arr = [...previewData.keyModules]; arr[mi] = { ...arr[mi], features: v }; updateField('keyModules', arr); }} />
                            </div>
                        ))}
                    </div>
                )}

                <div className="q-preview-section">
                    <div className="q-preview-section-label">🛠 Tech Stack</div>
                    {Array.isArray(previewData.techStack) ? (
                        <EditableBullets items={previewData.techStack || []} onChange={v => updateField('techStack', v)} />
                    ) : (previewData.techStack && typeof previewData.techStack === 'object') ? (
                        Object.entries(previewData.techStack).map(([domain, tools]) => (
                            <div key={domain} style={{ marginBottom: '15px' }}>
                                <strong style={{ textTransform: 'uppercase', fontSize: '12px', color: '#666' }}>{domain}</strong>
                                <EditableBullets items={tools || []} onChange={v => { const ts = { ...previewData.techStack }; ts[domain] = v; updateField('techStack', ts); }} />
                            </div>
                        ))
                    ) : null}
                </div>

                {previewData.proposedTeam && (
                    <div className="q-preview-section">
                        <div className="q-preview-section-label">👥 Proposed Team</div>
                        {(previewData.proposedTeam || []).map((t, ti) => (
                            <div key={ti} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} value={t.role || ''} onChange={e => { const pt = [...previewData.proposedTeam]; pt[ti] = { ...pt[ti], role: e.target.value }; updateField('proposedTeam', pt); }} placeholder="Role (e.g. Backend Dev)" />
                                <input style={{ width: '80px', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} value={t.count || ''} onChange={e => { const pt = [...previewData.proposedTeam]; pt[ti] = { ...pt[ti], count: e.target.value }; updateField('proposedTeam', pt); }} placeholder="Count" type="number" />
                            </div>
                        ))}
                    </div>
                )}

                <div className="q-preview-section">
                    <div className="q-preview-section-label">📅 Timeline</div>
                    {(previewData.timeline || []).map((t, ti) => (
                        <div key={ti} className="q-preview-timeline-item">
                            <div className="q-timeline-phase-row">
                                <input className="q-timeline-phase-input" value={t.phase || ''} onChange={e => { const tl = [...(previewData.timeline || [])]; tl[ti] = { ...tl[ti], phase: e.target.value }; updateField('timeline', tl); }} placeholder="Phase name" />
                                <input className="q-timeline-dur-input" value={t.duration || ''} onChange={e => { const tl = [...(previewData.timeline || [])]; tl[ti] = { ...tl[ti], duration: e.target.value }; updateField('timeline', tl); }} placeholder="Duration" />
                            </div>
                            {t.tasks !== undefined ? (
                                <EditableBullets items={t.tasks || []} onChange={v => { const tl = [...(previewData.timeline || [])]; tl[ti] = { ...tl[ti], tasks: v }; updateField('timeline', tl); }} />
                            ) : (
                                <input style={{ width: '100%', marginTop: '5px', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} value={t.deliverables || ''} onChange={e => { const tl = [...(previewData.timeline || [])]; tl[ti] = { ...tl[ti], deliverables: e.target.value }; updateField('timeline', tl); }} placeholder="Key Deliverables" />
                            )}
                        </div>
                    ))}
                </div>

                {previewData.commercialEstimate && (
                    <div className="q-preview-section">
                        <div className="q-preview-section-label">💰 Investment</div>
                        <input className="q-edit-commercial-input" value={previewData.commercialEstimate || ''} onChange={e => updateField('commercialEstimate', e.target.value)} placeholder="e.g. ₹8,00,000 – ₹12,00,000 INR" />
                        <EditableBullets items={previewData.paymentPlan || []} onChange={v => updateField('paymentPlan', v)} />
                    </div>
                )}

                {previewData.costEstimation && (
                    <div className="q-preview-section">
                        <div className="q-preview-section-label">💰 Cost Estimation</div>
                        <input className="q-edit-commercial-input" value={previewData.costEstimation.totalCost || ''} onChange={e => updateField('costEstimation', { ...previewData.costEstimation, totalCost: e.target.value })} placeholder="e.g. ₹8,00,000" />
                        <div style={{ marginTop: '15px', fontSize: '13px', fontWeight: '600' }}>Payment Milestones</div>
                        {(previewData.costEstimation.paymentPlan || []).map((p, pi) => (
                            <div key={pi} style={{ display: 'flex', gap: '6px', marginBottom: '8px', marginTop: '6px' }}>
                                <input style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} value={p.milestone || ''} onChange={e => { const pp = [...previewData.costEstimation.paymentPlan]; pp[pi] = { ...pp[pi], milestone: e.target.value }; updateField('costEstimation', { ...previewData.costEstimation, paymentPlan: pp }); }} placeholder="Milestone Name" />
                                <input style={{ width: '70px', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} value={p.percentage || ''} onChange={e => { const pp = [...previewData.costEstimation.paymentPlan]; pp[pi] = { ...pp[pi], percentage: e.target.value }; updateField('costEstimation', { ...previewData.costEstimation, paymentPlan: pp }); }} placeholder="20%" />
                                <input style={{ width: '100px', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} value={p.amount || ''} onChange={e => { const pp = [...previewData.costEstimation.paymentPlan]; pp[pi] = { ...pp[pi], amount: e.target.value }; updateField('costEstimation', { ...previewData.costEstimation, paymentPlan: pp }); }} placeholder="Amount" />
                            </div>
                        ))}
                    </div>
                )}

                {previewData.sla && (
                    <div className="q-preview-section">
                        <div className="q-preview-section-label">🛟 Service Level Agreement</div>
                        <input style={{ width: '100%', marginBottom: '8px', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} value={previewData.sla.maintenanceCoverage || ''} onChange={e => updateField('sla', { ...previewData.sla, maintenanceCoverage: e.target.value })} placeholder="Maintenance Coverage" />
                        <div style={{ fontWeight: '600', fontSize: '12px', marginTop: '10px' }}>Response Times</div>
                        <EditableBullets items={previewData.sla.responseTimes || []} onChange={v => updateField('sla', { ...previewData.sla, responseTimes: v })} />
                        <div style={{ fontWeight: '600', fontSize: '12px', marginTop: '10px' }}>Resolution Times</div>
                        <EditableBullets items={previewData.sla.resolutionTimes || []} onChange={v => updateField('sla', { ...previewData.sla, resolutionTimes: v })} />
                    </div>
                )}

                {['amc', 'warranty', 'legal', 'changeRequest'].map(key => previewData[key] !== undefined && (
                    <div key={key} className="q-preview-section">
                        <div className="q-preview-section-label" style={{ textTransform: 'capitalize' }}>⚖️ {key.replace(/([A-Z])/g, ' $1')}</div>
                        <textarea style={{ width: '100%', padding: '10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '4px', height: '80px', fontFamily: 'inherit' }}
                            value={previewData[key] || ''} onChange={e => updateField(key, e.target.value)} />
                    </div>
                ))}
            </div>

            <div className="q-preview-action-bar">
                <div className="q-preview-action-note">
                    ✏️ All fields are editable above. When satisfied, generate the final documents.
                </div>
                {error && <div className="q-preview-error" style={{ marginBottom: 10 }}>{error}</div>}
                <button className="q-finalize-btn" onClick={onFinalize} disabled={isGeneratingFinal}>
                    {isGeneratingFinal
                        ? <><Loader2 size={18} className="q-spin" /> Generating Documents…</>
                        : <><FileText size={18} /> Generate Final PDF + Word</>}
                </button>
            </div>
        </div >
    );
}

export default function QuotationPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState('forward');
    const [animating, setAnimating] = useState(false);

    const [formData, setFormData] = useState({
        clientName: '', industry: '', projectType: [],
        problemStatement: '', keyFeatures: [], targetAudience: '',
        budget: '', timeline: '', provider: 'openai', style: 'template1',
    });

    const [previewData, setPreviewData] = useState(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
    const [isGeneratingFinal, setIsGeneratingFinal] = useState(false);
    const [finalDocs, setFinalDocs] = useState(null);
    const [error, setError] = useState('');
    const [previewError, setPreviewError] = useState('');

    const step = STEPS[currentStep];
    const progress = ((currentStep + 1) / STEPS.length) * 100;

    const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const isStepValid = () => {
        const s = STEPS[currentStep];
        if (s.type === 'tags') return formData[s.field].length > 0;
        if (s.type === 'multi-cards') return (formData[s.field] || []).length > 0;
        if (s.type === 'dual') return formData[s.field[0]]?.trim() && formData[s.field[1]]?.trim();
        if (Array.isArray(s.field)) return true;
        return formData[s.field]?.toString().trim().length > 0;
    };

    const navigate = (dir) => {
        if (animating) return;
        setDirection(dir);
        setAnimating(true);
        setTimeout(() => {
            if (dir === 'forward') setCurrentStep(s => s + 1);
            else setCurrentStep(s => s - 1);
            setAnimating(false);
        }, 200);
    };

    const triggerDownload = (base64, mimeType, filename) => {
        try {
            const clean = base64.replace(/\s/g, '');
            const bin = atob(clean);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            const blob = new Blob([bytes], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        } catch (e) {
            try { window.open(`data:${mimeType};base64,${base64.replace(/\s/g, '')}`, '_blank'); }
            catch { alert('Download failed.'); }
        }
    };

    const handleGeneratePreview = async () => {
        setIsGeneratingPreview(true);
        setPreviewError('');
        setPreviewData(null);
        try {
            const res = await api.post('/quotations/preview', formData);
            if (res.data.success) {
                setPreviewData(res.data.data);
            } else {
                setPreviewError('Failed to generate preview. Try again.');
            }
        } catch (err) {
            setPreviewError(err.message || 'Preview generation failed.');
        } finally {
            setIsGeneratingPreview(false);
        }
    };

    const handleFinalize = async () => {
        setIsGeneratingFinal(true);
        setError('');
        try {
            const res = await api.post('/quotations/finalize', {
                quotationData: previewData,
                style: formData.style,
            });
            if (res.data.success) {
                setFinalDocs(res.data.data);
                const safeName = (previewData?.projectName || formData.clientName || formData.industry || 'Quotation').replace(/\s+/g, '_');
                if (res.data.data.pdfBase64) {
                    triggerDownload(res.data.data.pdfBase64, 'application/pdf', `Proposal_${safeName}.pdf`);
                }
            } else {
                setError('Document generation failed. Please try again.');
            }
        } catch (err) {
            setError(err.message || 'Something went wrong. Is the backend running?');
        } finally {
            setIsGeneratingFinal(false);
        }
    };

    const handleReset = () => {
        setPreviewData(null); setFinalDocs(null); setError('');
        setPreviewError(''); setCurrentStep(0);
        setFormData({ clientName: '', industry: '', projectType: [], problemStatement: '', keyFeatures: [], targetAudience: '', budget: '', timeline: '', provider: 'openai', style: 'template1' });
    };

    if (finalDocs) {
        const safeName = (previewData?.projectName || formData.clientName || formData.industry || 'Quotation').replace(/\s+/g, '_');
        return (
            <div className="q-done-screen">
                <div className="q-done-card">
                    <div className="q-done-icon">✅</div>
                    <h2>{previewData?.projectName || 'Documents Ready!'}</h2>
                    <p>Proposal for <strong>{formData.clientName || formData.industry}</strong> is ready for review.</p>
                    <p className="q-done-sub">PDF was auto-downloaded. Use buttons below to re-download.</p>
                    <div className="q-done-buttons">
                        <button className="q-done-btn" onClick={() => triggerDownload(finalDocs.pdfBase64, 'application/pdf', `Proposal_${safeName}.pdf`)}>
                            <Download size={16} /> Download PDF
                        </button>
                        <button className="q-done-btn word" onClick={() => triggerDownload(finalDocs.docxBase64, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', `Proposal_${safeName}.docx`)}>
                            <FileText size={16} /> Download Word
                        </button>
                        <button className="q-done-btn edit" onClick={() => setFinalDocs(null)}>
                            <Edit3 size={16} /> Edit Preview
                        </button>
                        <button className="q-done-btn reset" onClick={handleReset}>
                            ↩ New Quotation
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="q-split-layout">
            <div className="q-left-panel">
                <div className="q-left-header">
                    <div className="q-brand-logo">A</div>
                    <div>
                        <div className="q-brand-name">Argosmob Tech &amp; AI</div>
                        <div className="q-brand-sub">Sales Intake Wizard</div>
                    </div>
                </div>

                <div className="q-wizard-progress">
                    <div className="q-progress-dots-row">
                        {STEPS.map((s, i) => (
                            <div key={s.id} className={`q-pdot ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}`}>
                                {i < currentStep ? <Check size={9} /> : s.id}
                            </div>
                        ))}
                    </div>
                    <div className="q-progress-track"><div className="q-progress-fill" style={{ width: `${progress}%` }} /></div>
                    <div className="q-progress-label">Step {currentStep + 1} / {STEPS.length}</div>
                </div>

                <div className={`q-step-card ${animating ? (direction === 'forward' ? 'exit-left' : 'exit-right') : 'enter'}`}>
                    <div className="q-step-icon-large">{step.icon}</div>
                    <div className="q-step-tag">Step {step.id} — {step.title}</div>
                    <h2 className="q-step-question">{step.question}</h2>
                    <p className="q-step-hint">{step.hint}</p>

                    <div className="q-step-input-area">
                        {step.type === 'text' && (
                            <input autoFocus className="q-wi" type="text" value={formData[step.field]} onChange={e => updateField(step.field, e.target.value)} placeholder={step.placeholder} onKeyDown={e => e.key === 'Enter' && isStepValid() && navigate('forward')} />
                        )}
                        {step.type === 'textarea' && (
                            <textarea autoFocus className="q-wa" value={formData[step.field]} onChange={e => updateField(step.field, e.target.value)} placeholder={step.placeholder} rows={4} />
                        )}
                        {step.type === 'select-custom' && (
                            <div>
                                <div className="q-chip-grid">{step.options.map(opt => (
                                    <button key={opt} type="button" className={`q-chip ${formData[step.field] === opt ? 'sel' : ''}`} onClick={() => updateField(step.field, opt === 'Other' ? '' : opt)}>{opt}</button>
                                ))}</div>
                                <input className="q-wi" style={{ marginTop: 14 }} placeholder="Or type a custom industry…" value={step.options.includes(formData[step.field]) ? '' : formData[step.field]} onChange={e => updateField(step.field, e.target.value)} />
                            </div>
                        )}
                        {step.type === 'multi-cards' && (() => {
                            const selected = formData[step.field] || [];
                            const toggle = (label) => {
                                const next = selected.includes(label) ? selected.filter(v => v !== label) : [...selected, label];
                                updateField(step.field, next);
                            };
                            const presetLabels = step.options.map(o => o.label);
                            const customVal = selected.filter(v => !presetLabels.includes(v)).join(', ');
                            const setCustom = (raw) => {
                                const customs = raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
                                const presets = selected.filter(v => presetLabels.includes(v));
                                updateField(step.field, [...presets, ...customs]);
                            };
                            return (
                                <div>
                                    <div className="q-rcard-grid">
                                        {step.options.map(opt => (
                                            <button key={opt.label} type="button" className={`q-rcard ${selected.includes(opt.label) ? 'sel' : ''}`} onClick={() => toggle(opt.label)}>
                                                {selected.includes(opt.label) && <span className="q-rcard-check">✓</span>}
                                                <span className="q-rcard-icon">{opt.icon}</span>
                                                <span className="q-rcard-label">{opt.label}</span>
                                                <span className="q-rcard-desc">{opt.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: 16 }}>
                                        <label className="q-sel-label" style={{ marginBottom: 6 }}>Or describe a custom solution</label>
                                        <input className="q-wi" placeholder="e.g. IoT Dashboard, Marketplace Platform…" value={customVal} onChange={e => setCustom(e.target.value)} />
                                    </div>
                                    {selected.length > 0 && (
                                        <div className="q-multi-selected-tags">
                                            {selected.map(v => (
                                                <span key={v} className="q-ms-tag">
                                                    {v}
                                                    <button type="button" onClick={() => updateField(step.field, selected.filter(x => x !== v))}><X size={10} /></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                        {step.type === 'tags' && <TagInput value={formData[step.field]} onChange={v => updateField(step.field, v)} placeholder={step.placeholder} />}
                        {step.type === 'dual' && (
                            <div className="q-dual-row">
                                <div className="q-form-group"><label>Budget (INR)</label><input className="q-wi" value={formData[step.field[0]]} onChange={e => updateField(step.field[0], e.target.value)} placeholder={step.placeholders[0]} /></div>
                                <div className="q-form-group"><label>Timeline</label><input className="q-wi" value={formData[step.field[1]]} onChange={e => updateField(step.field[1], e.target.value)} placeholder={step.placeholders[1]} /></div>
                            </div>
                        )}
                        {step.type === 'selection' && (
                            <div className="q-scard-row">{step.options.map(o => (
                                <button key={o.value} type="button" className={`q-scard ${formData.style === o.value ? 'sel' : ''}`} onClick={() => updateField('style', o.value)}>
                                    <span className="q-scard-label">{o.label}</span><span className="q-scard-desc">{o.desc}</span>
                                </button>
                            ))}</div>
                        )}
                    </div>

                    <div className="q-step-nav">
                        {currentStep > 0 && <button type="button" className="q-btn-back" onClick={() => navigate('back')}><ChevronLeft size={16} />Back</button>}
                        <div style={{ flex: 1 }} />
                        {currentStep < STEPS.length - 1 ? (
                            <button type="button" className="q-btn-next" disabled={!isStepValid()} onClick={() => navigate('forward')}>Next<ChevronRight size={16} /></button>
                        ) : (
                            <button type="button" className="q-btn-preview" disabled={isGeneratingPreview} onClick={handleGeneratePreview}>
                                {isGeneratingPreview ? <Loader2 size={16} className="q-spin" /> : <Eye size={16} />} Generate Preview
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <PreviewPanel
                formData={formData}
                currentStep={currentStep}
                previewData={previewData}
                setPreviewData={setPreviewData}
                isGeneratingPreview={isGeneratingPreview}
                isGeneratingFinal={isGeneratingFinal}
                onGeneratePreview={handleGeneratePreview}
                onFinalize={handleFinalize}
                error={error}
                previewError={previewError}
            />
        </div>
    );
}
