import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Calendar, User, X, AlertCircle } from 'lucide-react';

const JustificationManagement = ({ showNotify }) => {
    const [records, setRecords] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [adminResponse, setAdminResponse] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const API_URL = "http://127.0.0.1:5000/api/justification";
    const config = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };

    useEffect(() => { fetchRecords(); }, []);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/all`, config);
            setRecords(res.data);
        } catch (err) { showNotify("Failed to fetch records", "error"); }
        setLoading(false);
    };

    const handleAction = async (action) => {
        if (action === 'reject' && !adminResponse.trim()) {
            setError("Admin response is required for rejection");
            return;
        }
        try {
            await axios.put(`${API_URL}/${selectedItem.id}/${action}`, { admin_response: adminResponse }, config);
            showNotify(`Justification ${action}ed successfully`);
            setSelectedItem(null);
            setAdminResponse("");
            setError("");
            fetchRecords(); // Refresh list
        } catch (err) { showNotify("Action failed", "error"); }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Justification Management</h2>
                <p style={styles.subtitle}>Review late arrival justifications from employees</p>
            </div>

            <div style={styles.cardGrid}>
                {records.map((item) => (
                    <div key={item.id} style={styles.card}>
                        <div style={styles.cardHeader}>
                            <div style={styles.userSection}>
                                <div style={styles.avatar}>{item.name[0]}</div>
                                <div>
                                    <div style={styles.empName}>{item.name}</div>
                                    <div style={styles.empId}>{item.employee_id}</div>
                                </div>
                            </div>
                            <span style={{...styles.badge, 
                                backgroundColor: item.status === 'Approved' ? '#dcfce7' : item.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                                color: item.status === 'Approved' ? '#16a34a' : item.status === 'Rejected' ? '#dc2626' : '#b45309',
                            }}>{item.status}</span>
                        </div>

                        <div style={styles.detailsGrid}>
                            <div style={styles.gridItem}>
                                <div style={styles.labelRow}><Clock size={14} /> <span style={styles.label}>Late Minutes</span></div>
                                <div style={styles.value}>{item.late_minutes} Mins</div>
                            </div>
                            <div style={styles.gridItem}>
                                <div style={styles.labelRow}><Calendar size={14} /> <span style={styles.label}>Date</span></div>
                                <div style={styles.value}>{item.date}</div>
                            </div>
                        </div>

                        <div style={styles.reasonBox}>
                            <span style={styles.label}>Reason:</span>
                            <p style={styles.reasonText}>"{item.reason}"</p>
                        </div>

                        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                            <button style={styles.reviewBtn} onClick={() => setSelectedItem(item)}>Review Request</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* REVIEW MODAL */}
            {selectedItem && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h3>Review Justification</h3>
                            <button onClick={() => setSelectedItem(null)} style={styles.closeBtn}><X size={20}/></button>
                        </div>
                        <div style={styles.modalBody}>
                            <p><b>Employee:</b> {selectedItem.name}</p>
                            <div style={styles.detailsGrid}>
                                <div><small style={styles.label}>Date</small><div style={styles.value}>{selectedItem.date}</div></div>
                                <div><small style={styles.label}>Late Minutes</small><div style={styles.value}>{selectedItem.late_minutes} Mins</div></div>
                            </div>
                            
                            <div style={styles.reasonBox}>
                                <small style={styles.label}>Justification</small>
                                <p style={{margin: '5px 0 0'}}>{selectedItem.reason}</p>
                            </div>

                            <div style={{marginTop: '15px'}}>
                                <label style={styles.label}>Admin Response</label>
                                <textarea 
                                    style={{...styles.textarea, borderColor: error ? '#dc2626' : '#ddd'}} 
                                    value={adminResponse}
                                    onChange={(e) => { setAdminResponse(e.target.value); setError(""); }}
                                    placeholder="Enter decision reason..."
                                />
                                {error && <div style={styles.errorMsg}><AlertCircle size={14}/> {error}</div>}
                            </div>
                        </div>
                        <div style={styles.modalFooter}>
                            <button onClick={() => setSelectedItem(null)} style={styles.btnCancel}>Cancel</button>
                            <div style={{display:'flex', gap: '10px'}}>
                                <button onClick={() => handleAction('reject')} style={styles.btnReject}>Reject</button>
                                <button onClick={() => handleAction('approve')} style={styles.btnApprove}>Approve</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '10px' },
    title: { margin: 0, fontWeight: '700' },
    subtitle: { margin: '4px 0 20px', color: '#666', fontSize: '0.9em' },
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
    card: { background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f1f1' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' },
    userSection: { display: 'flex', gap: '12px', alignItems: 'center' },
    avatar: { width: '38px', height: '38px', background: '#E9D5FF', color: '#7D3C98', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
    empName: { fontWeight: '700', fontSize: '15px' },
    empId: { fontSize: '0.8em', color: '#888' },
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' },
    detailsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '15px' },
    labelRow: { display: 'flex', alignItems: 'center', gap: '6px', color: '#888' },
    label: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' },
    value: { fontSize: '14px', fontWeight: '600', color: '#333' },
    reasonBox: { background: '#f8f9fa', padding: '12px', borderRadius: '10px', marginBottom: '15px' },
    reasonText: { margin: '4px 0 0', fontSize: '13px', color: '#555', fontStyle: 'italic' },
    reviewBtn: { background: 'linear-gradient(135deg, #7D3C98, #5B2C6F)', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    
    // Modal Styles
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { background: '#fff', padding: '25px', borderRadius: '16px', width: '450px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#666' },
    textarea: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', marginTop: '8px', minHeight: '80px', boxSizing: 'border-box', fontFamily: 'inherit' },
    modalFooter: { display: 'flex', justifyContent: 'space-between', marginTop: '20px', alignItems: 'center' },
    btnCancel: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontWeight: '600' },
    btnReject: { background: 'none', border: '1.5px solid #dc2626', color: '#dc2626', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    btnApprove: { background: '#16a34a', border: 'none', color: '#fff', padding: '10px 22px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    errorMsg: { color: '#dc2626', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }
};

export default JustificationManagement;