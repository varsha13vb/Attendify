import { useEffect, useMemo, useState } from "react";
import { FaCalendarAlt, FaClock, FaHistory, FaSignInAlt, FaSignOutAlt, FaWallet } from "react-icons/fa";

import Layout from "../components/Layout";
import {
  clockInAttendance,
  clockOutAttendance,
  getAttendance,
  getTodayAttendanceStatus,
} from "../services/api";

function Attendance() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [clock, setClock] = useState(new Date());

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch {
      return null;
    }
  }, []);

  const loadData = async ({ withLoader = true } = {}) => {
    if (withLoader) {
      setLoading(true);
    }

    try {
      const [history, status] = await Promise.all([
        getAttendance(),
        getTodayAttendanceStatus(),
      ]);

      setAttendanceData(Array.isArray(history) ? history : []);
      setTodayStatus(status);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "Failed to load attendance data",
      });
    } finally {
      if (withLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const handleAttendanceAction = async (action) => {
    setSubmitting(true);
    setFeedback(null);

    try {
      const response = action === "in" ? await clockInAttendance() : await clockOutAttendance();
      setFeedback({ type: "success", message: response.message });
      await loadData({ withLoader: false });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "Action failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const todayRecord = todayStatus?.record;
  const wallet = todayStatus?.wallet;
  const currentStatus = todayRecord?.status || "Not Marked";
  const canClockIn = Boolean(todayStatus?.can_clock_in) && !submitting;
  const canClockOut = Boolean(todayStatus?.can_clock_out) && Boolean(todayRecord?.check_in) && !submitting;

  return (
    <Layout>
      <div style={styles.wrapper}>
        <div style={styles.heroCard}>
          <div style={styles.heroBar}>
            <div style={styles.heroTitleWrap}>
              <FaClock />
              <span style={styles.heroTitle}>Employee Check In/Out</span>
            </div>
            <span style={styles.heroNote}>Attendance is recorded using server time.</span>
          </div>

          <div style={styles.heroBody}>
            <div style={styles.clockPanel}>
              <div style={styles.clockTime}>
                {clock.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
              <div style={styles.clockDate}>
                <FaCalendarAlt />
                <span>
                  {clock.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div style={styles.employeeField}>
              <label style={styles.label}>Employee</label>
              <div style={styles.employeeSelect}>
                {user?.name || todayStatus?.employee?.name || "Employee"}{" "}
                <span style={styles.employeeId}>
                  {user?.employee_id || todayStatus?.employee?.employee_id || ""}
                </span>
              </div>
            </div>

            <div style={styles.actionRow}>
              <div style={styles.actionCard}>
                <div style={styles.actionCardLabel}>Check In</div>
                <button
                  type="button"
                  style={{
                    ...styles.actionButton,
                    ...styles.clockInButton,
                    ...(!canClockIn ? styles.disabledAction : {}),
                  }}
                  onClick={() => handleAttendanceAction("in")}
                  disabled={!canClockIn}
                >
                  <FaSignInAlt />
                  {submitting ? "Processing..." : "Clock In"}
                </button>
              </div>

              <div style={styles.actionCard}>
                <div style={styles.actionCardLabel}>Check Out</div>
                <button
                  type="button"
                  style={{
                    ...styles.actionButton,
                    ...styles.clockOutButton,
                    ...(!canClockOut ? styles.disabledAction : {}),
                  }}
                  onClick={() => handleAttendanceAction("out")}
                  disabled={!canClockOut}
                >
                  <FaSignOutAlt />
                  {submitting ? "Processing..." : "Clock Out"}
                </button>
              </div>
            </div>

            {feedback && (
              <div
                style={{
                  ...styles.feedback,
                  ...(feedback.type === "error" ? styles.feedbackError : styles.feedbackSuccess),
                }}
              >
                {feedback.message}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={styles.loadingCard}>Loading attendance...</div>
        ) : (
          <>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>Today&apos;s Status</div>
                <div style={styles.summaryValue}>
                  <span style={{ ...styles.statusBadge, ...statusStyles[currentStatus] }}>
                    {currentStatus}
                  </span>
                </div>
                <div style={styles.summarySubtext}>
                  Scheduled {todayStatus?.schedule?.check_in || "--:--"} to{" "}
                  {todayStatus?.schedule?.check_out || "--:--"}
                </div>
              </div>

              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>Today&apos;s Record</div>
                <div style={styles.summaryValueSmall}>
                  In: {formatTime(todayRecord?.check_in)} | Out: {formatTime(todayRecord?.check_out)}
                </div>
                <div style={styles.summarySubtext}>
                  Work Hours: {formatHours(todayRecord?.work_hours)} | Late: {todayRecord?.late_minutes || 0} min
                </div>
              </div>

              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>
                  <FaWallet style={{ marginRight: "8px" }} />
                  Late Wallet Left
                </div>
                <div style={styles.summaryValue}>{wallet?.remaining_minutes ?? 0} min</div>
                <div style={styles.summarySubtext}>
                  Used {wallet?.used_minutes ?? 0} of {wallet?.monthly_limit ?? 0} this month
                </div>
              </div>
            </div>

            <div style={styles.historyCard}>
              <div style={styles.historyHeader}>
                <div style={styles.historyTitleWrap}>
                  <FaHistory />
                  <h3 style={styles.historyTitle}>Attendance History</h3>
                </div>
              </div>

              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Check In</th>
                      <th style={styles.th}>Check Out</th>
                      <th style={styles.th}>Work Hours</th>
                      <th style={styles.th}>Late Minutes</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={styles.noData}>
                          No attendance records found yet.
                        </td>
                      </tr>
                    ) : (
                      attendanceData.map((record, index) => (
                        <tr key={`${record.date}-${index}`} style={styles.tr}>
                          <td style={styles.td}>{record.date}</td>
                          <td style={styles.td}>{formatTime(record.check_in)}</td>
                          <td style={styles.td}>{formatTime(record.check_out)}</td>
                          <td style={styles.td}>{formatHours(record.work_hours)}</td>
                          <td style={styles.td}>{record.late_minutes || 0}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.statusBadge, ...statusStyles[record.status || "Present"] }}>
                              {record.status || "Present"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

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
  Present: { backgroundColor: "#dcfce7", color: "#15803d" },
  Late: { backgroundColor: "#fef3c7", color: "#b45309" },
  "Half Day": { backgroundColor: "#f3e8ff", color: "#7e22ce" },
  Absent: { backgroundColor: "#fee2e2", color: "#dc2626" },
  "Not Marked": { backgroundColor: "#e5e7eb", color: "#4b5563" },
};

const styles = {
  wrapper: {
    padding: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  heroCard: {
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
    border: "1px solid rgba(125, 60, 152, 0.18)",
    marginBottom: "24px",
  },
  heroBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "18px 24px",
    background: "linear-gradient(180deg, #7D3C98, #5B2C6F)",
    color: "#fff",
    flexWrap: "wrap",
  },
  heroTitleWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "1.5rem",
    fontWeight: 700,
  },
  heroTitle: {
    lineHeight: 1,
  },
  heroNote: {
    fontSize: "0.9rem",
    opacity: 0.9,
  },
  heroBody: {
    padding: "28px",
  },
  clockPanel: {
    background: "linear-gradient(135deg, rgba(125, 60, 152, 0.08), rgba(91, 44, 111, 0.14))",
    borderRadius: "20px",
    padding: "32px 24px",
    textAlign: "center",
    marginBottom: "28px",
    border: "1px solid rgba(125, 60, 152, 0.14)",
  },
  clockTime: {
    fontSize: "clamp(2.8rem, 7vw, 4.25rem)",
    fontWeight: 300,
    color: "#111827",
    marginBottom: "10px",
  },
  clockDate: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    color: "#64748b",
    fontSize: "1.05rem",
  },
  employeeField: {
    marginBottom: "22px",
  },
  label: {
    display: "block",
    marginBottom: "10px",
    fontSize: "1rem",
    fontWeight: 700,
    color: "#111827",
  },
  employeeSelect: {
    width: "100%",
    border: "1px solid rgba(125, 60, 152, 0.2)",
    borderRadius: "14px",
    padding: "16px 18px",
    fontSize: "1rem",
    color: "#5B2C6F",
    background: "linear-gradient(135deg, rgba(125, 60, 152, 0.05), rgba(91, 44, 111, 0.08))",
    boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.04)",
  },
  employeeId: {
    color: "#64748b",
    fontSize: "0.92rem",
    marginLeft: "10px",
  },
  actionRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 220px))",
    justifyContent: "start",
    gap: "16px",
    marginBottom: "18px",
  },
  actionCard: {
    background: "linear-gradient(180deg, #7D3C98, #5B2C6F)",
    borderRadius: "20px",
    padding: "14px",
    boxShadow: "0 16px 30px rgba(91, 44, 111, 0.22)",
    border: "1px solid rgba(125, 60, 152, 0.24)",
  },
  actionCardLabel: {
    color: "rgba(255,255,255,0.82)",
    fontSize: "0.9rem",
    fontWeight: 700,
    marginBottom: "10px",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "15px 16px",
    borderRadius: "16px",
    fontSize: "1.15rem",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    transition: "transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease",
    width: "100%",
  },
  clockInButton: {
    background: "linear-gradient(180deg, #7D3C98, #5B2C6F)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 12px 22px rgba(0, 0, 0, 0.18)",
  },
  clockOutButton: {
    background: "linear-gradient(180deg, #7D3C98, #5B2C6F)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 12px 22px rgba(0, 0, 0, 0.18)",
  },
  disabledAction: {
    opacity: 0.42,
    cursor: "not-allowed",
    boxShadow: "none",
    filter: "grayscale(0.1)",
  },
  feedback: {
    borderRadius: "14px",
    padding: "14px 16px",
    fontWeight: 600,
  },
  feedbackSuccess: {
    background: "#ecfdf5",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },
  feedbackError: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
  loadingCard: {
    background: "#ffffff",
    padding: "28px",
    borderRadius: "20px",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e5e7eb",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },
  summaryCard: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "22px",
    border: "1px solid rgba(125, 60, 152, 0.18)",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  },
  summaryLabel: {
    display: "flex",
    alignItems: "center",
    color: "#64748b",
    fontWeight: 700,
    marginBottom: "14px",
  },
  summaryValue: {
    fontSize: "2rem",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "10px",
  },
  summaryValueSmall: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "10px",
  },
  summarySubtext: {
    color: "#64748b",
    fontSize: "0.95rem",
  },
  historyCard: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "22px",
    border: "1px solid rgba(125, 60, 152, 0.18)",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },
  historyTitleWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#0f172a",
  },
  historyTitle: {
    margin: 0,
    fontSize: "1.2rem",
    fontWeight: 800,
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "14px 12px",
    textAlign: "left",
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#7D3C98",
    borderBottom: "1px solid rgba(125, 60, 152, 0.14)",
  },
  tr: {
    transition: "background 160ms ease",
  },
  td: {
    padding: "16px 12px",
    borderBottom: "1px solid #eef2f7",
    color: "#111827",
    fontSize: "0.95rem",
  },
  noData: {
    padding: "32px 12px",
    textAlign: "center",
    color: "#64748b",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "8px 12px",
    minWidth: "100px",
    fontWeight: 700,
    fontSize: "0.85rem",
  },
};

export default Attendance;
