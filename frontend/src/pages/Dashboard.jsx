import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  getAttendance,
  getUpcomingHolidays,
  getNotifications,
  getLeaves
} from "../services/api";

import Chart from "react-apexcharts";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Dashboard.css";

function Dashboard() {

  const [attendanceData, setAttendanceData] = useState([]);
  const [leaves, setLeaves] = useState([]);

  const [holidays, setHolidays] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [totalDays, setTotalDays] = useState(0);
  const [lateUsed, setLateUsed] = useState(0);

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

        const currentUserRaw = localStorage.getItem("currentUser");
        let user = null;
        try {
          user = currentUserRaw ? JSON.parse(currentUserRaw) : null;
        } catch {
          user = null;
        }

        if (user) {

          const leaveList = await getLeaves(user.employee_id);
          setLeaves(leaveList);
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

  const currentUserRaw = localStorage.getItem("currentUser");
  let user = null;
  try {
    user = currentUserRaw ? JSON.parse(currentUserRaw) : null;
  } catch {
    user = null;
  }

  return (
    <Layout>

      <div className="dashboard">

        {/* HEADER */}
        <div className="dashboard__header">
          <div>
            <h2 className="dashboard__title">Welcome back, {user?.name} 👋</h2>
            <div className="dashboard__subtle">Here’s your latest snapshot</div>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="dashboard__summaryGrid">

          <div className="dashboardCard">
            <h4 className="dashboardCard__kicker">Total Attendance</h4>
            <p className="dashboardCard__value">{totalDays}</p>
          </div>

          <div className="dashboardCard">
            <h4 className="dashboardCard__kicker">Late Minutes</h4>
            <p className="dashboardCard__value">{lateUsed}</p>
          </div>

          <div className="dashboardCard">
            <h4 className="dashboardCard__kicker">Remaining</h4>
            <p className="dashboardCard__value">{remaining}</p>
          </div>

        </div>

        {/* CHARTS */}
        <div className="dashboard__chartsGrid">

          <div className="dashboardBox">
            <h3 className="dashboardBox__title">Weekly Attendance</h3>
            <Chart options={barOptions} series={[{data: weeklyAttendance}]} type="bar" height={220}/>
          </div>

          <div className="dashboardBox">
            <h3 className="dashboardBox__title">Late Usage</h3>
            <Chart options={pieOptions} series={[lateUsed, remaining]} type="pie" height={220}/>
          </div>

          <div className="dashboardBox">
            <h3 className="dashboardBox__title">Trend</h3>
            <Chart options={lineOptions} series={[{data: weeklyAttendance}]} type="line" height={220}/>
          </div>

        </div>

        {/* ANNOUNCEMENT + WHO'S ON LEAVE */}
        <div className="dashboard__twoCol">

          <div className="dashboardBox">
            <h3 className="dashboardBox__title">Announcements</h3>
            <div className="dashboardList">
              {notifications.length === 0 ? (
                <div className="dashboardList__item">No announcements</div>
              ) : (
                notifications.map((n, i) => (
                  <div className="dashboardList__item" key={i}>
                    <div>📢</div>
                    <div>{n.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="dashboardBox">
            <h3 className="dashboardBox__title">Who's on Leave</h3>

            <div className="dashboardList">
              {todaysLeaves.length === 0 ? (
                <div className="dashboardList__item">No one on leave</div>
              ) : (
                todaysLeaves.map((l, i) => (
                  <div className="dashboardList__item" key={i}>
                    <div>👤</div>
                    <div>{l.leave_type}</div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

        {/* LEAVE TABLE + CALENDAR */}
        <div className="dashboard__twoCol">

          <div className="dashboardBox">
            <h3 className="dashboardBox__title">Leave Requests</h3>

            <table className="dashboardTable">
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

          <div className="dashboardBox">
            <h3 className="dashboardBox__title">Calendar</h3>

            <Calendar
              calendarType="gregory"
              showNeighboringMonth={false}
              showFixedNumberOfWeeks={false}
              tileClassName={({date})=>{
                const classes = [];
                if (date.getDay() === 0) classes.push("calendar-sunday");
                const h = holidays.find(
                  d=> new Date(d.date).toDateString() === date.toDateString()
                );
                if (h) classes.push("holiday");
                return classes.length ? classes.join(" ") : null;
              }}
            />

          </div>

        </div>

      </div>

    </Layout>
  );
}

export default Dashboard;
