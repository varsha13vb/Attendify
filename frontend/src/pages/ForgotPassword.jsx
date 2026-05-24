import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      setSuccess("");
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      setSuccess("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await requestPasswordReset(trimmedEmail);
      setSuccess(data.message || "If an account exists for this email, a reset link has been sent.");
    } catch (requestError) {
      setError(requestError.message || "Failed to send password reset email.");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <form style={styles.form} onSubmit={handleSubmit}>
          <h2 style={styles.heading}>Forgot Password</h2>
          <p style={styles.description}>
            Enter the email linked to your Attendify account and we will send you a reset link.
          </p>

          {error ? <p style={styles.error}>{error}</p> : null}
          {success ? <p style={styles.success}>{success}</p> : null}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={styles.input}
          />

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </button>

          <p style={styles.linkText}>
            Remembered your password? <Link to="/">Back to login</Link>
          </p>
          <p style={styles.linkText}>
            Need a new account? <Link to="/register">Register</Link>
          </p>
        </form>

        <div style={styles.sidePanel}>
          <h2 style={styles.sideTitle}>Secure Password Recovery</h2>
          <p style={styles.sideText}>
            We will email a one-time reset link so you can choose a new password safely.
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

export default ForgotPassword;
