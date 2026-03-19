import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  getAttendance,
  getLatestLeave,
  getUpcomingHolidays,
  getNotifications,
  getLeaves
} from "../services/api";

import Chart from "react-apexcharts";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function Dashboard() {

  const [attendanceData, setAttendanceData] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [latestLeave, setLatestLeave] = useState(null);

  const [holidays, setHolidays] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [totalDays, setTotalDays] = useState(0);
  const [lateUsed, setLateUsed] = useState(0);
  const [leaveStatusSeries, setLeaveStatusSeries] = useState([0,0,0]);

  const monthlyLimit = 45;

  useEffect(() => {

    const fetchData = async () => {

      try {

        const attendance = await getAttendance();
        setAttendanceData(attendance);

        setTotalDays(attendance.length);

        const totalLate = attendance.reduce(
          (sum, r) => sum + (r.late_minutes || 0), 0
        );

        setLateUsed(totalLate);

        const user = JSON.parse(localStorage.getItem("currentUser"));

        if (user) {

          const leaveList = await getLeaves(user.employee_id);
          setLeaves(leaveList);

          const latest = await getLatestLeave(user.employee_id);
          setLatestLeave(latest);

          const approved = leaveList.filter(l => l.status === "Approved").length;
          const pending = leaveList.filter(l => l.status === "Pending").length;
          const rejected = leaveList.filter(l => l.status === "Rejected").length;

          setLeaveStatusSeries([approved, pending, rejected]);
        }

        setHolidays(await getUpcomingHolidays());
        setNotifications(await getNotifications());

      } catch (err) {
        console.error(err);
      }
    };

    fetchData();

  }, []);

  /* ===== WEEKLY ===== */

  const weekDays = ["Mon","Tue","Wed","Thu","Fri"];

  const weeklyAttendance = weekDays.map(day => {
    const record = attendanceData.find(r => {
      const d = new Date(r.date);
      return d.toLocaleDateString("en-US",{weekday:"short"}) === day;
    });
    return record ? 1 : 0;
  });

  const remaining = Math.max(monthlyLimit - lateUsed, 0);

  /* ===== WHO'S ON LEAVE ===== */

  const today = new Date();

  const todaysLeaves = leaves.filter(l => {
    if (l.status !== "Approved") return false;

    const from = new Date(l.from_date);
    const to = new Date(l.to_date);

    return today >= from && today <= to;
  });

  /* ===== CHART CONFIG ===== */

  const barOptions = {
    chart: { id: "bar" },
    xaxis: { categories: weekDays },
    colors: ["#7D3C98"]
  };

  const lineOptions = {
    chart: { id: "line" },
    xaxis: { categories: weekDays },
    colors: ["#7D3C98"]
  };

  const pieOptions = {
    labels: ["Used","Remaining"],
    colors: ["#7D3C98","#E9D5FF"]
  };

  const leaveOptions = {
    labels: ["Approved","Pending","Rejected"],
    colors: ["#22c55e","#f59e0b","#ef4444"]
  };

  const user = JSON.parse(localStorage.getItem("currentUser"));

  return (
    <Layout>

      <div style={styles.wrapper}>

        {/* HEADER */}
        <div style={styles.header}>
          <h2>Welcome back, {user?.name} 👋</h2>
        </div>

        {/* SUMMARY */}
        <div style={styles.summary}>

          <div style={styles.card}>
            <h4>Total Attendance</h4>
            <p>{totalDays}</p>
          </div>

          <div style={styles.card}>
            <h4>Late Minutes</h4>
            <p>{lateUsed}</p>
          </div>

          <div style={styles.card}>
            <h4>Remaining</h4>
            <p>{remaining}</p>
          </div>

        </div>

        {/* CHARTS */}
        <div style={styles.grid}>

          <div style={styles.box}>
            <h3>Weekly Attendance</h3>
            <Chart options={barOptions} series={[{data: weeklyAttendance}]} type="bar" height={220}/>
          </div>

          <div style={styles.box}>
            <h3>Late Usage</h3>
            <Chart options={pieOptions} series={[lateUsed, remaining]} type="pie" height={220}/>
          </div>

          <div style={styles.box}>
            <h3>Trend</h3>
            <Chart options={lineOptions} series={[{data: weeklyAttendance}]} type="line" height={220}/>
          </div>

        </div>

        {/* ANNOUNCEMENT + WHO'S ON LEAVE */}
        <div style={styles.twoCol}>

          <div style={styles.box}>
            <h3>Announcements</h3>
            {notifications.map((n,i)=>(
              <p key={i}>📢 {n.message}</p>
            ))}
          </div>

          <div style={styles.box}>
            <h3>Who's on Leave</h3>

            {todaysLeaves.length === 0
              ? <p>No one on leave</p>
              : todaysLeaves.map((l,i)=>(
                <p key={i}>👤 {l.leave_type}</p>
              ))
            }

          </div>

        </div>

        {/* LEAVE TABLE + CALENDAR */}
        <div style={styles.twoCol}>

          <div style={styles.box}>
            <h3>Leave Requests</h3>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {leaves.map((l,i)=>(
                  <tr key={i}>
                    <td>{l.from_date}</td>
                    <td>{l.to_date}</td>
                    <td>{l.leave_type}</td>
                    <td>{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>

          <div style={styles.box}>
            <h3>Calendar</h3>

            <Calendar
              tileClassName={({date})=>{
                const h = holidays.find(
                  d=> new Date(d.date).toDateString() === date.toDateString()
                );
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

  wrapper: { width: "100%" },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px"
  },

  btn: {
    background: "#E91E63",
    color: "#fff",
    border: "none",
    padding: "10px 15px",
    borderRadius: "8px"
  },

  summary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
    gap: "15px",
    marginBottom: "25px"
  },

  card: {
    background: "#F3E8FF",
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
    gap: "20px",
    marginBottom: "25px"
  },

  twoCol: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "20px",
    marginBottom: "25px"
  },

  box: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.05)"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse"
  }

};

export default Dashboard;