import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCheck, AlertTriangle, UserX, Download } from 'lucide-react';

const AttendanceManagement = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const res = await axios.get(`http://127.0.0.1:5000/api/attendance/all?date=${selectedDate}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                setAttendanceData(res.data);
            } catch (err) { console.error(err); }
        };
        fetchAttendance();
    }, [selectedDate]);

    // ISSUE 1 FIX: CSV EXPORT
    const handleExport = () => {
        const headers = ["Employee Name", "Employee ID", "Date", "Check In", "Check Out", "Work Hours", "Status"];
        const csvContent = [
            headers.join(","),
            ...attendanceData.map(d => 
                `"${d.name}","${d.employee_id}","${d.date}","${d.check_in || '--'}","${d.check_out || '--'}","${d.work_hours || '0h'}","${d.status}"`
            )
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `attendance_report_${selectedDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ISSUE 2 FIX: MONTHLY SUMMARY CALCULATION
    const getMonthlySummary = () => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const summaryMap = attendanceData.reduce((acc, curr) => {
            const date = new Date(curr.date);
            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                if (!acc[curr.employee_id]) {
                    acc[curr.employee_id] = { 
                        name: curr.name, id: curr.employee_id, total: 0, 
                        present: 0, late: 0, absent: 0, half: 0 
                    };
                }
                const emp = acc[curr.employee_id];
                emp.total += 1;
                if (curr.status === "Present") emp.present += 1;
                else if (curr.status === "Late") emp.late += 1;
                else if (curr.status === "Absent") emp.absent += 1;
                else if (curr.status === "Half Day") emp.half += 1;
            }
            return acc;
        }, {});

        return Object.values(summaryMap);
    };

    const monthlyData = getMonthlySummary();

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Attendance Tracking</h2>
                    <p style={styles.subtitle}>Daily and Monthly organization logs</p>
                </div>
                <button style={styles.exportBtn} onClick={handleExport}>
                    <Download size={16} /> Export Report
                </button>
            </div>

            {/* ... Existing Stat Cards ... */}

            <div style={styles.tableCard}>
                <h3 style={styles.sectionTitle}>Daily Logs</h3>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Employee</th>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>Check In</th>
                            <th style={styles.th}>Check Out</th>
                            <th style={styles.th}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendanceData.map((row, idx) => (
                            <tr key={idx} style={styles.tr}>
                                <td style={styles.td}><b>{row.name}</b></td>
                                <td style={styles.td}>{row.date}</td>
                                <td style={styles.td}>{row.check_in || '--'}</td>
                                <td style={styles.td}>{row.check_out || '--'}</td>
                                <td style={styles.td}>
                                    <span style={{...styles.badge, background: row.status === 'Present' ? '#dcfce7' : '#fee2e2', color: row.status === 'Present' ? '#166534' : '#991b1b'}}>{row.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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
                                        <div style={{fontSize: '0.8em', color: '#888'}}>{row.id}</div>
                                    </td>
                                    <td style={styles.td}>{row.total}</td>
                                    <td style={styles.td}><span style={styles.sumBadge}>{row.present}</span></td>
                                    <td style={styles.td}><span style={{...styles.sumBadge, background: '#fef3c7'}}> {row.late}</span></td>
                                    <td style={styles.td}><span style={{...styles.sumBadge, background: '#fee2e2'}}> {row.absent}</span></td>
                                    <td style={styles.td}><span style={{...styles.sumBadge, background: '#f3e8ff'}}> {row.half}</span></td>
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
    sectionTitle: { margin: '0 0 16px', fontSize: '1.1em', color: '#7D3C98' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', color: '#7D3C98', fontSize: '11px', textTransform: 'uppercase', borderBottom: '2px solid #f8f9fa' },
    td: { padding: '12px', borderBottom: '1px solid #f0f0f0', fontSize: '14px' },
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },
    sumBadge: { background: '#dcfce7', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' },
    progressBg: { width: '80px', height: '6px', background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: '10px', transition: '0.5s' }
};

export default AttendanceManagement;