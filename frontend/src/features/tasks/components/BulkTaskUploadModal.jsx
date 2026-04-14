import { useState } from 'react'
import { X, Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import Papa from 'papaparse'
import toast from 'react-hot-toast'
import api from '../../../lib/api'

export default function BulkTaskUploadModal({ 
    isOpen, 
    onClose, 
    projectId, 
    projectMembers = [], 
    onSuccess 
}) {
    const [file, setFile] = useState(null)
    const [parsedData, setParsedData] = useState([])
    const [errors, setErrors] = useState([])
    const [uploading, setUploading] = useState(false)
    const [step, setStep] = useState('upload') // upload, preview

    if (!isOpen) return null

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return
        setFile(selectedFile)
        parseFile(selectedFile)
    }

    const parseFile = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                validateAndMap(results.data)
            },
            error: (err) => {
                toast.error('Failed to parse CSV: ' + err.message)
            }
        })
    }

    const parseDate = (val) => {
        if (!val) return null
        const s = val.toString().trim()
        if (!s) return null

        // Handle YYYY-MM-DD (ISO)
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)

        // Handle DD-MM-YYYY or DD/MM/YYYY
        const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
        if (dmy) {
            const [_, d, m, y] = dmy
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
        }

        // Try native Date parser as fallback
        const d = new Date(s)
        if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0]
        }

        return null // Reject invalid formats instead of returning raw string
    }

    const validateAndMap = (data) => {
        const newErrors = []
        const mapped = data.map((row, index) => {
            const taskName = row['Task'] || row['task'] || row['Title'] || row['title']
            const description = row['Description'] || row['description'] || row['Desc'] || row['desc']
            const assignedToName = row['Assigned To'] || row['assigned_to'] || row['Assignee'] || row['assignee']
            const estHours = row['Estimated Hours'] || row['estimated_hours'] || row['Hours'] || row['hours']
            const priority = (row['Priority'] || row['priority'] || 'medium').toLowerCase()
            const dueDate = row['Due Date'] || row['due_date'] || row['Deadline'] || row['deadline']

            if (!taskName) newErrors.push(`Row ${index + 1}: Task name is mandatory`)
            if (!description) newErrors.push(`Row ${index + 1}: Description is mandatory`)

            // Map assignedToName to member ID
            let assigned_to = undefined
            if (assignedToName) {
                const member = projectMembers.find(m => 
                    m.user?.full_name?.toLowerCase().includes(assignedToName.toLowerCase()) ||
                    m.user?.email?.toLowerCase() === assignedToName.toLowerCase()
                )
                if (member) {
                    assigned_to = member.user?.id
                } else {
                    newErrors.push(`Row ${index + 1}: Assigned user "${assignedToName}" not found in project members`)
                }
            }

            return {
                project_id: projectId,
                title: taskName,
                description: description,
                assigned_to,
                estimated_hours: estHours ? parseFloat(estHours) : undefined,
                priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
                end_time: parseDate(dueDate),
                status: 'pending'
            }
        })

        setErrors(newErrors)
        setParsedData(mapped)
        setStep('preview')
    }

    const handleUpload = async () => {
        if (errors.length > 0) {
            return toast.error('Please fix errors before uploading')
        }

        setUploading(true)
        try {
            await api.post('/tasks/bulk', parsedData)
            toast.success(`${parsedData.length} tasks uploaded successfully`)
            onSuccess()
            onClose()
        } catch (err) {
            toast.error(err.message || 'Bulk upload failed')
        } finally {
            setUploading(false)
        }
    }

    const reset = () => {
        setFile(null)
        setParsedData([])
        setErrors([])
        setStep('upload')
    }

    const downloadTemplate = () => {
        const headers = ['Task', 'Description', 'Assigned To', 'Estimated Hours', 'Priority', 'Due Date']
        const sampleRows = [
            ['Implement Login UI', 'Create the login form with email and password fields', 'John Doe', '4', 'high', '2026-03-25'],
            ['Setup Database Schema', 'Define tables for users, projects and tasks', '', '8', 'medium', '']
        ]
        const csvContent = [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'task_upload_template.csv'
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <div className="modal-header">
                    <h2>Bulk Task Upload</h2>
                    <button onClick={onClose}><X size={18} /></button>
                </div>

                <div className="modal-body" style={{ minHeight: '400px' }}>
                    {step === 'upload' ? (
                        <div style={{ padding: '40px 0', textAlign: 'center' }}>
                            <div style={{ marginBottom: '24px', textAlign: 'right' }}>
                                <button className="btn btn-ghost btn-sm" onClick={downloadTemplate} style={{ gap: '6px' }}>
                                    <FileText size={14} /> Download Template
                                </button>
                            </div>
                            <div style={{ 
                                border: '2px dashed var(--border)', 
                                borderRadius: '12px', 
                                padding: '40px', 
                                background: 'rgba(255,255,255,0.02)',
                                cursor: 'pointer'
                            }} onClick={() => document.getElementById('csv-upload').click()}>
                                <input 
                                    type="file" 
                                    id="csv-upload" 
                                    accept=".csv" 
                                    hidden 
                                    onChange={handleFileChange} 
                                />
                                <Upload size={48} color="var(--accent)" style={{ marginBottom: '16px', opacity: 0.7 }} />
                                <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>Click to Upload CSV</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                                    Expected columns: Task, Description, Assigned To, Estimated Hours, Priority, Due Date
                                </p>
                                <div style={{ 
                                    display: 'inline-block', 
                                    padding: '8px 20px', 
                                    background: 'var(--accent)', 
                                    color: 'white', 
                                    borderRadius: '8px',
                                    fontWeight: 600
                                }}>
                                    Select File
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '500px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600 }}>
                                        <span style={{ color: 'var(--accent)' }}>{parsedData.length}</span> Tasks found
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 600 }}>
                                        <span style={{ color: errors.length > 0 ? 'var(--danger)' : 'var(--success)' }}>{errors.length}</span> Errors
                                    </div>
                                </div>
                                <button className="btn btn-ghost btn-sm" onClick={reset}>Change File</button>
                            </div>

                            {errors.length > 0 && (
                                <div style={{ 
                                    background: 'rgba(220, 38, 38, 0.1)', 
                                    border: '1px solid rgba(220, 38, 38, 0.2)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    marginBottom: '16px',
                                    maxHeight: '150px',
                                    overflowY: 'auto'
                                }}>
                                    <div style={{ display: 'flex', gap: '8px', color: 'var(--danger)', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                                        <AlertCircle size={16} /> Validation Errors
                                    </div>
                                    {errors.map((err, i) => (
                                        <div key={i} style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>• {err}</div>
                                    ))}
                                </div>
                            )}

                            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                                <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card-solid)', zIndex: 1, borderBottom: '1px solid var(--border)' }}>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '12px' }}>Task</th>
                                            <th style={{ textAlign: 'left', padding: '12px' }}>Assignee</th>
                                            <th style={{ textAlign: 'center', padding: '12px' }}>Hours</th>
                                            <th style={{ textAlign: 'center', padding: '12px' }}>Priority</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedData.map((row, i) => {
                                            const member = projectMembers.find(m => m.user?.id === row.assigned_to)
                                            return (
                                                <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-row">
                                                    <td style={{ padding: '12px' }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{row.title}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                                            {row.description?.slice(0, 60)}{row.description?.length > 60 ? '...' : ''}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        {member ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-glow)', color: 'var(--accent)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    {member.user?.full_name?.[0]}
                                                                </div>
                                                                <span style={{ fontWeight: 500 }}>{member.user?.full_name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="badge badge-gray">Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>{row.estimated_hours || '--'}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <span className={`badge ${row.priority === 'high' ? 'badge-red' : row.priority === 'medium' ? 'badge-yellow' : 'badge-blue'}`}>
                                                            {row.priority}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    {step === 'preview' && (
                        <button 
                            className="btn btn-primary" 
                            onClick={handleUpload} 
                            disabled={uploading || errors.length > 0}
                            style={{ gap: '8px' }}
                        >
                            {uploading ? <Loader2 className="spinner" size={16} /> : <CheckCircle size={16} />}
                            {uploading ? 'Uploading...' : `Upload ${parsedData.length} Tasks`}
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                .hover-row:hover { background: rgba(255,255,255,0.02); }
                .spinner { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}
