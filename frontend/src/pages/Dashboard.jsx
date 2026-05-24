import { useEffect, useMemo, useState } from "react";

import Chart from "react-apexcharts";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import Layout from "../components/Layout";
import {
  getAdminDashboardSummary,
  getAttendance,
  getLeaves,
  getUpcomingHolidays,
  getWalletInfo,
} from "../services/api";
import "./Dashboard.css";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    return null;
  }
};

const getDateKey = (dayValue) => {
  const offset = dayValue.getTimezoneOffset() * 60000;
  return new Date(dayValue.getTime() - offset).toISOString().slice(0, 10);
};

const getLastNDates = (count) => {
  const days = [];
  const today = new Date();
  for (let index = count - 1; index >= 0; index -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - index);
    days.push(day);
  }
  return days;
};

const formatChartDateLabel = (dayValue) =>
  dayValue.toLocaleDateString("en-US", { month: "short", day: "2-digit" });

function Dashboard() {
  const user = useMemo(() => getStoredUser(), []);
  const isAdmin = user?.role === "admin";

  const [dashboardData, setDashboardData] = useState({
    summaryCards: [],
    chartLabels: [],
    attendanceSeries: [],
    trendSeries: [],
    pieSeries: [0, 0],
    leaveRows: [],
    holidays: [],
    leaveColumns: [],
    headerTitle: `Welcome back, ${user?.name || "User"}`,
    headerSubtitle: "",
    chartTitles: {
      attendance: "Weekly Attendance",
      pie: "Late Usage",
      trend: "Trend Analysis",
      leaves: "Leave Requests",
    },
  });
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const holidayDateKeys = useMemo(
    () => new Set((dashboardData.holidays || []).map((holiday) => holiday.date)),
    [dashboardData.holidays]
  );

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      try {
        const holidays = await getUpcomingHolidays();

        if (isAdmin) {
          const adminSummary = await getAdminDashboardSummary();
          setDashboardData(buildAdminDashboardData(user, adminSummary, holidays));
        } else {
          const [attendance, wallet] = await Promise.all([
            getAttendance(),
            getWalletInfo(),
          ]);

          let leaveRows = [];
          if (user?.employee_id) {
            leaveRows = await getLeaves(user.employee_id);
          }

          setDashboardData(buildEmployeeDashboardData(user, attendance, wallet, leaveRows, holidays));
        }
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [isAdmin, user]);

  const SummaryCard = ({ id, title, value }) => (
    <div
      style={{
        ...styles.card,
        ...(hoveredCard === id ? styles.cardHover : {}),
      }}
      onMouseEnter={() => setHoveredCard(id)}
      onMouseLeave={() => setHoveredCard(null)}
    >
      <span
        style={{
          ...styles.cardTitle,
          color: hoveredCard === id ? "#fff" : "#6b21a8",
        }}
      >
        {title}
      </span>
      <p
        style={{
          ...styles.cardValue,
          color: hoveredCard === id ? "#fff" : "#4c1d95",
        }}
      >
        {value}
      </p>
    </div>
  );

  return (
    <Layout>
      <div className="dashboard-page" style={styles.wrapper}>
        <div style={styles.header}>
          <h2 style={styles.heading}>{dashboardData.headerTitle}</h2>
          {dashboardData.headerSubtitle ? (
            <p style={styles.subheading}>{dashboardData.headerSubtitle}</p>
          ) : null}
        </div>

        {loading ? (
          <div style={styles.loadingCard}>Loading dashboard...</div>
        ) : (
          <>
            <div style={styles.summaryContainer}>
              {dashboardData.summaryCards.map((card, index) => (
                <SummaryCard key={card.title} id={index + 1} title={card.title} value={card.value} />
              ))}
            </div>

            <div style={styles.grid}>
              <div style={styles.box}>
                <h3 style={styles.boxTitle}>{dashboardData.chartTitles.attendance}</h3>
                <Chart
                  options={barOptions(dashboardData.chartLabels)}
                  series={[{ data: dashboardData.attendanceSeries }]}
                  type="bar"
                  height={220}
                />
              </div>

              <div style={styles.box}>
                <h3 style={styles.boxTitle}>{dashboardData.chartTitles.pie}</h3>
                <Chart options={pieOptions} series={dashboardData.pieSeries} type="pie" height={220} />
              </div>

              <div style={styles.box}>
                <h3 style={styles.boxTitle}>{dashboardData.chartTitles.trend}</h3>
                <Chart
                  options={lineOptions(dashboardData.chartLabels)}
                  series={[{ data: dashboardData.trendSeries }]}
                  type="line"
                  height={220}
                />
              </div>
            </div>

            <div style={styles.twoCol}>
              <div style={styles.box}>
                <h3 style={styles.boxTitle}>{dashboardData.chartTitles.leaves}</h3>

                <table style={styles.table}>
                  <thead>
                    <tr>
                      {dashboardData.leaveColumns.map((column) => (
                        <th key={column.key} style={styles.th}>
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.leaveRows.length === 0 ? (
                      <tr>
                        <td colSpan={dashboardData.leaveColumns.length || 1} style={styles.emptyCell}>
                          No leave requests found.
                        </td>
                      </tr>
                    ) : (
                      dashboardData.leaveRows.map((row, index) => (
                        <tr key={`${row.employee_id || row.from_date}-${index}`}>
                          {dashboardData.leaveColumns.map((column) => (
                            <td
                              key={column.key}
                              style={{
                                ...styles.td,
                                ...(column.key === "status"
                                  ? styles[(row.status || "pending").toLowerCase().replace(/\s+/g, "_")] || {}
                                  : {}),
                              }}
                            >
                              {row[column.key]}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ ...styles.box, padding: "20px" }}>
                <h3 style={styles.boxTitle}>Organization Calendar</h3>
                <Calendar
                  className="dashboard-calendar"
                  tileClassName={({ date, view }) => {
                    if (view !== "month") {
                      return null;
                    }

                    const classNames = [];

                    if (date.getDay() === 0) {
                      classNames.push("dashboard-calendar__tile--sunday");
                    }

                    if (holidayDateKeys.has(getDateKey(date))) {
                      classNames.push("dashboard-calendar__tile--holiday");
                    }

                    return classNames.join(" ") || null;
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

const buildEmployeeDashboardData = (user, attendance, wallet, leaves, holidays) => {
  const recentDays = getLastNDates(7);
  const chartLabels = recentDays.map((dayValue) => formatChartDateLabel(dayValue));

  const attendanceMap = new Map((attendance || []).map((item) => [item.date, item]));
  const attendanceSeries = recentDays.map((dayValue) => (attendanceMap.has(getDateKey(dayValue)) ? 1 : 0));
  const trendSeries = recentDays.map((dayValue) => {
    const record = attendanceMap.get(getDateKey(dayValue));
    return Number(record?.late_minutes || 0);
  });

  const lateUsed = Number(wallet?.used_minutes ?? 0);
  const monthlyLimit = Number(wallet?.monthly_limit ?? 45);
  const remaining = Math.max(Number(wallet?.remaining_minutes ?? monthlyLimit - lateUsed), 0);

  return {
    summaryCards: [
      { title: "Total Attendance", value: attendance?.length || 0 },
      { title: "Late Minutes", value: lateUsed },
      { title: "Remaining Wallet", value: remaining },
    ],
    chartLabels,
    attendanceSeries,
    trendSeries,
    pieSeries: [lateUsed, remaining],
    leaveRows: (leaves || []).slice(0, 6).map((leave) => ({
      from_date: leave.from_date,
      leave_type: leave.leave_type,
      status: leave.status,
    })),
    holidays: holidays || [],
    leaveColumns: [
      { key: "from_date", label: "From" },
      { key: "leave_type", label: "Type" },
      { key: "status", label: "Status" },
    ],
    headerTitle: `Welcome back, ${user?.name || "User"}`,
    headerSubtitle: "Your attendance, late wallet, and leave activity from the database.",
    chartTitles: {
      attendance: "Weekly Attendance",
      pie: "Late Usage",
      trend: "Late Trend",
      leaves: "Leave Requests",
    },
  };
};

const buildAdminDashboardData = (user, summaryResponse, holidays) => {
  const summary = summaryResponse?.summary || {};
  const charts = summaryResponse?.charts || {};

  return {
    summaryCards: [
      { title: "Total Employees", value: summary.employee_count ?? 0 },
      { title: "Present Today", value: summary.present_today ?? 0 },
      { title: "Pending Leaves", value: summary.pending_leaves ?? 0 },
      // { title: "Remaining Wallet", value: summary.monthly_wallet_remaining ?? 0 },
    ],
    chartLabels: charts.labels || [],
    attendanceSeries: charts.attendance_counts || [],
    trendSeries: charts.late_counts || [],
    pieSeries: [
      Number(summary.monthly_late_used ?? 0),
      Number(summary.monthly_wallet_remaining ?? 0),
    ],
    leaveRows: (summaryResponse?.leave_requests || []).map((leave) => ({
      name: leave.name,
      from_date: leave.from_date,
      leave_type: leave.leave_type,
      status: leave.status,
    })),
    holidays: holidays || [],
    leaveColumns: [
      { key: "name", label: "Employee" },
      { key: "from_date", label: "From" },
      { key: "leave_type", label: "Type" },
      { key: "status", label: "Status" },
    ],
    headerTitle: `Admin overview, ${user?.name || "Admin"}`,
    headerSubtitle: `Today: ${summary.present_today ?? 0} present, ${summary.late_today ?? 0} late, ${summary.absent_today ?? 0} absent.`,
    chartTitles: {
      attendance: "Last 7 Days Attendance",
      pie: "Monthly Wallet Usage",
      trend: "Late Arrivals Trend",
      leaves: "Recent Leave Requests",
    },
  };
};

const commonOptions = {
  chart: {
    toolbar: { show: false },
    fontFamily: "Inter, sans-serif",
  },
  colors: ["#7c3aed"],
  stroke: { curve: "smooth", width: 3 },
  markers: { size: 4 },
};

const barOptions = (labels) => ({
  ...commonOptions,
  xaxis: { categories: labels || [] },
});

const lineOptions = (labels) => ({
  ...commonOptions,
  xaxis: { categories: labels || [] },
});

const pieOptions = {
  ...commonOptions,
  labels: ["Used", "Remaining"],
  colors: ["#7c3aed", "#ddd6fe"],
  legend: { position: "bottom" },
};

const styles = {
  wrapper: {
    width: "100%",
    maxWidth: "94%",
    margin: "0 auto",
    padding: "2em",
    minHeight: "100%",
    backgroundColor: "#f9fafb",
  },
  header: {
    marginBottom: "2em",
  },
  heading: {
    fontSize: "1.8em",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "6px",
  },
  subheading: {
    color: "#64748b",
    fontSize: "0.98rem",
  },
  loadingCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
    border: "1px solid #f3f4f6",
  },
  summaryContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  },
  card: {
    background: "linear-gradient(135deg, #f5eef8, #ebdef0)",
    padding: "20px",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  cardHover: {
    background: "linear-gradient(135deg, #7D3C98, #5B2C6F)",
    transform: "translateY(-4px)",
    boxShadow: "0 10px 25px rgba(124, 58, 237, 0.3)",
  },
  cardTitle: {
    fontSize: "0.95em",
    fontWeight: "600",
    marginBottom: "8px",
    transition: "color 0.3s ease",
  },
  cardValue: {
    fontSize: "2em",
    fontWeight: "800",
    margin: 0,
    transition: "color 0.3s ease",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "2em",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "1.5em",
    marginBottom: "2em",
  },
  box: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    width: "100%",
    minWidth: "0",
    overflow: "hidden",
    border: "1px solid #f3f4f6",
  },
  boxTitle: {
    fontSize: "1.1em",
    fontWeight: "700",
    marginBottom: "1.2em",
    color: "#4b5563",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    paddingBottom: "1em",
    color: "#6b7280",
    fontSize: "0.85em",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  td: {
    padding: "1em 0",
    borderBottom: "1px solid #f3f4f6",
    fontSize: "0.9em",
    color: "#111827",
  },
  emptyCell: {
    padding: "1.2em 0",
    color: "#94a3b8",
  },
  approved: { color: "#059669", fontWeight: "600" },
  pending: { color: "#d97706", fontWeight: "600" },
  rejected: { color: "#dc2626", fontWeight: "600" },
  half_day: { color: "#7e22ce", fontWeight: "600" },
};

export default Dashboard;
