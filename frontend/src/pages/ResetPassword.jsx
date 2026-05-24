import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordWithToken } from "../services/api";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("This reset link is missing a token. Please request a new email.");
      setSuccess("");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      setSuccess("");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setSuccess("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await resetPasswordWithToken({
        token,
        password,
        confirmPassword,
      });
      setSuccess(data.message || "Password reset successful.");
      setTimeout(() => navigate("/"), 1500);
    } catch (requestError) {
      setError(requestError.message || "Failed to reset password.");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <form style={styles.form} onSubmit={handleSubmit}>
          <h2 style={styles.heading}>Reset Password</h2>
          <p style={styles.description}>
            Choose a new password for your Attendify account.
          </p>

          {error ? <p style={styles.error}>{error}</p> : null}
          {success ? <p style={styles.success}>{success}</p> : null}

          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            style={styles.input}
          />

          <button type="submit" style={styles.button} disabled={loading || !token}>
            {loading ? "Updating..." : "Reset password"}
          </button>

          <p style={styles.linkText}>
            Need another reset link? <Link to="/forgot-password">Request by email</Link>
          </p>
          <p style={styles.linkText}>
            Back to <Link to="/">login</Link>
          </p>
        </form>

        <div style={styles.sidePanel}>
          <h2 style={styles.sideTitle}>Choose A Fresh Password</h2>
          <p style={styles.sideText}>
            Once your password is updated, you can sign in again with your employee ID and new password.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "var(--bg)",
    fontFamily: "Segoe UI, sans-serif",
    padding: "24px",
  },
  wrapper: {
    display: "flex",
    width: "900px",
    minHeight: "500px",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
    backgroundColor: "var(--surface)",
  },
  form: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px",
    background: "rgba(255,255,255,0.95)",
  },
  heading: {
    textAlign: "center",
    color: "#7D3C98",
    marginBottom: "12px",
  },
  description: {
    textAlign: "center",
    color: "#666666",
    marginBottom: "24px",
    lineHeight: 1.5,
  },
  input: {
    padding: "12px",
    marginBottom: "16px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    fontSize: "14px",
    background: "var(--surface)",
    color: "var(--text)",
  },
  button: {
    padding: "12px",
    backgroundColor: "#7D3C98",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
  error: {
    color: "#b03a2e",
    textAlign: "center",
    marginBottom: "14px",
  },
  success: {
    color: "#1e8449",
    textAlign: "center",
    marginBottom: "14px",
  },
  linkText: {
    textAlign: "center",
    marginTop: "14px",
    fontSize: "14px",
  },
  sidePanel: {
    flex: 1,
    background: "linear-gradient(135deg, rgba(125,60,152,0.88), rgba(91,44,111,0.9)), url('/images/bglogin.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
    textAlign: "center",
  },
  sideTitle: {
    fontSize: "28px",
    marginBottom: "14px",
  },
  sideText: {
    fontSize: "15px",
    maxWidth: "280px",
    opacity: 0.92,
    lineHeight: 1.6,
  },
};

export default ResetPassword;
