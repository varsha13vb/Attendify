import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaCalendarCheck,
  FaFileAlt,
  FaUser,
  FaCog,
  FaUserShield
} from "react-icons/fa";

function Sidebar() {

  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("currentUser"));

  const isActive = (path) => location.pathname === path;

  const menu = [
    { name: "Dashboard", path: "/dashboard", icon: <FaHome /> },
    { name: "Attendance", path: "/attendance", icon: <FaCalendarCheck /> },
    { name: "Justification", path: "/justification", icon: <FaFileAlt /> },
    { name: "Leave", path: "/leave", icon: <FaFileAlt /> },
    { name: "Profile", path: "/profile", icon: <FaUser /> },
    { name: "Preferences", path: "/preferences", icon: <FaCog /> },
  ];

  return (
    <div style={styles.sidebar}>

      {/* Logo ONLY here */}
      <h2 style={styles.logo}>Attendify</h2>

      <div style={styles.menu}>
        {menu.map((item, index) => {

          const active = isActive(item.path);

          return (
            <Link
              key={index}
              to={item.path}
              style={{
                ...styles.link,
                ...(active && styles.activeLink)
              }}
            >
              <span style={{
                ...styles.icon,
                ...(active && styles.activeIcon)
              }}>
                {item.icon}
              </span>

              {item.name}
            </Link>
          );
        })}

        {/* Admin */}
        {user?.role === "admin" && (
          <Link
            to="/admin"
            style={{
              ...styles.link,
              ...(isActive("/admin") && styles.activeLink)
            }}
          >
            <span style={styles.icon}>
              <FaUserShield />
            </span>
            Admin
          </Link>
        )}
      </div>

    </div>
  );
}

const styles = {

  sidebar: {
    width: "240px",
    minWidth: "240px",
    height: "100vh",
    background: "linear-gradient(180deg, #7D3C98, #5B2C6F)",
    padding: "20px 10px",
    display: "flex",
    flexDirection: "column",
    color: "#fff",
  },

  logo: {
    textAlign: "center",
    marginBottom: "30px",
    fontSize: "22px",
    fontWeight: "600",
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  link: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 15px",
    borderRadius: "10px",
    textDecoration: "none",
    color: "#fff",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },

  icon: {
    fontSize: "16px",
    transition: "0.3s",
  },

  /* ACTIVE */
  activeLink: {
    backgroundColor: "rgba(255,255,255,0.2)",
    transform: "translateX(6px)",
    boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
  },

  activeIcon: {
    transform: "scale(1.2)",
  },
};

export default Sidebar;