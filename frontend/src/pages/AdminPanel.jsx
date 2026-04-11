import React, { useState } from "react";
import Layout from "../components/Layout";
import EmployeeManagement from "./admin/EmployeeManagement";
import LeaveManagement from "./admin/LeaveManagement";
import AttendanceManagement from "./admin/AttendanceManagement";
import PolicyManagement from "./admin/PolicyManagement";
import SystemConfig from "./admin/SystemConfig";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("Employee Management");
  const [notify, setNotify] = useState({ show: false, msg: "", type: "" });

  // Global Notification Trigger (Replaces alert)
  const showNotify = (msg, type = "success") => {
    setNotify({ show: true, msg, type });
    setTimeout(() => setNotify({ show: false, msg: "", type: "" }), 3000);
  };

  const tabs = ["Employee Management", "Leave Management", "Attendance Tracking", "Policy Management", "System Configuration"];

  return (
    <Layout>
      {notify.show && (
        <div style={{ ...styles.toast, background: notify.type === "error" ? "#ef4444" : "#16a34a" }}>
          {notify.msg}
        </div>
      )}

      <div style={styles.wrapper}>
        <div style={styles.header}>
          <h2 style={styles.title}>Admin Dashboard</h2>
          <p style={styles.subtitle}>System Overview & Management</p>
        </div>

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

        <div style={styles.contentArea}>
          {activeTab === "Employee Management" && <EmployeeManagement showNotify={showNotify} />}
          {activeTab === "Leave Management" && <LeaveManagement showNotify={showNotify} />}
          {activeTab === "Attendance Tracking" && <AttendanceManagement showNotify={showNotify}/>}
          {activeTab === "Policy Management" && <PolicyManagement showNotify={showNotify}/>}
          {activeTab === "System Config" && <SystemConfig showNotify={showNotify}/>} 
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  wrapper: { padding: "2em", maxWidth: "1400px", margin: "0 auto" },
  header: { 
    background: "linear-gradient(135deg, #7D3C98, #5B2C6F)", 
    color: "#fff", padding: "2.5em", borderRadius: "1.2em", marginBottom: "2em",
    boxShadow: "0 8px 30px rgba(125,60,152,0.2)"
  },
  title: { margin: 0, fontSize: "2.2em", fontWeight: "700" },
  subtitle: { margin: "5px 0 0", opacity: 0.8 },
  tabBar: { display: "flex", gap: "12px", marginBottom: "25px", flexWrap: "wrap" },
  tab: { 
    padding: "12px 24px", border: "none", background: "#fff", borderRadius: "10px", 
    cursor: "pointer", fontWeight: "600", color: "#666", transition: "0.3s",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },
  activeTab: { background: "#7D3C98", color: "#fff" },
  toast: { 
    position: "fixed", top: "20px", right: "20px", padding: "15px 30px", 
    color: "#fff", borderRadius: "12px", z_index: 9999, fontWeight: "600",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)", animation: "slideIn 0.3s ease" 
  }
};

export default AdminPanel;
