import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Clock, Calendar, ShieldAlert, Info, 
    Edit2, Trash2, Plus, CheckCircle, HelpCircle 
} from 'lucide-react';

const SystemConfig = ({ showNotify }) => {
    const [activeTab, setActiveTab] = useState("Work Timings");
    const token = localStorage.getItem("token");
    const config = useMemo(() => {
        return { headers: { Authorization: `Bearer ${token}` } };
    }, [token]);
    const API_BASE = "http://127.0.0.1:5000/api";

    // 1. Work Timings State
    const [workTime, setWorkTime] = useState({
        check_in: "09:00", check_out: "18:00",
        late_tolerance: 15, monthly_late_wallet: 45,
        min_work_hours: 8
    });

    // 2. Leave Config State
    const [leaveTypes, setLeaveTypes] = useState([
        { id: 1, name: 'Paid Leave', quota: 15, description: 'Standard annual leave', carry_forward: true, requires_approval: true },
        { id: 2, name: 'Sick Leave', quota: 10, description: 'Medical emergency leave', carry_forward: false, requires_approval: true }
    ]);
    const [editingLeaveId, setEditingLeaveId] = useState(null);

    // 3. Attendance Rules State
    const [attRules, setAttRules] = useState({
        half_day: 4, full_day: 8, ot_threshold: 9,
        weekend_multiplier: 1.5, holiday_multiplier: 2.0
    });

    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get(`${API_BASE}/config/work-timing`, config);
                if (res?.data) {
                    setWorkTime((prev) => ({ ...prev, ...res.data }));
                }
            } catch {
                // keep defaults (45 minutes, etc.)
            }
        })();
    }, [config]);

    // --- API HANDLERS ---
    const saveWorkTime = async () => {
        try {
            const payload = {
                ...workTime,
                late_tolerance: Number(workTime.late_tolerance),
                monthly_late_wallet: Number(workTime.monthly_late_wallet),
                min_work_hours: Number(workTime.min_work_hours),
            };
            await axios.put(`${API_BASE}/config/work-timing`, payload, config);
            showNotify?.("Work Time Configuration Saved");
        } catch (err) { showNotify?.(err.response?.data?.message || "Failed to save", "error"); }
    };

    const saveAttendanceRules = async () => {
        try {
            await axios.put(`${API_BASE}/config/attendance-rules`, attRules, config);
            showNotify?.("Attendance Rules Updated");
        } catch { showNotify?.("Update failed", "error"); }
    };

    const deleteLeaveType = (id) => {
        if (window.confirm("Delete this leave type?")) {
            setLeaveTypes(leaveTypes.filter(l => l.id !== id));
            showNotify?.("Leave type removed");
        }
    };

    // --- RENDER HELPERS ---
    const renderWorkTimings = () => (
        <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Work Time Configuration</h3>
            <div style={styles.grid2}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Check-In Time</label>
                    <input type="time" style={styles.input} value={workTime.check_in} onChange={e => setWorkTime({...workTime, check_in: e.target.value})}/>
                    <small style={styles.helper}>Standard time for employee arrival</small>
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Check-Out Time</label>
                    <input type="time" style={styles.input} value={workTime.check_out} onChange={e => setWorkTime({...workTime, check_out: e.target.value})}/>
                    <small style={styles.helper}>Standard time for shift end</small>
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Late Tolerance (Minutes)</label>
                    <input type="number" style={styles.input} value={workTime.late_tolerance} onChange={e => setWorkTime({...workTime, late_tolerance: e.target.value})}/>
                    <small style={styles.helper}>Minutes allowed after check-in time</small>
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Monthly Late Wallet (Minutes)</label>
                    <input type="number" style={styles.input} value={workTime.monthly_late_wallet} onChange={e => setWorkTime({...workTime, monthly_late_wallet: e.target.value})}/>
                    <small style={styles.helper}>Total pool of late minutes per month</small>
                </div>
            </div>
            <div style={{...styles.formGroup, marginTop: '15px'}}>
                <label style={styles.label}>Minimum Work Hours</label>
                <input type="number" style={styles.input} value={workTime.min_work_hours} onChange={e => setWorkTime({...workTime, min_work_hours: e.target.value})}/>
                <small style={styles.helper}>Hours required to complete a full day</small>
            </div>

            <div style={styles.infoBoxBlue}>
                <div style={{display:'flex', gap:'10px'}}><Info size={18}/> <strong>How Late Wallet Works</strong></div>
                <ul style={{margin:'10px 0 0 25px', fontSize:'13px'}}>
                    <li>Employees consume minutes from this wallet when arriving after tolerance.</li>
                    <li>Once empty, further late arrivals are marked as Half-Days.</li>
                    <li>Wallet resets on the 1st of every month.</li>
                </ul>
            </div>

            <div style={styles.btnRow}>
                <button onClick={saveWorkTime} style={styles.saveBtn}>Save Work Time Configuration</button>
            </div>
        </div>
    );

    const renderLeaveConfig = () => (
        <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Leave Types Configuration</h3>
            
            {leaveTypes.map(lt => (
                <div key={lt.id} style={styles.leaveCard}>
                    {editingLeaveId === lt.id ? (
                        <div style={styles.inlineForm}>
                            <div style={styles.grid2}>
                                <input style={styles.input} placeholder="Leave Name" defaultValue={lt.name}/>
                                <input style={styles.input} type="number" placeholder="Annual Quota" defaultValue={lt.quota}/>
                            </div>
                            <textarea style={{...styles.input, marginTop:'10px'}} defaultValue={lt.description}/>
                            <div style={{display:'flex', gap:'20px', marginTop:'10px'}}>
                                <label><input type="checkbox" defaultChecked={lt.carry_forward}/> Carry Forward</label>
                                <label><input type="checkbox" defaultChecked={lt.requires_approval}/> Requires Approval</label>
                            </div>
                            <div style={{...styles.btnRow, marginTop:'15px'}}>
                                <button onClick={() => setEditingLeaveId(null)} style={styles.cancelBtn}>Cancel</button>
                                <button onClick={() => setEditingLeaveId(null)} style={styles.saveBtn}>Save</button>
                            </div>
                        </div>
                    ) : (
                        <div style={styles.leaveCardContent}>
                            <div style={{flex: 1}}>
                                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                    <strong style={{fontSize:'16px'}}>{lt.name}</strong>
                                    <span style={styles.badgeGray}>{lt.quota} days/year</span>
                                    {lt.carry_forward && <span style={styles.badgePurp}>Carry Forward</span>}
                                    {lt.requires_approval && <span style={styles.badgePurp}>Approval Req.</span>}
                                </div>
                                <p style={{margin:'5px 0 0', color:'#666', fontSize:'13px'}}>{lt.description}</p>
                            </div>
                            <div style={{display:'flex', gap:'10px'}}>
                                <button onClick={() => setEditingLeaveId(lt.id)} style={styles.iconBtn}><Edit2 size={16}/></button>
                                <button onClick={() => deleteLeaveType(lt.id)} style={{...styles.iconBtn, color:'red'}}><Trash2 size={16}/></button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            <button style={styles.addTypeBtn}><Plus size={16}/> Add New Leave Type</button>

            <h3 style={{...styles.sectionTitle, marginTop:'40px'}}>Current Leave Policy Summary</h3>
            <div style={styles.gridSummary}>
                {['Paid', 'Sick', 'Casual', 'Maternity', 'Paternity'].map(type => (
                    <div key={type} style={styles.summaryCard}>
                        <small style={{color:'#888', fontWeight:600}}>{type} Leave</small>
                        <div style={{fontSize:'24px', fontWeight:800, color:'#7D3C98', margin:'5px 0'}}>15</div>
                        <small style={{color:'#aaa'}}>days per year</small>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAttendanceRules = () => (
        <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Attendance Rules & Calculations</h3>
            <div style={styles.grid2}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Half Day Work Hours</label>
                    <input
                        type="number"
                        style={styles.input}
                        value={attRules.half_day}
                        onChange={e => setAttRules({ ...attRules, half_day: Number(e.target.value) })}
                    />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Full Day Work Hours</label>
                    <input
                        type="number"
                        style={styles.input}
                        value={attRules.full_day}
                        onChange={e => setAttRules({ ...attRules, full_day: Number(e.target.value) })}
                    />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Overtime Threshold (Hrs)</label>
                    <input
                        type="number"
                        style={styles.input}
                        value={attRules.ot_threshold}
                        onChange={e => setAttRules({ ...attRules, ot_threshold: Number(e.target.value) })}
                    />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Weekend Work Multiplier</label>
                    <input
                        type="number"
                        step="0.1"
                        style={styles.input}
                        value={attRules.weekend_multiplier}
                        onChange={e => setAttRules({ ...attRules, weekend_multiplier: Number(e.target.value) })}
                    />
                </div>
            </div>

            <div style={styles.infoBoxGreen}>
                <div style={{display:'flex', gap:'10px'}}><CheckCircle size={18}/> <strong>Attendance Calculation Rules</strong></div>
                <ul style={{margin:'10px 0 0 25px', fontSize:'13px'}}>
                    <li>Work duration &lt; {attRules.half_day} hours will be marked as <strong>Absent</strong>.</li>
                    <li>Work duration between {attRules.half_day} and {attRules.full_day} hours will be <strong>Half Day</strong>.</li>
                    <li>Work duration &gt; {attRules.ot_threshold} hours will trigger <strong>Overtime</strong> calculation.</li>
                </ul>
            </div>

            <div style={styles.btnRow}>
                <button onClick={saveAttendanceRules} style={styles.saveBtn}>Save Attendance Rules</button>
            </div>
        </div>
    );

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>System Configuration</h2>
                <p style={styles.subtitle}>Configure work timings, leave policies, and attendance rules</p>
            </div>

            {/* PART 2: PILL TABS */}
            <div style={styles.tabContainer}>
                {["Work Timings", "Leave Configuration", "Attendance Rules"].map(tab => (
                    <div 
                        key={tab} 
                        onClick={() => setActiveTab(tab)}
                        style={{...styles.tab, ...(activeTab === tab ? styles.activeTab : {})}}
                    >
                        {tab}
                    </div>
                ))}
            </div>

            {/* PART 3, 4, 5: CONTENT */}
            <div style={styles.contentArea}>
                {activeTab === "Work Timings" && renderWorkTimings()}
                {activeTab === "Leave Configuration" && renderLeaveConfig()}
                {activeTab === "Attendance Rules" && renderAttendanceRules()}
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '10px' },
    header: { marginBottom: '25px' },
    title: { margin: 0, fontWeight: 800, fontSize: '24px' },
    subtitle: { margin: '4px 0 0', color: '#666', fontSize: '14px' },

    tabContainer: { 
        display: 'flex', background: '#f3f4f6', padding: '5px', 
        borderRadius: '999px', width: 'fit-content', marginBottom: '30px' 
    },
    tab: { 
        padding: '8px 24px', borderRadius: '999px', cursor: 'pointer', 
        fontSize: '14px', fontWeight: 600, color: '#666', transition: '0.2s' 
    },
    activeTab: { background: '#fff', color: '#7D3C98', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },

    section: { background: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f1f1' },
    sectionTitle: { margin: '0 0 25px 0', fontSize: '18px', fontWeight: 700, color: '#333' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    formGroup: { marginBottom: '20px' },
    label: { display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#444' },
    input: { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#f8f9fa', boxSizing: 'border-box' },
    helper: { display: 'block', marginTop: '6px', fontSize: '11px', color: '#999' },
    
    infoBoxBlue: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '20px', color: '#1e40af', marginTop: '30px' },
    infoBoxGreen: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px', color: '#166534', marginTop: '30px' },
    
    btnRow: { display: 'flex', justifyContent: 'flex-end', marginTop: '30px' },
    saveBtn: { background: 'linear-gradient(135deg, #7D3C98, #5B2C6F)', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 },
    cancelBtn: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '10px 20px', fontWeight: 600 },

    leaveCard: { border: '1px solid #eee', borderRadius: '12px', padding: '20px', marginBottom: '15px' },
    leaveCardContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    badgeGray: { background: '#f3f4f6', color: '#666', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 },
    badgePurp: { background: '#f3e8ff', color: '#7D3C98', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#999' },
    addTypeBtn: { width: '100%', padding: '15px', background: '#fff', border: '2px dashed #ddd', borderRadius: '12px', cursor: 'pointer', color: '#7D3C98', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' },
    
    gridSummary: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginTop: '20px' },
    summaryCard: { background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f1f1f1', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }
};

export default SystemConfig;
