import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  getAttendance,
  getUpcomingHolidays,
  getNotifications,
  getLeaves,
  getLatestLeave,
  getWalletInfo
} from "../services/api";

import Chart from "react-apexcharts";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
// import "./Dashboard.css";

function Dashboard() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [latestLeave, setLatestLeave] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [totalDays, setTotalDays] = useState(0);
  const [lateUsed, setLateUsed] = useState(0);
  const [monthlyLimit, setMonthlyLimit] = useState(45);
  
  // Hover states for top cards
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const attendance = await getAttendance();
        setAttendanceData(attendance);
        setTotalDays(attendance.length);

        try {
          const wallet = await getWalletInfo();
          setMonthlyLimit(Number(wallet?.monthly_limit ?? 45));
          setLateUsed(Number(wallet?.used_minutes ?? 0));
        } catch {
          // keep defaults
        }

        const user = JSON.parse(localStorage.getItem("currentUser"));
        if (user) {
          const leaveList = await getLeaves(user.employee_id);
          setLeaves(leaveList);
          const latest = await getLatestLeave(user.employee_id);
          setLatestLeave(latest);
        }

        setHolidays(await getUpcomingHolidays());
        setNotifications(await getNotifications());
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const weeklyAttendance = weekDays.map(day => {
    const record = attendanceData.find(r => {
      const d = new Date(r.date);
      return d.toLocaleDateString("en-US", { weekday: "short" }) === day;
    });
    return record ? 1 : 0;
  });

  const remaining = Math.max(monthlyLimit - lateUsed, 0);
  const today = new Date();
  const todaysLeaves = leaves.filter(l => {
    if (l.status !== "Approved") return false;
    const from = new Date(l.from_date);
    const to = new Date(l.to_date);
    return today >= from && today <= to;
  });

  /* ===== CHART CONFIG ===== */
  const commonOptions = {
    chart: { 
      toolbar: { show: false }, // Remove extra icons
      fontFamily: 'Inter, sans-serif'
    },
    colors: ["#7c3aed"],
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: 4 },
  };

  const barOptions = { ...commonOptions, xaxis: { categories: weekDays } };
  const lineOptions = { ...commonOptions, xaxis: { categories: weekDays } };
  const pieOptions = {
    ...commonOptions,
    labels: ["Used", "Remaining"],
    colors: ["#7c3aed", "#ddd6fe"],
    legend: { position: 'bottom' }
  };

  const user = JSON.parse(localStorage.getItem("currentUser"));

  const SummaryCard = ({ id, title, value }) => (
    <div 
      style={{
        ...styles.card,
        ...(hoveredCard === id ? styles.cardHover : {})
      }}
      onMouseEnter={() => setHoveredCard(id)}
      onMouseLeave={() => setHoveredCard(null)}
    >
      <span style={{
        ...styles.cardTitle,
        color: hoveredCard === id ? "#fff" : "#6b21a8"
      }}>{title}</span>
      <p style={{
        ...styles.cardValue,
        color: hoveredCard === id ? "#fff" : "#4c1d95"
      }}>{value}</p>
    </div>
  );

  return (
    <Layout>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <h2 style={styles.heading}>Welcome back, {user?.name} 👋</h2>
        </div>

        {/* SUMMARY SECTION */}
        <div style={styles.summaryContainer}>
          <SummaryCard id={1} title="Total Attendance" value={totalDays} />
          <SummaryCard id={2} title="Late Minutes" value={lateUsed} />
          <SummaryCard id={3} title="Remaining Wallet" value={remaining} />
        </div>

        {/* CHARTS */}
        <div style={styles.grid}>
          <div style={styles.box}>
            <h3 style={styles.boxTitle}>Weekly Attendance</h3>
            <Chart options={barOptions} series={[{ data: weeklyAttendance }]} type="bar" height={220} />
          </div>
          <div style={styles.box}>
            <h3 style={styles.boxTitle}>Late Usage</h3>
            <Chart options={pieOptions} series={[lateUsed, remaining]} type="pie" height={220} />
          </div>
          <div style={styles.box}>
            <h3 style={styles.boxTitle}>Trend Analysis</h3>
            <Chart options={lineOptions} series={[{ data: weeklyAttendance }]} type="line" height={220} />
          </div>
        </div>

        {/* INFO CARDS */}
        <div style={styles.twoCol}>
          <div style={styles.box}>
            <h3 style={styles.boxTitle}>Announcements</h3>
            {notifications.map((n, i) => (
              <p key={i} style={styles.listItem}>📢 {n.message}</p>
            ))}
          </div>
          <div style={styles.box}>
            <h3 style={styles.boxTitle}>Who's on Leave</h3>
            {todaysLeaves.length === 0
              ? <p style={styles.emptyText}>No one on leave today</p>
              : todaysLeaves.map((l, i) => (
                <p key={i} style={styles.listItem}>👤 {l.leave_type}</p>
              ))
            }
          </div>
        </div>

        {/* TABLE + CALENDAR */}
        <div style={styles.twoCol}>
          <div style={styles.box}>
            <h3 style={styles.boxTitle}>Leave Requests</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>From</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{l.from_date}</td>
                    <td style={styles.td}>{l.leave_type}</td>
                    <td style={{ ...styles.td, ...styles[l.status.toLowerCase()] }}>{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ ...styles.box, padding: '10px' }}>
            <h3 style={{ ...styles.boxTitle, padding: '10px' }}>Organization Calendar</h3>
            <Calendar
              tileClassName={({ date }) => {
                const h = holidays.find(d => new Date(d.date).toDateString() === date.toDateString());
                return h ? "holiday" : null;
              }}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ===== STYLES ===== */

