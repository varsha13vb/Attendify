import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!employeeId || !password) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await loginUser({
        employee_id: employeeId,
        password: password,
      });

      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        if (data.user) {
          localStorage.setItem("currentUser", JSON.stringify(data.user));
        } else {
          localStorage.removeItem("currentUser");
        }
        navigate("/dashboard");
      } else {
        setError(data.message || "Invalid Employee ID or Password");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>

      {/* 🔥 Animations */}
      <style>{`
      @keyframes gradientMove {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      `}</style>

      {/* Background Effects */}
      <div style={styles.bgCircle1}></div>
      <div style={styles.bgCircle2}></div>
      <div style={styles.glow}></div>

      <div style={styles.wrapper}>
        
        {/* LEFT SIDE */}
        <form style={styles.form} onSubmit={handleLogin}>
          <h2 style={styles.heading}>Attendify Login</h2>

          {error && <p style={styles.error}>{error}</p>}

          <input
            type="text"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            style={styles.input}
            onFocus={e => e.target.style.boxShadow = "0 0 0 2px #7D3C98"}
            onBlur={e => e.target.style.boxShadow = "none"}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            onFocus={e => e.target.style.boxShadow = "0 0 0 2px #7D3C98"}
            onBlur={e => e.target.style.boxShadow = "none"}
          />

          <div style={styles.forgotRow}>
            <Link to="/forgot-password" style={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
            onMouseEnter={e => {
              e.target.style.transform = "scale(1.05)";
              e.target.style.boxShadow = "0 10px 25px rgba(125,60,152,0.5)";
            }}
            onMouseLeave={e => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "none";
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p style={styles.switchText}>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </form>

        {/* RIGHT SIDE */}
        <div style={styles.sidePanel}>
          <h2 style={styles.welcomeTitle}>Welcome Back!</h2>
          <p style={styles.welcomeText}>
            Enter your credentials and start managing attendance seamlessly.
          </p>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "Segoe UI, sans-serif",
  background: "linear-gradient(270deg, #5B2C6F, #7D3C98, #9B59B6, #6C3483)",
  backgroundSize: "600% 600%",
  animation: "gradientMove 12s ease infinite",
  position: "relative",
  overflow: "hidden",
},

  bgCircle1: {
  position: "absolute",
  width: "350px",
  height: "350px",
  background: "radial-gradient(circle, rgba(255,255,255,0.7), transparent)",
  borderRadius: "50%",
  top: "-100px",
  left: "-100px",
  filter: "blur(80px)",
  animation: "float 6s ease-in-out infinite",
  zIndex: 0,
},

bgCircle2: {
  position: "absolute",
  width: "350px",
  height: "350px",
  background: "radial-gradient(circle, rgba(255,255,255,0.7), transparent)",
  borderRadius: "50%",
  bottom: "-100px",
  right: "-100px",
  filter: "blur(80px)",
  animation: "float 8s ease-in-out infinite",
  zIndex: 0,
},

  glow: {
  position: "absolute",
  width: "500px",
  height: "500px",
  background: "rgba(155,89,182,0.2)", // reduce intensity
  filter: "blur(150px)",
  borderRadius: "50%",
  zIndex: 0,
},

  wrapper: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    width: "850px",
    height: "500px",
    borderRadius: "20px",
    overflow: "hidden",
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.2)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
    animation: "fadeIn 0.8s ease",
  },

  form: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px",
    background: "rgba(255,255,255,0.92)",
  },

  sidePanel: {
    flex: 1,
    background:
      "linear-gradient(rgba(125,60,152,0.8), rgba(91,44,111,0.8)), url('/images/bglogin.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
    textAlign: "center",
  },

  heading: {
    textAlign: "center",
    color: "#7D3C98",
    marginBottom: "20px",
    fontSize: "22px",
    fontWeight: "700",
  },

  welcomeTitle: {
    fontSize: "30px",
    fontWeight: "700",
    marginBottom: "15px",
  },

  welcomeText: {
    fontSize: "14px",
    maxWidth: "250px",
    opacity: 0.9,
  },

  input: {
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
    transition: "0.3s",
  },

  forgotRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "18px",
  },

  forgotLink: {
    color: "#7D3C98",
    fontSize: "14px",
    textDecoration: "none",
    fontWeight: "600",
  },

  button: {
    padding: "12px",
    background: "linear-gradient(135deg, #7D3C98, #5B2C6F)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },

  error: {
    color: "red",
    textAlign: "center",
    marginBottom: "10px",
  },

  switchText: {
    textAlign: "center",
    marginTop: "15px",
    fontSize: "14px",
  },
};

export default Login;
