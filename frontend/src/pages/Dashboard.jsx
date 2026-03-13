import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getAttendance, getLatestLeave } from "../services/api";

function Dashboard() {
  const [totalDays, setTotalDays] = useState(0);
  const [lateUsed, setLateUsed] = useState(0);
  const [latestLeave, setLatestLeave] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const monthlyLimit = 45;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const attendance = await getAttendance();

        if (attendance && attendance.length > 0) {
          setTotalDays(attendance.length);

          const totalLate = attendance.reduce(
            (sum, record) => sum + (record.late_minutes || 0),
            0
          );

          setLateUsed(totalLate);
        }

        const user = JSON.parse(localStorage.getItem("currentUser"));
        if (user) {
          const leave = await getLatestLeave(user.employee_id);
          setLatestLeave(leave);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };

    fetchDashboardData();
  }, []);

  const exceeded = lateUsed > monthlyLimit;
  const remaining = Math.max(monthlyLimit - lateUsed, 0);
  const usagePercent = Math.min((lateUsed / monthlyLimit) * 100, 100);

  return (
    <Layout>
      <div style={styles.wrapper}>

        {/* Stats Cards */}
        <div style={styles.cardContainer}>
          {[
            { title: "Total Attendance", value: `${totalDays} Days` },
            { title: "Late Minutes Used", value: `${lateUsed} Minutes` },
            {
              title: "Late-Time Wallet",
              value: exceeded
                ? `Exceeded by ${lateUsed - monthlyLimit} Minutes`
                : `${remaining} Minutes Remaining`,
              exceeded,
            },
          ].map((card, index) => (
            <div
              key={index}
              style={{
                ...styles.card,
                ...(hoverIndex === index ? styles.cardHover : {}),
              }}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <h3>{card.title}</h3>

              <p
                style={
                  card.title === "Late-Time Wallet" && exceeded
                    ? styles.exceeded
                    : styles.number
                }
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Progress Chart */}
        <div style={styles.chartCard}>
          <h3>Late-Time Usage Progress</h3>

          <div style={styles.progressWrapper}>
            <div
              style={{
                ...styles.progressBar,
                width: `${usagePercent}%`,
                backgroundColor: exceeded ? "red" : "#7D3C98",
              }}
            />
          </div>

          <p style={styles.percentText}>
            {usagePercent.toFixed(1)}% of monthly limit used
          </p>
        </div>

        {/* Latest Leave */}
        {latestLeave && (
          <div style={styles.leaveCard}>
            <h3>Latest Leave Application</h3>

            <p><strong>Type:</strong> {latestLeave.leaveType}</p>
            <p>
              <strong>Duration:</strong> {latestLeave.fromDate} to {latestLeave.toDate}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              <span
                style={
                  latestLeave.status === "Approved"
                    ? styles.approved
                    : latestLeave.status === "Rejected"
                    ? styles.rejected
                    : styles.pending
                }
              >
                {latestLeave.status}
              </span>
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

const styles = {
  wrapper: {
    padding: "30px",
  },

  cardContainer: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "40px",
  },

  card: {
    flex: 1,
    minWidth: "220px",
    padding: "25px",
    backgroundColor: "#F3E8FF",
    borderRadius: "15px",
    border: "1px solid #E9D5FF",
    textAlign: "center",
    transition: "all 0.3s ease",
  },

  cardHover: {
    transform: "translateY(-6px)",
    boxShadow: "0 15px 30px rgba(0,0,0,0.15)",
    cursor: "pointer",
  },

  number: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#7D3C98",
  },

  exceeded: {
    color: "red",
    fontWeight: "bold",
  },

  chartCard: {
    padding: "25px",
    backgroundColor: "#FFFFFF",
    borderRadius: "15px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    marginBottom: "40px",
  },

  progressWrapper: {
    width: "100%",
    height: "20px",
    backgroundColor: "#E5E7EB",
    borderRadius: "10px",
    overflow: "hidden",
    marginTop: "15px",
  },

  progressBar: {
    height: "100%",
    transition: "width 0.6s ease",
  },

  percentText: {
    marginTop: "10px",
    fontWeight: "500",
  },

  leaveCard: {
    padding: "25px",
    backgroundColor: "#FFFFFF",
    borderRadius: "15px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },

  approved: {
    color: "green",
    fontWeight: "bold",
  },

  rejected: {
    color: "red",
    fontWeight: "bold",
  },

  pending: {
    color: "orange",
    fontWeight: "bold",
  },
};

export default Dashboard;