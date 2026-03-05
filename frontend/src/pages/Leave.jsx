import { useState } from "react";
import Layout from "../components/Layout";
import { applyLeave } from "../services/api";

function Leave() {
  const [formData, setFormData] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: ""
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const token = localStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!token || !currentUser) {
      setErrorMessage("You are not logged in.");
      return;
    }

    if (formData.fromDate > formData.toDate) {
      setErrorMessage("From Date cannot be after To Date.");
      return;
    }

    try {
      setLoading(true);

      const response = await applyLeave({
        employee_id: currentUser.employee_id,
        leave_type: formData.leaveType,
        from_date: formData.fromDate,
        to_date: formData.toDate,
        reason: formData.reason,
      });

      if (response.message) {
        setSuccessMessage("Leave applied successfully!");
        setFormData({
          leaveType: "",
          fromDate: "",
          toDate: "",
          reason: ""
        });

        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        setErrorMessage("Failed to apply leave.");
      }

    } catch (error) {
      console.error("Leave error:", error);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={styles.wrapper}>
        <h2 style={styles.heading}>Apply for Leave</h2>

        {successMessage && (
          <div style={styles.successBox}>{successMessage}</div>
        )}

        {errorMessage && (
          <div style={styles.errorBox}>{errorMessage}</div>
        )}

        <div style={styles.card}>
          <form onSubmit={handleSubmit} style={styles.form}>

            <div style={styles.field}>
              <label style={styles.label}>Leave Type</label>
              <select
                name="leaveType"
                value={formData.leaveType}
                onChange={handleChange}
                required
                style={styles.input}
              >
                <option value="">Select Leave Type</option>
                <option value="Sick">Sick</option>
                <option value="Casual">Casual</option>
                <option value="Earned">Earned</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>From Date</label>
                <input
                  type="date"
                  name="fromDate"
                  value={formData.fromDate}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>To Date</label>
                <input
                  type="date"
                  name="toDate"
                  value={formData.toDate}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Reason</label>
              <textarea
                name="reason"
                value={formData.reason}
                placeholder="Enter reason..."
                onChange={handleChange}
                required
                style={styles.textarea}
              />
            </div>

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Submitting..." : "Apply Leave"}
            </button>

          </form>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  wrapper: {
    padding: "30px",
  },

  heading: {
    textAlign: "center",
    color: "#7D3C98",
    marginBottom: "25px",
  },

  card: {
    maxWidth: "650px",
    margin: "0 auto",
    backgroundColor: "#FFFFFF",
    padding: "35px",
    borderRadius: "15px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },

  successBox: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "20px",
    textAlign: "center",
    maxWidth: "650px",
    marginLeft: "auto",
    marginRight: "auto",
  },

  errorBox: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "20px",
    textAlign: "center",
    maxWidth: "650px",
    marginLeft: "auto",
    marginRight: "auto",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  row: {
    display: "flex",
    gap: "20px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },

  label: {
    fontWeight: "500",
    marginBottom: "6px",
    color: "#333",
  },

  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #E5E7EB",
    fontSize: "14px",
    outline: "none",
  },

  textarea: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #E5E7EB",
    minHeight: "100px",
    fontSize: "14px",
    resize: "none",
  },

  button: {
    padding: "14px",
    background: "linear-gradient(135deg, #7D3C98, #5B2C6F)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "15px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};

export default Leave;