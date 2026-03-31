import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  getPendingJustifications,
  getPendingLeaves,
  updateJustificationStatus,
  updateLeaveStatus,
} from "../services/api";

function AdminPanel() {
  const [leaves, setLeaves] = useState([]);
  const [justifications, setJustifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pendingLeaves, pendingJustifications] = await Promise.all([
        getPendingLeaves(),
        getPendingJustifications(),
      ]);
      setLeaves(pendingLeaves || []);
      setJustifications(pendingJustifications || []);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleLeave = async (id, status) => {
    try {
      await updateLeaveStatus(id, status);
      await fetchAll();
    } catch (e) {
      alert(e?.message || "Failed to update leave");
    }
  };

  const handleJustification = async (id, status) => {
    try {
      await updateJustificationStatus(id, status);
      await fetchAll();
    } catch (e) {
      alert(e?.message || "Failed to update justification");
    }
  };

  return (
    <Layout>
      <div style={styles.wrapper}>
        <div style={styles.headerRow}>
          <h2 style={styles.heading}>Admin Panel</h2>
          <button onClick={fetchAll} disabled={loading} style={styles.refreshBtn}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div style={styles.grid}>
          {/* Leaves */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Pending Leaves</h3>

            {leaves.length === 0 ? (
              <div style={styles.empty}>No pending leaves</div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Employee</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>From</th>
                      <th style={styles.th}>To</th>
                      <th style={styles.th}>Reason</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((l) => (
                      <tr key={l.id}>
                        <td style={styles.td}>{l.employee_id}</td>
                        <td style={styles.td}>{l.leave_type}</td>
                        <td style={styles.td}>{l.from_date}</td>
                        <td style={styles.td}>{l.to_date}</td>
                        <td style={styles.td}>{l.reason}</td>
                        <td style={styles.td}>
                          <div style={styles.actionRow}>
                            <button
                              style={styles.approveBtn}
                              onClick={() => handleLeave(l.id, "Approved")}
                            >
                              Approve
                            </button>
                            <button
                              style={styles.rejectBtn}
                              onClick={() => handleLeave(l.id, "Rejected")}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Justifications */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Pending Justifications</h3>

            {justifications.length === 0 ? (
              <div style={styles.empty}>No pending justifications</div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Employee</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Reason</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {justifications.map((j) => (
                      <tr key={j.id}>
                        <td style={styles.td}>{j.employee_id}</td>
                        <td style={styles.td}>{j.date}</td>
                        <td style={styles.td}>{j.reason}</td>
                        <td style={styles.td}>
                          <div style={styles.actionRow}>
                            <button
                              style={styles.approveBtn}
                              onClick={() => handleJustification(j.id, "Approved")}
                            >
                              Approve
                            </button>
                            <button
                              style={styles.rejectBtn}
                              onClick={() => handleJustification(j.id, "Rejected")}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AdminPanel;

const styles = {
  wrapper: {
    padding: "20px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  heading: {
    margin: 0,
    color: "#7D3C98",
  },
  refreshBtn: {
    background: "#7D3C98",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
  },
  card: {
    background: "var(--surface)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    padding: "16px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
  },
  cardTitle: {
    margin: "0 0 12px",
  },
  empty: {
    color: "var(--muted-text)",
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "10px 8px",
    borderBottom: "2px solid var(--border)",
    color: "var(--muted-text)",
    fontSize: "13px",
  },
  td: {
    padding: "10px 8px",
    borderBottom: "1px solid var(--border)",
    fontSize: "14px",
    verticalAlign: "top",
  },
  actionRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  approveBtn: {
    background: "#16A34A",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "8px 12px",
    cursor: "pointer",
  },
  rejectBtn: {
    background: "#DC2626",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "8px 12px",
    cursor: "pointer",
  },
};
