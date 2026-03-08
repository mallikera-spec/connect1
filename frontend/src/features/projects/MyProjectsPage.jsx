import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Info, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, FileText, Download } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import DataTable from '../../components/common/DataTable'
import ProjectDetailsModal from './ProjectDetailsModal'

export default function MyProjectsPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [projects, setProjects] = useState([])
    const [allUsers, setAllUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(null)
    const [selected, setSelected] = useState(null)
    const [filters, setFilters] = useState({ status: '' })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const PROJECT_STATUS = {
        active: { label: 'Active', color: '#10b981' },
        on_hold: { label: 'On Hold', color: '#f59e0b' },
        completed: { label: 'Completed', color: '#0891b2' },
        cancelled: { label: 'Cancelled', color: '#dc2626' },
        planning: { label: 'Planning', color: '#7c3aed' },
    }

    const load = async (params = {}) => {
        setLoading(true)
        try {
            const finalParams = { ...params, memberUserId: user?.id }
            const pRes = await api.get('/projects', { params: finalParams })
            setProjects(pRes.data.data || [])

            try {
                const uRes = await api.get('/users')
                setAllUsers(uRes.data.data)
            } catch (uErr) {
                console.warn('Could not fetch users:', uErr.message)
                setAllUsers([])
            }
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    const openDetails = (p) => navigate(`/projects/${p.id}`)
    const closeModal = () => { setModal(null); setSelected(null) }

    const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—'



    return (
        <div>
            <div className="page-header print-hide">
                <div><h1>My Projects</h1><p>View and manage your assigned projects</p></div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ minWidth: 150 }}>
                        <select
                            className="form-select"
                            style={{ margin: 0, height: 38, fontSize: 13 }}
                            value={filters.status}
                            onChange={(e) => {
                                const s = e.target.value;
                                setFilters(prev => ({ ...prev, status: s }));
                                load({ status: s });
                            }}
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="on_hold">On Hold</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="planning">Planning</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-wrapper">
                <DataTable
                    data={projects}
                    loading={loading}
                    fileName="my_projects"
                    columns={[
                        { label: 'Project Name', key: 'name', width: '200px', wrap: true, render: (val) => <strong style={{ whiteSpace: 'normal', lineHeight: 1.4, display: 'block' }}>{val}</strong> },
                        { label: 'Sub-type', key: 'sub_types', width: '120px', render: (val) => <span style={{ fontSize: 13, background: 'var(--bg-header)', padding: '2px 8px', borderRadius: 12, border: '1px solid var(--border)', display: 'inline-block' }}>{val?.join(', ') || '—'}</span> },
                        { label: 'Description', key: 'description', wrap: true, render: (val) => <span style={{ color: 'var(--text-muted)', fontSize: 13, display: 'block', whiteSpace: 'normal', lineHeight: 1.4 }}>{val || '—'}</span> },
                        {
                            label: 'Status',
                            key: 'status',
                            width: '100px',
                            render: (val) => {
                                const s = PROJECT_STATUS[val] || PROJECT_STATUS.active
                                return (
                                    <span style={{ background: s.color + '22', color: s.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                                        {s.label}
                                    </span>
                                )
                            }
                        },
                        {
                            label: 'Actions',
                            key: 'id',
                            width: '80px',
                            render: (_, p) => (
                                <div className="actions-cell">
                                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openDetails(p)} title="View Details, Files & Notes"><Info size={14} /></button>
                                </div>
                            )
                        }
                    ]}
                />
            </div>



            {modal === 'details' && selected && (
                <ProjectDetailsModal project={selected} allUsers={allUsers} onClose={closeModal} onSaved={load} />
            )}
        </div>
    )
}
