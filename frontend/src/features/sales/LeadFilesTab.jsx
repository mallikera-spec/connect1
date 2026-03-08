import React, { useState, useEffect, useRef } from 'react';
import {
    FileText,
    Upload,
    Trash2,
    Download,
    File,
    FileCode,
    Image as ImageIcon,
    Loader2,
    Plus,
    X,
    ExternalLink
} from 'lucide-react';
import { SalesService } from './SalesService';
import toast from 'react-hot-toast';

export default function LeadFilesTab({ leadId }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (leadId) loadFiles();
    }, [leadId]);

    const loadFiles = async () => {
        setLoading(true);
        try {
            const res = await SalesService.getLeadFiles(leadId);
            setFiles(res.data || []);
        } catch (err) {
            console.error('Failed to load lead files:', err);
            toast.error('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (e.g., 20MB limit for frontend check)
        if (file.size > 20 * 1024 * 1024) {
            return toast.error('File is too large. Max 20MB allowed.');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('filename', file.name);

        // Determine file type category based on extension
        const ext = file.name.split('.').pop().toLowerCase();
        let fileType = 'Other';
        if (['pdf'].includes(ext)) fileType = 'PDF';
        else if (['doc', 'docx'].includes(ext)) fileType = 'Word';
        else if (['xls', 'xlsx', 'csv'].includes(ext)) fileType = 'Excel/CSV';
        else if (['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(ext)) fileType = 'Image';

        formData.append('file_type', fileType);

        setUploading(true);
        const toastId = toast.loading('Uploading document...');
        try {
            await SalesService.uploadLeadFile(leadId, formData);
            toast.success('Document uploaded successfully', { id: toastId });
            loadFiles();
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error('Upload failed:', err);
            toast.error(err.response?.data?.message || 'Upload failed', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (fileId) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;

        try {
            console.log(`[LeadFiles] Attempting to delete file: ${fileId}`);
            await SalesService.deleteLeadFile(fileId);
            toast.success('Document deleted');
            setFiles(prev => prev.filter(f => f.id !== fileId));
        } catch (err) {
            console.error('[LeadFiles] Delete failed:', err);
            toast.error(err.response?.data?.message || 'Failed to delete document');
        }
    };

    const handleDownload = async (fileUrl, filename, fileId, fileType) => {
        try {
            console.log(`[LeadFiles] Starting download for ${filename} (Type: ${fileType})`);
            setFiles(prev => prev.map(f => f.id === fileId ? { ...f, downloading: true } : f));

            let downloadUrl = fileUrl;

            // Cloudinary fl_attachment ONLY works for 'image' and 'video' resource types.
            // If the URL contains /image/upload/ or /video/upload/, we can force download.
            // PDFs are often treated as 'image' in Cloudinary.

            const isCloudinary = fileUrl.includes('cloudinary.com');
            const isTransformable = fileUrl.includes('/image/upload/') || fileUrl.includes('/video/upload/');

            if (isCloudinary && isTransformable) {
                downloadUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
                console.log(`[LeadFiles] Applied Cloudinary download flag: ${downloadUrl}`);
            } else {
                console.log(`[LeadFiles] Using direct download link: ${downloadUrl}`);
            }

            // Create a hidden temporary link
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', filename);
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer'); // Security best practice
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();

            // Cleanup with a slight delay to ensure browser handles the click
            setTimeout(() => {
                document.body.removeChild(link);
            }, 100);

            toast.success('Download initiated');
        } catch (err) {
            console.error('[LeadFiles] Download process failed:', err);
            toast.error('Failed to trigger download');
        } finally {
            setTimeout(() => {
                setFiles(prev => prev.map(f => f.id === fileId ? { ...f, downloading: false } : f));
            }, 1000);
        }
    };

    const getFileIcon = (type) => {
        switch (type) {
            case 'PDF': return <FileText size={20} color="#ef4444" />;
            case 'Word': return <FileText size={20} color="#3b82f6" />;
            case 'Excel/CSV': return <FileCode size={20} color="#10b981" />;
            case 'Image': return <ImageIcon size={20} color="#8b5cf6" />;
            default: return <File size={20} color="var(--text-dim)" />;
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className="spinner" size={24} />
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Lead Documents</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>Upload quotations, requirements, or client-provided files.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? <Loader2 className="spinner" size={16} /> : <Plus size={16} />}
                    <span style={{ marginLeft: '8px' }}>Upload File</span>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*"
                />
            </div>

            <div className="files-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {files.length > 0 ? files.map(file => (
                    <div key={file.id} className="card polished-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: 'var(--bg-app)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            {getFileIcon(file.file_type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontWeight: 700,
                                fontSize: '13px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: 'var(--text)'
                            }} title={file.filename}>
                                {file.filename}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                {file.file_type} • {new Date(file.created_at).toLocaleDateString()}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '4px', fontWeight: 500 }}>
                                By {file.uploader?.full_name || 'System'}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                className="btn-icon"
                                style={{ padding: '6px' }}
                                onClick={() => handleDownload(file.file_url, file.filename, file.id, file.file_type)}
                                disabled={file.downloading}
                                title="Download File"
                            >
                                {file.downloading ? <Loader2 size={14} className="spinner" /> : <Download size={14} color="var(--accent)" />}
                            </button>
                            <button
                                className="btn-icon"
                                style={{ padding: '6px' }}
                                onClick={() => handleDelete(file.id)}
                                title="Delete"
                            >
                                <Trash2 size={14} color="var(--danger)" />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', background: 'var(--bg-app)', borderRadius: '12px', border: '2px dashed var(--border)' }}>
                        <Upload size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                        <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>No documents uploaded yet.</p>
                        <button
                            className="btn btn-ghost"
                            style={{ marginTop: '12px' }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Select a file to get started
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
