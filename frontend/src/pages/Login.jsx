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
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        navigate("/dashboard");
      } else {
        setError(data.message || "Invalid Employee ID or Password");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        {/* LEFT SIDE - FORM */}
        <form style={styles.form} onSubmit={handleLogin}>
          <h2 style={styles.heading}>Attendify Login</h2>

          {error && (
            <p style={styles.error}>
              {error}
            </p>
          )}

          <input
            type="text"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <p style={styles.switchText}>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </form>

        {/* RIGHT SIDE PANEL */}
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
    background: "linear-gradient(135deg, #F5F5F5, #BDC3C7)",
    fontFamily: "Segoe UI, sans-serif",
  },

  wrapper: {
    display: "flex",
    width: "850px",
    height: "500px",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
    backgroundColor: "#FFFFFF",
  },

  form: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px",
  },

  sidePanel: {
    flex: 1,
    background: "linear-gradient(135deg, #7D3C98, #5B2C6F)",
    color: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
    textAlign: "center",

    // Uncomment below if using image
    backgroundImage: "url('/images/bglogin.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },

  heading: {
    textAlign: "center",
    color: "#7D3C98",
    marginBottom: "20px",
  },

  welcomeTitle: {
    fontSize: "28px",
    fontWeight: "600",
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
    border: "1px solid #BDC3C7",
    fontSize: "14px",
    outline: "none",
  },

  button: {
    padding: "12px",
    backgroundColor: "#7D3C98",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontWeight: "500",
    cursor: "pointer",
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