import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("currentUser"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpen(false);
    };

    if (open) {
      window.addEventListener("click", handleClickOutside);
    }

    return () => window.removeEventListener("click", handleClickOutside);
  }, [open]);

  return (
    <div style={styles.navbar}>
      {/* Logo */}
      <h2 style={styles.logo}>Attendify</h2>

      {/* Navigation Menu */}
      <div style={styles.menu}>
        <Link
          to="/dashboard"
          style={{
            ...styles.menuItem,
            ...(isActive("/dashboard") && styles.active),
          }}
        >
          Dashboard
        </Link>

        <Link
          to="/attendance"
          style={{
            ...styles.menuItem,
            ...(isActive("/attendance") && styles.active),
          }}
        >
          Attendance
        </Link>


        <Link
          to="/justification"
          style={{
            ...styles.menuItem,
            ...(isActive("/justification") && styles.active),
          }}
        >
          Justification
        </Link>

        <Link
          to="/leave"
          style={{
            ...styles.menuItem,
            ...(isActive("/leave") && styles.active),
          }}
        >
          Leave
        </Link>

        {user?.role === "admin" && (
          <Link
            to="/admin"
            style={{
              ...styles.menuItem,
              ...(isActive("/admin") && styles.active),
            }}
          >
            Admin
          </Link>
        )}
      </div>

      {/* Profile Section */}
      <div style={styles.profileSection} onClick={(e) => e.stopPropagation()}>
        <div style={styles.profileCircle} onClick={() => setOpen(!open)}>
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>

        {open && (
          <div style={styles.dropdown}>
            <p style={styles.userName}>{user?.name}</p>
            <p style={styles.userId}>{user?.employee_id}</p>

            <hr style={styles.divider} />

            <p style={styles.link} onClick={() => navigate("/profile")}>
              Profile
            </p>

            <p style={styles.link}>Change Password</p>

            <p style={styles.logout} onClick={handleLogout}>
              Logout
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  navbar: {
    height: "70px",
    backgroundColor: "#7D3C98",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 30px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },

  logo: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#FFFFFF",
  },

  menu: {
    display: "flex",
    gap: "25px",
    alignItems: "center",
  },

  menuItem: {
    textDecoration: "none",
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: "15px",
    padding: "8px 14px",
    borderRadius: "8px",
  },

  active: {
    backgroundColor: "#9B59B6",
  },

  profileSection: {
    position: "relative",
  },

  profileCircle: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#FFFFFF",
    color: "#7D3C98",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "16px",
  },

  dropdown: {
    position: "absolute",
    top: "60px",
    right: "0",
    backgroundColor: "#FFFFFF",
    padding: "18px",
    borderRadius: "12px",
    width: "220px",
    boxShadow: "0 15px 40px rgba(0,0,0,0.08)",
  },

  userName: {
    fontWeight: "600",
    marginBottom: "4px",
    color: "#7D3C98",
  },

  userId: {
    fontSize: "13px",
    color: "#95A5A6",
    marginBottom: "10px",
  },

  divider: {
    border: "none",
    borderTop: "1px solid #eee",
    margin: "10px 0",
  },

  link: {
    cursor: "pointer",
    padding: "8px 0",
    fontSize: "14px",
    color: "#333",
  },

  logout: {
    cursor: "pointer",
    padding: "8px 0",
    color: "red",
    fontWeight: "500",
  },
};

export default Navbar;