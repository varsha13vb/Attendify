import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, FileText, Clock, Calendar, CalendarCheck, X } from 'lucide-react';

const LeaveManagement = () => {
    const [leaves, setLeaves] = useState([]);
    const [filter, setFilter] = useState("Pending");
    const [searchTerm, setSearchTerm] = useState("");
    
    // NEW STATES FOR MODAL & NOTIFICATION
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [adminResponse, setAdminResponse] = useState("");
    const [error, setError] = useState("");
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });

    const fetchLeaves = async () => {
        try {
            const res = await axios.get("http://127.0.0.1:5000/api/leave/all", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setLeaves(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchLeaves(); }, []);

    const showToast = (msg, type) => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    // API HANDLER
    const handleDecision = async (action) => {
        if (action === 'reject' && !adminResponse.trim()) {
            setError("Response is required for rejection");
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
            await axios.put(`http://127.0.0.1:5000/api/leave/${selectedLeave.id}/${action}`, 
                { admin_response: adminResponse }, 
                config
            );
            
            showToast(`Leave request ${action}ed successfully`, "success");
            setSelectedLeave(null);
            setAdminResponse("");
            setError("");
            fetchLeaves();
        } catch (err) {
            showToast("Failed to update status", "error");
        }
    };

    const counts = {
        Pending: leaves.filter(l => l.status === "Pending").length,
        Approved: leaves.filter(l => l.status === "Approved").length,
        Rejected: leaves.filter(l => l.status === "Rejected").length,
        All: leaves.length
    };

    const filteredLeaves = leaves.filter(l => {
        const matchesTab = filter === "All" || l.status === filter;
        const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.employee_id.includes(searchTerm);
        return matchesTab && matchesSearch;
    });

    return (
        <div style={styles.container}>
            {/* TOAST NOTIFICATION */}
            {toast.show && (
                <div style={{...styles.toast, background: toast.type === 'success' ? '#16a34a' : '#dc2626'}}>
                    {toast.msg}
                </div>
            )}

            <div style={styles.header}>
                <h2 style={styles.title}>Leave Management</h2>
                <p style={styles.subtitle}>Review and process employee time-off requests</p>
            </div>

            <div style={styles.filterRow}>
                <div style={styles.pillContainer}>
                    {["Pending", "Approved", "Rejected", "All"].map(t => (
                        <div 
                            key={t} 
                            onClick={() => setFilter(t)} 
                            style={{...styles.tabItem, ...(filter === t ? styles.activeTab : {})}}
                        >
                            {t} <span style={{opacity: 0.7, fontSize: '0.9em'}}>({counts[t]})</span>
                        </div>
                    ))}
                </div>

                <div style={styles.searchWrapper}>
                    <Search size={18} style={styles.searchIcon} />
                    <input 
                        style={styles.searchBar} 
                        placeholder="Search employee..." 
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div style={styles.cardGrid}>
                {filteredLeaves.map((l) => (
                    <div key={l.id} style={styles.leaveCard}>
                        <div style={styles.cardHeader}>
                            <div style={styles.userSection}>
                                <div style={styles.avatar}>{l.name[0]}</div>
                                <div>
                                    <div style={styles.empName}>{l.name}</div>
                                    <div style={styles.empId}>{l.employee_id}</div>
                                </div>
                            </div>
                            <span style={{
                                ...styles.statusBadge,
                                backgroundColor: l.status === 'Approved' ? '#dcfce7' : l.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                                color: l.status === 'Approved' ? '#166534' : l.status === 'Rejected' ? '#991b1b' : '#854d0e',
                            }}>{l.status}</span>
                        </div>
                        <div style={styles.detailsGrid}>
                            <div style={styles.gridItem}>
                                <div style={styles.labelRow}><FileText size={12} /> <span style={styles.label}>Type</span></div>
                                <div style={styles.value}>{l.leave_type}</div>
                            </div>
                            <div style={styles.gridItem}>
                                <div style={styles.labelRow}><Clock size={12} /> <span style={styles.label}>Duration</span></div>
                                <div style={styles.value}>3 Days</div>
                            </div>
                            <div style={styles.gridItem}>
                                <div style={styles.labelRow}><Calendar size={12} /> <span style={styles.label}>Start</span></div>
                                <div style={styles.value}>{l.from_date}</div>
                            </div>
                            <div style={styles.gridItem}>
                                <div style={styles.labelRow}><CalendarCheck size={12} /> <span style={styles.label}>End</span></div>
                                <div style={styles.value}>{l.to_date}</div>
                            </div>
                        </div>
                        <div style={styles.reasonBox}>
                            <p style={styles.reasonText}>"{l.reason}"</p>
                        </div>
                        <div style={{display:'flex', justifyContent:'flex-end'}}>
                             <button style={styles.reviewBtn} onClick={() => setSelectedLeave(l)}>Review Request</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* REVIEW MODAL */}
            {selectedLeave && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3 style={{margin:0, color:'#7D3C98'}}>Review Leave Request</h3>
                            <X size={20} style={{cursor:'pointer', color:'#666'}} onClick={() => setSelectedLeave(null)} />
                        </div>
                        
                        <div style={{marginBottom:'20px'}}>
                            <p style={{margin:0}}><strong>Employee:</strong> {selectedLeave.name}</p>
                        </div>

                        <div style={styles.detailsGrid}>
                            <div style={styles.gridItem}>
                                <span style={styles.label}>Leave Type</span>
                                <div style={styles.value}>{selectedLeave.leave_type}</div>
                            </div>
                            <div style={styles.gridItem}>
                                <span style={styles.label}>Duration</span>
                                <div style={styles.value}>3 Days</div>
                            </div>
                            <div style={styles.gridItem}>
                                <span style={styles.label}>Start Date</span>
                                <div style={styles.value}>{selectedLeave.from_date}</div>
                            </div>
                            <div style={styles.gridItem}>
                                <span style={styles.label}>End Date</span>
                                <div style={styles.value}>{selectedLeave.to_date}</div>
                            </div>
                        </div>

                        <div style={{...styles.reasonBox, marginTop:'15px'}}>
                            <span style={styles.label}>Justification</span>
                            <p style={{margin:'5px 0 0', fontSize:'14px'}}>{selectedLeave.reason}</p>
                        </div>

                        <div style={{marginTop:'20px'}}>
                            <label style={styles.label}>Admin Response</label>
                            <textarea 
                                style={{
                                    ...styles.textarea, 
                                    borderColor: error ? '#dc2626' : '#ddd'
                                }}
                                placeholder="Enter your response..."
                                value={adminResponse}
                                onChange={(e) => {setAdminResponse(e.target.value); setError("");}}
                            />
                            {error && <small style={{color:'#dc2626', marginTop:'4px', display:'block'}}>{error}</small>}
                        </div>

                        <div style={styles.modalFooter}>
                            <button style={styles.btnCancel} onClick={() => setSelectedLeave(null)}>Cancel</button>
                            <div style={{display:'flex', gap:'10px'}}>
                                <button style={styles.btnReject} onClick={() => handleDecision('reject')}>Reject</button>
                                <button style={styles.btnApprove} onClick={() => handleDecision('approve')}>Approve</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    // ... Keeping all your existing styles exactly as they were ...
    container: { padding: '10px' },
    title: { margin: 0, fontWeight: '700' },
    subtitle: { margin: '4px 0 20px', color: '#666', fontSize: '0.9em' },
    filterRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
    pillContainer: { display: 'flex', background: '#f3f4f6', padding: '4px', borderRadius: '999px' },
    tabItem: { padding: '6px 16px', borderRadius: '999px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#4b5563', transition: '0.3s' },
    activeTab: { background: '#7D3C98', color: '#fff', boxShadow: '0 2px 8px rgba(125, 60, 152, 0.3)' },
    searchWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    searchIcon: { position: 'absolute', left: '12px', color: '#9ca3af' },
    searchBar: { width: '300px', padding: '10px 15px 10px 40px', borderRadius: '999px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px' },
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
    leaveCard: { background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f1f1' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' },
    userSection: { display: 'flex', gap: '12px', alignItems: 'center' },
    avatar: { width: '38px', height: '38px', background: '#E9D5FF', color: '#7D3C98', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
    empName: { fontWeight: '700', fontSize: '15px' },
    empId: { fontSize: '0.8em', color: '#888' },
    statusBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' },
    detailsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' },
    gridItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
    labelRow: { display: 'flex', alignItems: 'center', gap: '6px', color: '#888' },
    label: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' },
    value: { fontSize: '14px', fontWeight: '600', color: '#333' },
    reasonBox: { background: '#f8f9fa', padding: '12px', borderRadius: '10px', marginBottom: '18px' },
    reasonText: { margin: 0, fontSize: '13px', color: '#555', fontStyle: 'italic' },
    reviewBtn: { background: 'linear-gradient(135deg, #7D3C98, #5B2C6F)', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },

    // ADDED MODAL & TOAST STYLES
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: '#fff', padding: '25px', borderRadius: '16px', width: '500px', maxWidth: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    textarea: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', marginTop: '8px', minHeight: '80px', boxSizing: 'border-box', fontFamily: 'inherit' },
    modalFooter: { display: 'flex', justifyContent: 'space-between', marginTop: '25px', alignItems: 'center' },
    btnCancel: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontWeight: '600' },
    btnReject: { background: 'none', border: '1.5px solid #dc2626', color: '#dc2626', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    btnApprove: { background: '#16a34a', border: 'none', color: '#fff', padding: '10px 22px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    toast: { position: 'fixed', top: '20px', right: '20px', padding: '12px 25px', color: '#fff', borderRadius: '8px', zIndex: 2000, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }
};

export default LeaveManagement;