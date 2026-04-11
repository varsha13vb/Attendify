import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Navbar() {

  const location = useLocation();
  const navigate = useNavigate();
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    user = null;
  }

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

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("touchstart", handleOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    setOpen(false);
    navigate("/");
  };

  const avatarUrl = user?.profile_image
    ? `http://127.0.0.1:5000/api/profile/uploads/${user.profile_image}`
    : null;

  return (
    <div style={styles.navbar}>

      {/* Page Title */}
      <h2 style={styles.title}>{getTitle()}</h2>

      {/* Profile */}
      <div style={styles.profileWrap} ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={styles.profileButton}
          aria-haspopup="menu"
          aria-expanded={open}
          title="Account"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="profile" style={styles.avatarImg} />
          ) : (
            <span>{user?.name?.charAt(0)?.toUpperCase()}</span>
          )}
        </button>

        {open && (
          <div style={styles.dropdown} role="menu">
            <button
              type="button"
              style={styles.menuItem}
              onClick={() => {
                setOpen(false);
                navigate("/profile");
              }}
            >
              Profile
            </button>
            <button
              type="button"
              style={styles.menuItem}
              onClick={() => {
                setOpen(false);
                navigate("/preferences");
              }}
            >
              Preferences
            </button>
            <div style={styles.divider} />
            <button type="button" style={styles.menuItemDanger} onClick={handleLogout}>
              Logout
            </button>
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
    padding: "0 25px",
    color: "#fff",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },

  title: {
    fontSize: "20px",
    fontWeight: "600",
    letterSpacing: "0.5px",
  },

  profileWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  profileButton: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "var(--surface)",
    color: "#7D3C98",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.35)",
    padding: 0,
    overflow: "hidden",
  },

  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  dropdown: {
    position: "absolute",
    top: "52px",
    right: 0,
    width: "190px",
    background: "var(--surface)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 14px 35px rgba(0,0,0,0.16)",
    zIndex: 50,
  },

  menuItem: {
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    background: "transparent",
    color: "var(--text)",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
  },

  menuItemDanger: {
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    background: "transparent",
    color: "#dc2626",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },

  divider: {
    height: "1px",
    background: "var(--border)",
  },
};

export default Navbar;
