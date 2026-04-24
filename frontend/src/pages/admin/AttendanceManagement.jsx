import React, { useEffect, useMemo, useState } from "react";
import { FaCalendarAlt, FaClock, FaDownload, FaSyncAlt, FaWallet } from "react-icons/fa";

import {
  getAdminAttendanceForDate,
  getAllEmployees,
  getMonthlyAttendanceSummary,
} from "../../services/api";

const getTodayString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const AttendanceManagement = ({ showNotify }) => {
  const [employees, setEmployees] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [selectedMonth, setSelectedMonth] = useState(getTodayString().slice(0, 7));
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = async ({ withLoader = true, announce = false } = {}) => {
    if (withLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const [employeeRows, dailyRows, monthlyRows] = await Promise.all([
        getAllEmployees(),
        getAdminAttendanceForDate(selectedDate),
        getMonthlyAttendanceSummary(selectedMonth),
      ]);

      setEmployees(employeeRows);
      setDailyData(dailyRows);
      setMonthlyData(monthlyRows);

      if (announce) {
        showNotify?.("Attendance data refreshed");
      }
    } catch (err) {
      setError(err.message || "Failed to load attendance data");
    } finally {
      if (withLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedMonth]);

  const filteredDailyData = useMemo(() => {
    if (selectedEmployee === "all") {
      return dailyData;
    }
    return dailyData.filter((row) => row.employee_id === selectedEmployee);
  }, [dailyData, selectedEmployee]);

  const dailyStats = useMemo(() => {
    return filteredDailyData.reduce(
      (acc, row) => {
        if (row.status === "Present") acc.present += 1;
        if (row.status === "Late") acc.late += 1;
        if (row.status === "Half Day") acc.half += 1;
        if (row.status === "Absent") acc.absent += 1;
        return acc;
      },
      { present: 0, late: 0, half: 0, absent: 0 }
    );
  }, [filteredDailyData]);

  const handleExport = () => {
    const headers = [
      "Employee Name",
      "Employee ID",
      "Total",
      "Present",
      "Late",
      "Absent",
      "Half Day",
      "Late Minutes",
      "Wallet Left",
      "Attendance Rate",
    ];

    const csvContent = [
      headers.join(","),
      ...monthlyData.map((row) => {
        const total = Number(row.total) || 0;
        const completedDays = Number(row.present || 0) + Number(row.late || 0) + Number(row.half || 0);
        const rate = total ? Math.round((completedDays / total) * 100) : 0;
        return [
          row.name,
          row.employee_id,
          row.total,
          row.present,
          row.late,
          row.absent,
          row.half,
          row.late_minutes || 0,
          row.wallet_left || 0,
          `${rate}%`,
        ]
          .map((item) => `"${item}"`)
          .join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_summary_${selectedMonth}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotify?.("Attendance summary exported");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Attendance Tracking</h2>
          <p style={styles.subtitle}>Daily attendance status and monthly summary from the database</p>
        </div>

        <div style={styles.headerActions}>
          <button
            type="button"
            style={styles.secondaryBtn}
            onClick={() => loadData({ withLoader: false, announce: true })}
            disabled={refreshing}
          >
            <FaSyncAlt />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" style={styles.exportBtn} onClick={handleExport} disabled={!monthlyData.length}>
            <FaDownload />
            Export Report
          </button>
        </div>
      </div>

      <div style={styles.filtersCard}>
        <div style={styles.filterGrid}>
          <div>
            <label style={styles.label}>Date</label>
            <div style={styles.inputWrap}>
              <FaCalendarAlt style={styles.inputIcon} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div>
            <label style={styles.label}>Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              style={styles.select}
            >
              <option value="all">All Employees</option>
              {employees.map((employee) => (
                <option key={employee.employee_id} value={employee.employee_id}>
                  {employee.name} ({employee.employee_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Summary Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div style={styles.loadingCard}>Loading attendance data...</div>
      ) : (
        <>
          <div style={styles.statsGrid}>
            <StatsCard label="Present" value={dailyStats.present} tone="#16a34a" bg="#dcfce7" />
            <StatsCard label="Late" value={dailyStats.late} tone="#d97706" bg="#fef3c7" />
            <StatsCard label="Half Day" value={dailyStats.half} tone="#7e22ce" bg="#f3e8ff" />
            <StatsCard label="Absent" value={dailyStats.absent} tone="#dc2626" bg="#fee2e2" />
          </div>

          <div style={styles.tableCard}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionTitleWrap}>
                <FaClock />
                <h3 style={styles.sectionTitle}>Daily Attendance</h3>
              </div>
              <span style={styles.sectionSubtle}>{selectedDate}</span>
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Employee</th>
                    <th style={styles.th}>Clock In</th>
                    <th style={styles.th}>Clock Out</th>
                    <th style={styles.th}>Work Hours</th>
                    <th style={styles.th}>Late Min</th>
                    <th style={styles.th}>Wallet Left</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDailyData.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={styles.noData}>
                        No attendance data found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredDailyData.map((row) => (
                      <tr key={`${row.employee_id}-${row.date}`} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.employeeCell}>
                            <div style={styles.avatar}>{getInitials(row.name)}</div>
                            <div>
                              <div style={styles.employeeName}>{row.name}</div>
                              <div style={styles.employeeMeta}>{row.employee_id}</div>
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>{formatTime(row.check_in)}</td>
                        <td style={styles.td}>{formatTime(row.check_out)}</td>
                        <td style={styles.td}>{formatHours(row.work_hours)}</td>
                        <td style={styles.td}>{row.late_minutes || 0}</td>
                        <td style={styles.td}>
                          <div style={styles.walletCell}>
                            <FaWallet />
                            <span>{row.wallet_remaining ?? 0} min</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.statusBadge, ...statusStyles[row.status] }}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ ...styles.tableCard, marginTop: "24px" }}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionTitleWrap}>
                <FaCalendarAlt />
                <h3 style={styles.sectionTitle}>Monthly Attendance Summary</h3>
              </div>
              <span style={styles.sectionSubtle}>{selectedMonth}</span>
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Employee</th>
                    <th style={styles.th}>Total</th>
                    <th style={styles.th}>Present</th>
                    <th style={styles.th}>Late</th>
                    <th style={styles.th}>Half Day</th>
                    <th style={styles.th}>Late Min</th>
                    <th style={styles.th}>Wallet Left</th>
                    <th style={styles.th}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={styles.noData}>
                        No monthly attendance summary available.
                      </td>
                    </tr>
                  ) : (
                    monthlyData.map((row) => {
                      const total = Number(row.total) || 0;
                      const completedDays =
                        Number(row.present || 0) + Number(row.late || 0) + Number(row.half || 0);
                      const rate = total ? Math.round((completedDays / total) * 100) : 0;

                      return (
                        <tr key={row.employee_id} style={styles.tr}>
                          <td style={styles.td}>
                            <div style={styles.employeeName}>{row.name}</div>
                            <div style={styles.employeeMeta}>{row.employee_id}</div>
                          </td>
                          <td style={styles.td}>{row.total}</td>
                          <td style={styles.td}>{row.present}</td>
                          <td style={styles.td}>{row.late}</td>
                          <td style={styles.td}>{row.half}</td>
                          <td style={styles.td}>{row.late_minutes || 0}</td>
                          <td style={styles.td}>{row.wallet_left || 0}</td>
                          <td style={styles.td}>
                            <div style={styles.rateWrap}>
                              <div style={styles.rateTrack}>
                                <div
                                  style={{
                                    ...styles.rateFill,
                                    width: `${rate}%`,
                                    background: rate >= 80 ? "#22c55e" : rate >= 50 ? "#f59e0b" : "#ef4444",
                                  }}
                                />
                              </div>
                              <span style={styles.rateText}>{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const StatsCard = ({ label, value, tone, bg }) => (
  <div style={styles.statCard}>
    <div style={{ ...styles.statValue, color: tone }}>{value}</div>
    <div style={styles.statLabel}>{label}</div>
    <div style={{ ...styles.statAccent, background: bg }} />
  </div>
);

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
};

const formatTime = (value) => {
  if (!value) return "--";
  const [hours = "00", minutes = "00"] = String(value).split(":");
  const hourNumber = Number(hours);
  const period = hourNumber >= 12 ? "PM" : "AM";
  const displayHour = hourNumber % 12 || 12;
  return `${displayHour}:${minutes} ${period}`;
};

const formatHours = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--";
  }
  return `${Number(value).toFixed(2)}h`;
};

const statusStyles = {
  Present: { background: "#dcfce7", color: "#15803d" },
  Late: { background: "#fef3c7", color: "#b45309" },
  "Half Day": { background: "#f3e8ff", color: "#7e22ce" },
  Absent: { background: "#fee2e2", color: "#dc2626" },
};

const styles = {
  container: { padding: "10px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  title: { margin: 0, fontWeight: 800, fontSize: "24px" },
  subtitle: { margin: "4px 0 0", color: "#666", fontSize: "14px" },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  exportBtn: {
    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  secondaryBtn: {
    background: "#fff",
    color: "#334155",
    border: "1px solid #dbe2ea",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  filtersCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 6px 22px rgba(0,0,0,0.05)",
    border: "1px solid #eef2f7",
    marginBottom: "18px",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "13px",
    fontWeight: 700,
    color: "#334155",
  },
  inputWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid #dbe2ea",
    borderRadius: "12px",
    padding: "0 14px",
    background: "#fff",
  },
  inputIcon: {
    color: "#64748b",
  },
  input: {
    width: "100%",
    padding: "12px 0",
    borderRadius: "12px",
    border: "none",
    background: "transparent",
    outline: "none",
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #dbe2ea",
    background: "#fff",
    outline: "none",
  },
  errorBanner: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "14px",
    padding: "14px 16px",
    marginBottom: "18px",
    fontWeight: 600,
  },
  loadingCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "22px",
    boxShadow: "0 6px 22px rgba(0,0,0,0.05)",
    border: "1px solid #eef2f7",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "18px",
  },
  statCard: {
    position: "relative",
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 6px 22px rgba(0,0,0,0.05)",
    border: "1px solid #eef2f7",
    overflow: "hidden",
  },
  statValue: {
    fontSize: "2rem",
    fontWeight: 800,
    marginBottom: "8px",
  },
  statLabel: {
    color: "#64748b",
    fontWeight: 700,
  },
  statAccent: {
    position: "absolute",
    inset: "auto 0 0 0",
    height: "5px",
  },
  tableCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 6px 22px rgba(0,0,0,0.05)",
    border: "1px solid #eef2f7",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  sectionTitleWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#0f172a",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 800,
  },
  sectionSubtle: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    color: "#64748b",
    fontSize: "11px",
    textTransform: "uppercase",
    borderBottom: "1px solid #e5e7eb",
    letterSpacing: "0.06em",
  },
  tr: {
    transition: "background 0.2s ease",
  },
  td: {
    padding: "14px 12px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
    color: "#0f172a",
  },
  noData: {
    padding: "28px 12px",
    textAlign: "center",
    color: "#64748b",
  },
  employeeCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #a855f7)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
  },
  employeeName: {
    fontWeight: 700,
  },
  employeeMeta: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "3px",
  },
  walletCell: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    color: "#334155",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "7px 12px",
    minWidth: "96px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
  },
  rateWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  rateTrack: {
    width: "90px",
    height: "8px",
    borderRadius: "999px",
    background: "#e5e7eb",
    overflow: "hidden",
  },
  rateFill: {
    height: "100%",
    borderRadius: "999px",
  },
  rateText: {
    fontSize: "12px",
    fontWeight: 800,
  },
};

export default AttendanceManagement;
