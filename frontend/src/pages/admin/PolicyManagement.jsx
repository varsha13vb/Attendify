import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FileText, ShieldCheck, AlertTriangle, Layers, 
    Search, Plus, Pencil, Trash2, X, Info
} from 'lucide-react';

const PolicyManagement = () => {
    const [policies, setPolicies] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All Categories");
    
    // Modal States
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    
    // Form State
    const [formData, setFormData] = useState({
        title: '', description: '', category: 'Attendance', 
        severity: 'Medium', applicable_to: 'All Employees', 
        enforcement_action: '', is_active: true
    });

    const API_BASE = "http://127.0.0.1:5000/api/policies";
    const config = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };

    useEffect(() => { fetchPolicies(); }, []);

    const fetchPolicies = async () => {
        try {
            const res = await axios.get(API_BASE, config);
            setPolicies(res.data);
        } catch (err) { console.error(err); }
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            await axios.put(`${API_BASE}/${id}/toggle`, { is_active: !currentStatus }, config);
            fetchPolicies();
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editItem) {
                await axios.put(`${API_BASE}/${editItem.id}`, formData, config);
            } else {
                await axios.post(API_BASE, formData, config);
            }
            closeModals();
            fetchPolicies();
        } catch (err) { console.error(err); }
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${API_BASE}/${deleteItem.id}`, config);
            setDeleteItem(null);
            fetchPolicies();
        } catch (err) { console.error(err); }
    };

    const closeModals = () => {
        setIsAddOpen(false);
        setEditItem(null);
        setFormData({
            title: '', description: '', category: 'Attendance', 
            severity: 'Medium', applicable_to: 'All Employees', 
            enforcement_action: '', is_active: true
        });
    };

    // Stats calculation
    const stats = {
        total: policies.length,
        active: policies.filter(p => p.is_active).length,
        critical: policies.filter(p => p.severity === 'High').length,
        categories: [...new Set(policies.map(p => p.category))].length
    };

    return (
        <div style={styles.container}>
            {/* PART 1: SUMMARY CARDS */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div><small style={styles.statLabel}>Total Policies</small><div style={styles.statVal}>{stats.total}</div></div>
                    <div style={{...styles.statIconBox, background: '#f3e8ff', color: '#7D3C98'}}><FileText size={20}/></div>
                </div>
                <div style={styles.statCard}>
                    <div><small style={styles.statLabel}>Active Policies</small><div style={styles.statVal}>{stats.active}</div></div>
                    <div style={{...styles.statIconBox, background: '#dcfce7', color: '#16a34a'}}><ShieldCheck size={20}/></div>
                </div>
                <div style={styles.statCard}>
                    <div><small style={styles.statLabel}>Critical</small><div style={styles.statVal}>{stats.critical}</div></div>
                    <div style={{...styles.statIconBox, background: '#fee2e2', color: '#dc2626'}}><AlertTriangle size={20}/></div>
                </div>
                <div style={styles.statCard}>
                    <div><small style={styles.statLabel}>Categories</small><div style={styles.statVal}>{stats.categories}</div></div>
                    <div style={{...styles.statIconBox, background: '#e0f2fe', color: '#0284c7'}}><Layers size={20}/></div>
                </div>
            </div>

            {/* PART 2: HEADER SECTION */}
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Policy Enforcement</h2>
                    <p style={styles.subtitle}>Define and manage organizational compliance rules</p>
                </div>
                <button style={styles.addBtn} onClick={() => setIsAddOpen(true)}>
                    <Plus size={18} /> Add Policy
                </button>
            </div>

            {/* PART 3: SEARCH + FILTER BAR */}
            <div style={styles.searchRow}>
                <div style={styles.searchWrapper}>
                    <Search size={18} style={styles.searchIcon} />
                    <input 
                        style={styles.searchBar} 
                        placeholder="Search policies by title or keywords..." 
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select style={styles.categoryDropdown} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option>All Categories</option>
                    <option>Attendance</option>
                    <option>Leave</option>
                    <option>Conduct</option>
                </select>
            </div>

            {/* PART 4: POLICY CARDS */}
            <div style={styles.policyList}>
                {policies.map(p => (
                    <div key={p.id} style={styles.policyCard}>
                        <div style={styles.cardHeader}>
                            <div style={styles.cardHeaderLeft}>
                                <div style={styles.policyCircle}><ShieldCheck size={18} /></div>
                                <div style={styles.titleAndBadges}>
                                    <span style={styles.policyTitle}>{p.title}</span>
                                    <span style={{...styles.badge, background: p.severity === 'High' ? '#fee2e2' : '#fef3c7', color: p.severity === 'High' ? '#dc2626' : '#b45309'}}>{p.severity}</span>
                                    <span style={{...styles.badge, background: '#f3f4f6', color: '#666'}}>{p.category}</span>
                                    {p.is_active && <span style={{...styles.badge, background: '#dcfce7', color: '#16a34a'}}>Active</span>}
                                </div>
                            </div>
                            <div style={styles.cardHeaderRight}>
                                {/* PART 5: TOGGLE */}
                                <div 
                                    style={{...styles.toggleBg, background: p.is_active ? '#2d2d2d' : '#e5e7eb'}}
                                    onClick={() => handleToggle(p.id, p.is_active)}
                                >
                                    <div style={{...styles.toggleCircle, left: p.is_active ? '22px' : '2px'}} />
                                </div>
                                <button style={styles.iconBtn} onClick={() => {setEditItem(p); setFormData(p)}}><Pencil size={16}/></button>
                                <button style={{...styles.iconBtn, color: '#dc2626'}} onClick={() => setDeleteItem(p)}><Trash2 size={16}/></button>
                            </div>
                        </div>

                        <p style={styles.description}>{p.description}</p>

                        <div style={styles.detailsGrid}>
                            <div><small style={styles.detailLabel}>Applicable To</small><div style={styles.detailVal}>{p.applicable_to}</div></div>
                            <div><small style={styles.detailLabel}>Created</small><div style={styles.detailVal}>{p.created_at || 'Jan 12, 2024'}</div></div>
                            <div><small style={styles.detailLabel}>Last Updated</small><div style={styles.detailVal}>{p.updated_at || 'Feb 05, 2024'}</div></div>
                        </div>

                        <div style={styles.enforcementBox}>
                            <div style={{display:'flex', gap:'8px', color:'#7D3C98'}}><Info size={16}/> <small style={{fontWeight: 700, textTransform:'uppercase'}}>Enforcement Action</small></div>
                            <p style={styles.enforcementText}>{p.enforcement_action}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* PART 6 & 7: ADD/EDIT MODAL */}
            {(isAddOpen || editItem) && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h3>{editItem ? 'Edit Policy' : 'Create New Policy'}</h3>
                            <button onClick={closeModals} style={styles.closeBtn}><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Policy Title</label>
                                <input style={styles.input} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Late Arrival Policy" required/>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Description</label>
                                <textarea style={{...styles.input, height: '80px'}} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Detailed explanation of the policy..." required/>
                            </div>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Category</label>
                                    <select style={styles.input} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                        <option>Attendance</option><option>Leave</option><option>Conduct</option>
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Severity</label>
                                    <select style={styles.input} value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})}>
                                        <option>Low</option><option>Medium</option><option>High</option>
                                    </select>
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Applicable To</label>
                                <input style={styles.input} value={formData.applicable_to} onChange={e => setFormData({...formData, applicable_to: e.target.value})} placeholder="e.g. All Departments" required/>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Enforcement Action</label>
                                <textarea style={{...styles.input, height: '60px'}} value={formData.enforcement_action} onChange={e => setFormData({...formData, enforcement_action: e.target.value})} placeholder="Action taken on violation..." required/>
                            </div>
                            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom: '20px'}}>
                                <div 
                                    style={{...styles.toggleBg, background: formData.is_active ? '#2d2d2d' : '#e5e7eb'}}
                                    onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                                >
                                    <div style={{...styles.toggleCircle, left: formData.is_active ? '22px' : '2px'}} />
                                </div>
                                <span style={{fontSize:'14px', fontWeight:600}}>Policy Active</span>
                            </div>
                            <div style={styles.modalFooter}>
                                <button type="button" onClick={closeModals} style={styles.cancelBtn}>Cancel</button>
                                <button type="submit" style={styles.saveBtn}>{editItem ? 'Update Policy' : 'Add Policy'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PART 8: DELETE MODAL */}
            {deleteItem && (
                <div style={styles.modalOverlay}>
                    <div style={{...styles.modal, width: '400px', textAlign: 'center'}}>
                        <div style={{color: '#dc2626', marginBottom: '15px'}}><AlertTriangle size={48} style={{margin:'auto'}}/></div>
                        <h3>Delete Policy</h3>
                        <p>Are you sure you want to delete <b>{deleteItem.title}</b>? This action cannot be undone.</p>
                        <div style={{display:'flex', gap:'10px', marginTop:'25px', justifyContent:'center'}}>
                            <button onClick={() => setDeleteItem(null)} style={styles.cancelBtn}>Cancel</button>
                            <button onClick={confirmDelete} style={{...styles.saveBtn, background: '#dc2626'}}>Delete Policy</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '10px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' },
    statCard: { background: '#fff', padding: '18px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    statLabel: { color: '#888', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' },
    statVal: { fontSize: '24px', fontWeight: 700, marginTop: '4px' },
    statIconBox: { width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
    title: { margin: 0, fontWeight: 800, fontSize: '24px' },
    subtitle: { margin: '4px 0 0', color: '#666', fontSize: '14px' },
    addBtn: { background: 'linear-gradient(135deg, #7D3C98, #5B2C6F)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' },
    
    searchRow: { display: 'flex', gap: '12px', marginBottom: '25px' },
    searchWrapper: { flex: 1, position: 'relative' },
    searchIcon: { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999' },
    searchBar: { width: '100%', padding: '12px 15px 12px 45px', borderRadius: '10px', border: '1px solid #e5e7eb', outline: 'none', boxSizing: 'border-box' },
    categoryDropdown: { padding: '10px 15px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontWeight: 600 },

    policyList: { display: 'flex', flexDirection: 'column', gap: '20px' },
    policyCard: { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f1f1f1' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    cardHeaderLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    policyCircle: { width: '36px', height: '36px', borderRadius: '50%', background: '#f3e8ff', color: '#7D3C98', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    titleAndBadges: { display: 'flex', alignItems: 'center', gap: '10px' },
    policyTitle: { fontWeight: 800, fontSize: '16px' },
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 },
    cardHeaderRight: { display: 'flex', alignItems: 'center', gap: '15px' },
    toggleBg: { width: '44px', height: '22px', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' },
    toggleCircle: { width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', transition: '0.3s' },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#666' },
    
    description: { color: '#666', fontSize: '14px', lineHeight: '1.5', margin: '0 0 20px 0' },
    detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' },
    detailLabel: { color: '#999', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' },
    detailVal: { fontWeight: 700, fontSize: '14px', marginTop: '4px' },
    enforcementBox: { background: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #eee' },
    enforcementText: { margin: '8px 0 0', fontSize: '14px', color: '#444' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { background: '#fff', padding: '30px', borderRadius: '20px', width: '550px', maxWidth: '95%', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#999' },
    formGroup: { marginBottom: '15px' },
    label: { display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#444' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', boxSizing: 'border-box', outline: 'none' },
    modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    cancelBtn: { padding: '10px 25px', border: 'none', background: '#f3f4f6', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
    saveBtn: { padding: '10px 25px', border: 'none', background: 'linear-gradient(135deg, #7D3C98, #5B2C6F)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }
};

export default PolicyManagement;