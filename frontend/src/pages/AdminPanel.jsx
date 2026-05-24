import React, { useState } from "react";
import Layout from "../components/Layout";
import EmployeeManagement from "./admin/EmployeeManagement";
import LeaveManagement from "./admin/LeaveManagement";
import AttendanceManagement from "./admin/AttendanceManagement";
import PolicyManagement from "./admin/PolicyManagement";
import SystemConfig from "./admin/SystemConfig";
import JustificationManagement from "./admin/JustificationManagement";

const AdminPanel = () => {
  // State and UI feedback management
  const [activeTab, setActiveTab] = useState("Employee Management");
  const [notify, setNotify] = useState({ show: false, msg: "", type: "" });

  // Shared helper used by child modules to show success or error notifications.
  const showNotify = (msg, type = "success") => {
    setNotify({ show: true, msg, type });
    setTimeout(() => setNotify({ show: false, msg: "", type: "" }), 3000);
  };

  // Main admin sections shown in the dashboard tab navigation.
  const tabs = [
    "Employee Management",
    "Leave Management",
    "Justification Management",
    "Attendance Tracking",
    "Policy Management",
    "System Configuration",
  ];

  return (
    <Layout>
      {/* Notification toast section */}
      {notify.show && (
        <div style={{ ...styles.toast, background: notify.type === "error" ? "#ef4444" : "#16a34a" }}>
          {notify.msg}
        </div>
      )}

      <div style={styles.wrapper}>
        {/* Dashboard header section */}
        <div style={styles.header}>
          <h2 style={styles.title}>Admin Dashboard</h2>
          <p style={styles.subtitle}>System Overview & Management</p>
        </div>

        {/* Sticky tab navigation section */}
        <div style={styles.stickyTop}>
          <div style={styles.tabBar}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ ...styles.tab, ...(activeTab === tab ? styles.activeTab : {}) }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Main content section: renders the selected admin module */}
        <div style={styles.contentArea}>
          {activeTab === "Employee Management" && <EmployeeManagement showNotify={showNotify} />}
          {activeTab === "Leave Management" && <LeaveManagement showNotify={showNotify} />}
          {activeTab === "Justification Management" && <JustificationManagement showNotify={showNotify} />}
          {activeTab === "Attendance Tracking" && <AttendanceManagement showNotify={showNotify} />}
          {activeTab === "Policy Management" && <PolicyManagement showNotify={showNotify} />}
          {activeTab === "System Configuration" && <SystemConfig showNotify={showNotify} />}
        </div>
      </div>
    </Layout>
  );
};

// Centralized inline styles for layout, tabs, and notifications.
const styles = {
  wrapper: { padding: "2em", maxWidth: "1400px", margin: "0 auto" },
  stickyTop: {
    position: "sticky",
    top: 0,
    zIndex: 12,
    background: "#F5F5F5",
    paddingBottom: "1.25em",
    marginBottom: "1.25em",
  },
  header: {
    background: "linear-gradient(135deg, #7D3C98, #5B2C6F)",
    color: "#fff",
    padding: "2.5em",
    borderRadius: "1.2em",
    marginBottom: "1.25em",
    boxShadow: "0 8px 30px rgba(125,60,152,0.2)",
  },
  title: { margin: 0, fontSize: "2.2em", fontWeight: "700" },
  subtitle: { margin: "5px 0 0", opacity: 0.8 },
  tabBar: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    background: "rgba(255,255,255,0.78)",
    borderRadius: "16px",
    padding: "12px",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 26px rgba(15, 23, 42, 0.08)",
  },
  tab: {
    padding: "12px 24px",
    border: "none",
    background: "#fff",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    color: "#666",
    transition: "0.3s",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },
  activeTab: { background: "#7D3C98", color: "#fff" },
  contentArea: { minWidth: 0 },
  toast: {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "15px 30px",
    color: "#fff",
    borderRadius: "12px",
    zIndex: 9999,
    fontWeight: "600",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    animation: "slideIn 0.3s ease",
  },
};

export default AdminPanel;
