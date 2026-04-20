import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download } from 'lucide-react';

const AttendanceManagement = () => {
    const [monthlyData, setMonthlyData] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // ISSUE 1 FIX: CSV EXPORT
    const handleExport = () => {
        const headers = ["Employee Name", "Employee ID", "Total", "Present", "Late", "Absent", "Half Day", "Late Min", "Rate"];
        const csvContent = [
            headers.join(","),
            ...monthlyData.map(d => {
                const total = Number(d.total) || 0;
                const present = Number(d.present) || 0;
                const rate = total ? Math.round((present / total) * 100) : 0;
                return `"${d.name}","${d.employee_id}","${d.total}","${d.present}","${d.late}","${d.absent}","${d.half}","${d.late_minutes || 0}","${rate}%"`;
            })
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `monthly_attendance_summary_${selectedMonth}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        const fetchMonthlySummary = async () => {
            try {
                const res = await axios.get(`http://127.0.0.1:5000/api/attendance/monthly-summary?month=${selectedMonth}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                setMonthlyData(res.data);
            } catch (err) { console.error(err); }
        };
        fetchMonthlySummary();
    }, [selectedMonth]);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Attendance Tracking</h2>
                    <p style={styles.subtitle}>Monthly attendance summary</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <button style={styles.exportBtn} onClick={handleExport} disabled={!monthlyData?.length}>
                        <Download size={16} /> Export Report
                    </button>
                </div>
            </div>

            {/* ... Existing Stat Cards ... */}

            {/* NEW MONTHLY SUMMARY SECTION */}
            <div style={{...styles.tableCard, marginTop: '30px'}}>
                <h3 style={styles.sectionTitle}>Monthly Attendance Summary</h3>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Employee</th>
                            <th style={styles.th}>Total</th>
                            <th style={styles.th}>Present</th>
                            <th style={styles.th}>Late</th>
                            <th style={styles.th}>Absent</th>
                            <th style={styles.th}>Half Day</th>
                            <th style={styles.th}>Late Min</th>
                            <th style={styles.th}>Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {monthlyData.map((row, idx) => {
                            const rate = Math.round((row.present / row.total) * 100) || 0;
                            return (
                                <tr key={idx} style={styles.tr}>
                                    <td style={styles.td}>
                                        <div style={{fontWeight: '600'}}>{row.name}</div>
                                        <div style={{fontSize: '0.8em', color: '#888'}}>{row.employee_id}</div>
                                    </td>
                                    <td style={styles.td}>{row.total}</td>
                                    <td style={styles.td}><span style={styles.sumBadge}>{row.present}</span></td>
                                    <td style={styles.td}><span style={{...styles.sumBadge, background: '#fef3c7'}}> {row.late}</span></td>
                                    <td style={styles.td}><span style={{...styles.sumBadge, background: '#fee2e2'}}> {row.absent}</span></td>
                                    <td style={styles.td}><span style={{...styles.sumBadge, background: '#f3e8ff'}}> {row.half}</span></td>
                                    <td style={styles.td}>{row.late_minutes || 0}</td>
                                    <td style={styles.td}>
                                        <div style={{display:'flex', alignItems:'center', gap: '8px'}}>
                                            <div style={styles.progressBg}>
                                                <div style={{
                                                    ...styles.progressFill, 
                                                    width: `${rate}%`,
                                                    background: rate > 80 ? '#22c55e' : rate > 50 ? '#f59e0b' : '#ef4444'
                                                }} />
                                            </div>
                                            <span style={{fontSize: '12px', fontWeight: '700'}}>{rate}%</span>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '10px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { margin: 0, fontWeight: '700' },
    subtitle: { margin: '4px 0 0', color: '#666', fontSize: '0.9em' },
    exportBtn: { background: 'linear-gradient(135deg, #7D3C98, #5B2C6F)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' },
    tableCard: { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
    sectionTitle: { margin: '0 0 16px', fontSize: '1.1em', color: "#7D3C98" },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', color: "var(--text)" , fontSize: '11px', textTransform: 'uppercase', borderBottom: '2px solid #f8f9fa' },
    td: { padding: '12px', borderBottom: '1px solid #f0f0f0', fontSize: '14px' },
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },
    sumBadge: { background: '#dcfce7', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' },
    progressBg: { width: '80px', height: '6px', background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: '10px', transition: '0.5s' }
};

export default AttendanceManagement;
