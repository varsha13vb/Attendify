import { useLocation } from "react-router-dom";

function Navbar() {

  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("currentUser"));

  const getTitle = () => {
    switch (location.pathname) {
      case "/dashboard": return "Dashboard";
      case "/attendance": return "Attendance";
      case "/leave": return "Leave";
      case "/justification": return "Justification";
      case "/profile": return "Profile";
      case "/preferences": return "Preferences";
      case "/admin": return "Admin Panel";
      default: return "Attendify";
    }
  };

  return (
    <div style={styles.navbar}>

      {/* Page Title */}
      <h2 style={styles.title}>{getTitle()}</h2>

      {/* Profile */}
      <div style={styles.profileCircle}>
        {user?.name?.charAt(0)?.toUpperCase()}
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
    padding: "0 25px",
    color: "#fff",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },

  title: {
    fontSize: "20px",
    fontWeight: "600",
    letterSpacing: "0.5px",
  },

  profileCircle: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#fff",
    color: "#7D3C98",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    cursor: "pointer",
    transition: "0.3s",
  },
};

export default Navbar;