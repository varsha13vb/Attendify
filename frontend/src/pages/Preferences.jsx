import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getPreferences, updatePreferences } from "../services/api";

function Preferences() {

  const [settings, setSettings] = useState({
    darkMode: false,
    emailNotifications: true,
    pushNotifications: false,
    attendanceAlerts: true,
    leaveRequests: true,
  });

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPreferences();
        setSettings(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updatePreferences(settings);
      alert("Saved successfully!");
    } catch {
      alert("Error saving");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = () => {
    if (!oldPassword || !newPassword) {
      alert("Fill all fields");
      return;
    }

    alert("Password API not connected yet");
    setOldPassword("");
    setNewPassword("");
  };

  return (
    <Layout>

      <div style={styles.wrapper}>

        <h2 style={styles.heading}>Preferences</h2>

        {/* NOTIFICATIONS */}
        <div style={styles.card}>
          <h3>Notifications</h3>

          {[
            ["Email Notifications", "emailNotifications"],
            ["Push Notifications", "pushNotifications"],
            ["Attendance Alerts", "attendanceAlerts"],
            ["Leave Requests", "leaveRequests"]
          ].map(([label, key]) => (
            <div key={key} style={styles.row}>
              <span>{label}</span>

              <label style={styles.switch}>
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={() => handleToggle(key)}
                />
                <span style={styles.slider}></span>
              </label>
            </div>
          ))}

        </div>

        {/* DARK MODE */}
        <div style={styles.card}>
          <h3>Appearance</h3>

          <div style={styles.row}>
            <span>Dark Mode</span>

            <label style={styles.switch}>
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={() => handleToggle("darkMode")}
              />
              <span style={styles.slider}></span>
            </label>
          </div>

        </div>

        {/* PASSWORD */}
        <div style={styles.card}>
          <h3>Change Password</h3>

          <input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={styles.input}
          />

          <button style={styles.smallBtn} onClick={handlePasswordChange}>
            Update Password
          </button>
        </div>

        <button style={styles.button} onClick={handleSave}>
          {loading ? "Saving..." : "Save Preferences"}
        </button>

      </div>

    </Layout>
  );
}

/* ===== STYLES ===== */

const styles = {

  wrapper: {
    padding: "30px",
    maxWidth: "800px",
    margin: "auto",
  },

  heading: {
    marginBottom: "20px",
    color: "#7D3C98",
  },

  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "12px",
  },

  input: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
  },

  button: {
    width: "100%",
    padding: "12px",
    background: "#7D3C98",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
  },

  smallBtn: {
    marginTop: "10px",
    padding: "8px",
    background: "#5B2C6F",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
  },

  /* TOGGLE */
  switch: {
    position: "relative",
    display: "inline-block",
    width: "45px",
    height: "24px",
  },

  slider: {
    position: "absolute",
    cursor: "pointer",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ccc",
    borderRadius: "34px",
    transition: ".3s",
  },

};

export default Preferences;