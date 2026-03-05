import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("currentUser"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

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
      <h2 style={styles.logo}>Attendify</h2>

      <div style={styles.profileSection} onClick={(e) => e.stopPropagation()}>
        <div
          style={styles.profileCircle}
          onClick={() => setOpen(!open)}
        >
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
    backgroundColor: "#FFFFFF",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 30px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
    borderBottom: "1px solid #F1F5F9",
  },

  logo: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#7D3C98",
    letterSpacing: "0.5px",
  },

  profileSection: {
    position: "relative",
  },

  profileCircle: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7D3C98, #5B2C6F)",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "16px",
    transition: "transform 0.2s ease",
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
    animation: "fadeDropdown 0.25s ease forwards",
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
    transition: "color 0.2s ease",
  },

  logout: {
    cursor: "pointer",
    padding: "8px 0",
    color: "red",
    fontWeight: "500",
  },
};

// Dropdown animation
const styleSheet = document.styleSheets[0];

styleSheet.insertRule(`
@keyframes fadeDropdown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`, styleSheet.cssRules.length);

export default Navbar;