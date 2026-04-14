import React, { useState } from 'react';
import { 
  ChevronRight, ChevronLeft, Send, 
  Briefcase, Target, Layers, DollarSign, AlertCircle, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, title: 'Basics', icon: Briefcase },
  { id: 2, title: 'Context', icon: Target },
  { id: 3, title: 'Technical', icon: Layers },
  { id: 4, title: 'Commercial', icon: DollarSign },
  { id: 5, title: 'Constraints', icon: AlertCircle },
];

const SoWForm = ({ onSubmit, loading }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    client_email: '',
    project_start_date: '',
    project_description: '',
    business_goals: '',
    user_personas: '',
    tech_stack: 'Next.js, Node.js, Supabase, TailwindCSS',
    core_modules: '',
    estimated_budget: '',
    tentative_timeline: '',
    payment_terms: '20% Advance, 30% After MVP, 50% Final Delivery',
    assumptions: 'Client provides all assets and API documentation.',
    out_of_scope: 'Mobile application development, SEO services.',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const validate = () => {
    if (!formData.project_name.trim()) return 'Project Name is required';
    if (!formData.client_name.trim()) return 'Client Name is required';
    if (!formData.client_email.trim()) return 'Client Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) return 'Invalid Client Email format';
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      setCurrentStep(1); // Jump to Basics step where these fields are
      return;
    }
    onSubmit(formData);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="animate-fade-in sow-space-y-4">
            <div className="form-group">
              <label className="form-label">Project Name <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="text" name="project_name" className="form-input" placeholder="e.g. E-Commerce Platform" value={formData.project_name} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Client Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="text" name="client_name" className="form-input" placeholder="e.g. Acme Corp" value={formData.client_name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Client Email <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="email" name="client_email" className="form-input" placeholder="client@example.com" value={formData.client_email} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Est. Start Date</label>
              <input type="date" name="project_start_date" className="form-input" value={formData.project_start_date} onChange={handleChange} />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="animate-fade-in sow-space-y-4">
            <div className="form-group">
              <label className="form-label">Project Description</label>
              <textarea name="project_description" className="form-input" rows="4" placeholder="Briefly describe what we are building..." value={formData.project_description} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Business Goals</label>
              <textarea name="business_goals" className="form-input" rows="3" placeholder="What does the client want to achieve?" value={formData.business_goals} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">User Personas</label>
              <input type="text" name="user_personas" className="form-input" placeholder="e.g. Admins, Customers, Vendors" value={formData.user_personas} onChange={handleChange} />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="animate-fade-in sow-space-y-4">
            <div className="form-group">
              <label className="form-label">Primary Tech Stack</label>
              <input type="text" name="tech_stack" className="form-input" value={formData.tech_stack} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Core Modules (One per line)</label>
              <textarea name="core_modules" className="form-input" rows="5" placeholder="User Auth\nProduct Listing\nPayment Integration" value={formData.core_modules} onChange={handleChange} />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="animate-fade-in sow-space-y-4">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Estimated Budget</label>
                <input type="text" name="estimated_budget" className="form-input" placeholder="$5,000 - $10,000" value={formData.estimated_budget} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Tentative Timeline</label>
                <input type="text" name="tentative_timeline" className="form-input" placeholder="8-12 Weeks" value={formData.tentative_timeline} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <textarea name="payment_terms" className="form-input" rows="3" value={formData.payment_terms} onChange={handleChange} />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="animate-fade-in sow-space-y-4">
            <div className="form-group">
              <label className="form-label">Assumptions</label>
              <textarea name="assumptions" className="form-input" rows="3" value={formData.assumptions} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Out of Scope</label>
              <textarea name="out_of_scope" className="form-input" rows="3" value={formData.out_of_scope} onChange={handleChange} />
            </div>
            <div className="sow-note-info" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Sparkles size={20} className="sow-text-accent" />
              <p style={{ fontSize: '13px' }}>AI will use this data to generate a professional 14-section SoW and detailed Task Lists.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="sow-form-container glass-card" style={{ padding: '24px', maxWidth: '700px', margin: '0 auto' }}>
      {/* Progress Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '15px', left: 0, right: 0, height: '2px', background: 'var(--border)', zIndex: 0 }} />
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          return (
            <div key={step.id} style={{ zIndex: 1, textAlign: 'center', cursor: 'pointer' }} onClick={() => setCurrentStep(step.id)}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', 
                background: isActive ? 'var(--accent)' : isCompleted ? 'var(--success)' : 'var(--bg)',
                border: '2px solid', borderColor: isActive ? 'var(--accent)' : isCompleted ? 'var(--success)' : 'var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 8px', color: (isActive || isCompleted) ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.3s'
              }}>
                {isCompleted ? <Briefcase size={16} /> : <Icon size={16} />}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: isActive ? 'var(--accent-light)' : 'var(--text-muted)' }}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ minHeight: '320px' }}>
          {renderStepContent()}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <button type="button" className="btn btn-ghost" onClick={prevStep} disabled={currentStep === 1 || loading}>
            <ChevronLeft size={18} /> Previous
          </button>
          
          {currentStep < 5 ? (
            <button type="button" className="btn btn-primary" onClick={nextStep} disabled={loading}>
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <><span className="spinner" style={{ width: 14, height: 14, marginRight: 8 }} /> Generating...</>
              ) : (
                <><Send size={18} style={{ marginRight: 8 }} /> Generate SoW & Tasks</>
              )}
            </button>
          )}
        </div>
      </form>

      <style>{`
        .sow-form-container .sow-space-y-4 > * + * { margin-top: 1rem; }
        .sow-form-container .sow-note-info { background: var(--info-bg); border-left: 4px solid var(--info); padding: 12px; border-radius: 4px; color: var(--info); }
        .sow-form-container .sow-text-accent { color: var(--accent-light); }
      `}</style>
    </div>
  );
};

export default SoWForm;
