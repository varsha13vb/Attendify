import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("currentUser"));

  const isActive = (path) => location.pathname === path;

  return (
    <div style={styles.sidebar}>
      <h2 style={styles.logo}>Attendify</h2>

      <Link
        to="/dashboard"
        style={{
          ...styles.link,
          ...(isActive("/dashboard") && styles.active),
        }}
      >
        Dashboard
      </Link>

      <Link
        to="/attendance"
        style={{
          ...styles.link,
          ...(isActive("/attendance") && styles.active),
        }}
      >
        Attendance
      </Link>

      <Link
        to="/wallet"
        style={{
          ...styles.link,
          ...(isActive("/wallet") && styles.active),
        }}
      >
        Wallet
      </Link>

      <Link
        to="/justification"
        style={{
          ...styles.link,
          ...(isActive("/justification") && styles.active),
        }}
      >
        Justification
      </Link>

      <Link
        to="/leave"
        style={{
          ...styles.link,
          ...(isActive("/leave") && styles.active),
        }}
      >
        Leave
      </Link>

      {/* ✅ Show Admin Panel only for admin */}
      {user?.role === "admin" && (
        <Link
          to="/admin"
          style={{
            ...styles.link,
            ...(isActive("/admin") && styles.active),
          }}
        >
          Admin Panel
        </Link>
      )}
    </div>
  );
}

const styles = {
  sidebar: {
    width: "240px",
    height: "100vh",
    backgroundColor: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    padding: "30px 20px",
    gap: "10px",
    boxShadow: "4px 0 20px rgba(0,0,0,0.05)",
    borderRight: "1px solid #F1F5F9",
  },

  logo: {
    color: "#7D3C98",
    marginBottom: "30px",
    fontSize: "20px",
    fontWeight: "600",
  },

  link: {
    textDecoration: "none",
    padding: "12px 15px",
    borderRadius: "10px",
    fontSize: "15px",
    color: "#333",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },

  active: {
    background: "linear-gradient(135deg, #7D3C98, #5B2C6F)",
    color: "#FFFFFF",
  },
};

export default Sidebar;