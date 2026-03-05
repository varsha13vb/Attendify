import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getAttendance } from "../services/api";

function Attendance() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const data = await getAttendance();
        setAttendanceData(data);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  return (
    <Layout>
      <div style={styles.wrapper}>
        <h2 style={styles.heading}>Attendance Records</h2>

        {loading ? (
          <div style={styles.loadingCard}>
            <p>Loading attendance...</p>
          </div>
        ) : (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Check-In Time</th>
                  <th style={styles.th}>Late Minutes</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>

              <tbody>
                {attendanceData.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={styles.noData}>
                      No Attendance Records Found
                    </td>
                  </tr>
                ) : (
                  attendanceData.map((record, index) => (
                    <tr key={index} style={styles.tr}>
                      <td style={styles.td}>{record.date}</td>
                      <td style={styles.td}>{record.check_in}</td>
                      <td style={styles.td}>{record.late_minutes}</td>
                      <td style={styles.td}>
                        <span
                          style={
                            record.status === "Late"
                              ? styles.lateBadge
                              : styles.onTimeBadge
                          }
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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

  heading: {
    marginBottom: "25px",
    color: "#7D3C98",
  },

  loadingCard: {
    backgroundColor: "#FFFFFF",
    padding: "30px",
    borderRadius: "15px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },

  tableCard: {
    backgroundColor: "#FFFFFF",
    padding: "20px",
    borderRadius: "15px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "center",
  },

  tableHeaderRow: {
    backgroundColor: "#F8F9FB",
  },

  th: {
    padding: "14px",
    fontWeight: "600",
    color: "#7D3C98",
    borderBottom: "2px solid #EEE",
  },

  tr: {
    transition: "background 0.2s ease",
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #F1F5F9",
  },

  noData: {
    padding: "25px",
    color: "#95A5A6",
  },

  lateBadge: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    padding: "6px 12px",
    borderRadius: "20px",
    fontWeight: "500",
    fontSize: "13px",
  },

  onTimeBadge: {
    backgroundColor: "#DCFCE7",
    color: "#16A34A",
    padding: "6px 12px",
    borderRadius: "20px",
    fontWeight: "500",
    fontSize: "13px",
  },
};

export default Attendance;