const styles = {
  wrapper: {
    width: "100%",
    maxWidth: "94%",
    margin: "0 auto",
    padding: "2em",
    minHeight: "100vh",
    backgroundColor: "#f9fafb"
  },
  header: {
    marginBottom: "2em",
  },
  heading: {
    fontSize: "1.8em",
    fontWeight: "700",
    color: "#1f2937"
  },
  summaryContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginBottom: "24px"
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
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  },
  cardHover: {
    background: "linear-gradient(135deg, #7D3C98, #5B2C6F)",
    transform: "translateY(-4px)",
    boxShadow: "0 10px 25px rgba(124, 58, 237, 0.3)"
  },
  cardTitle: {
    fontSize: "0.95em",
    fontWeight: "600",
    marginBottom: "8px",
    transition: "color 0.3s ease"
  },
  cardValue: {
    fontSize: "2em",
    fontWeight: "800",
    margin: 0,
    transition: "color 0.3s ease"
  },
    grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)", // 🔥 FORCE 3 IN ONE LINE
    gap: "20px",
    marginBottom: "2em"
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "1.5em",
    marginBottom: "2em"
  },
  box: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    width: "100%",
    minWidth: "0",
    overflow: "hidden",
    border: "1px solid #f3f4f6"
  },
  boxTitle: {
    fontSize: "1.1em",
    fontWeight: "700",
    marginBottom: "1.2em",
    color: "#4b5563"
  },
  listItem: {
    padding: "0.8em 0",
    borderBottom: "1px solid #f3f4f6",
    fontSize: "0.95em",
    color: "#374151"
  },
  emptyText: {
    color: "#9ca3af",
    fontStyle: "italic"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    textAlign: "left",
    paddingBottom: "1em",
    color: "#6b7280",
    fontSize: "0.85em",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  td: {
    padding: "1em 0",
    borderBottom: "1px solid #f3f4f6",
    fontSize: "0.9em",
    color: "#111827"
  },
  approved: { color: "#059669", fontWeight: "600" },
  pending: { color: "#d97706", fontWeight: "600" },
  rejected: { color: "#dc2626", fontWeight: "600" },

  
};

export default Dashboard;
