import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { changePassword, getPreferences, updatePreferences } from "../services/api";

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      style={{
        ...toggleStyles.track,
        ...(checked ? toggleStyles.trackOn : toggleStyles.trackOff),
        ...(disabled ? toggleStyles.trackDisabled : null),
      }}
    >
      <span
        style={{
          ...toggleStyles.knob,
          transform: checked ? "translateX(21px)" : "translateX(0px)",
        }}
      />
    </button>
  );
}

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
  const [passwordLoading, setPasswordLoading] = useState(false);

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

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword) {
      alert("Fill all fields");
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword({ oldPassword, newPassword });
      alert("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      alert(err?.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
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

              <ToggleSwitch
                checked={Boolean(settings[key])}
                onChange={() => handleToggle(key)}
                disabled={loading}
              />
            </div>
          ))}

        </div>

        {/* DARK MODE */}
        <div style={styles.card}>
          <h3>Appearance</h3>

          <div style={styles.row}>
            <span>Dark Mode</span>

            <ToggleSwitch
              checked={Boolean(settings.darkMode)}
              onChange={() => handleToggle("darkMode")}
              disabled={loading}
            />
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

          <button
            style={styles.smallBtn}
            onClick={handlePasswordChange}
            disabled={passwordLoading}
          >
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </div>

        <button style={styles.button} onClick={handleSave} disabled={loading}>
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
    cursor: "pointer",
  },

  smallBtn: {
    marginTop: "10px",
    padding: "8px",
    background: "#5B2C6F",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },

};

export default Preferences;

const toggleStyles = {
  track: {
    width: "46px",
    height: "24px",
    borderRadius: "999px",
    border: "none",
    padding: "2px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    transition: "background-color 0.2s ease",
  },
  trackOn: {
    backgroundColor: "#7D3C98",
  },
  trackOff: {
    backgroundColor: "#BDC3C7",
  },
  trackDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  knob: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: "#FFFFFF",
    transition: "transform 0.2s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
};
