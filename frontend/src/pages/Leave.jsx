import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { applyLeave, getLeaves } from "../services/api";

function Leave() {
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: ""
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser"));
      const data = await getLeaves(user.employee_id);
      setLeaveHistory(data || []);
    } catch (error) {
      console.error("Error fetching leave history:", error);
    }
  };

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
        reason: formData.reason
      });

      if (response.message) {
        setSuccessMessage("Leave applied successfully!");

        setFormData({
          leaveType: "",
          fromDate: "",
          toDate: "",
          reason: ""
        });

        fetchLeaves(); // refresh table
      }

    } catch (error) {
      console.error("Leave error:", error);
      setErrorMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={styles.wrapper}>

        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.heading}>Leave History</h2>

          <button
            style={styles.applyButton}
            onClick={() => setShowForm(!showForm)}
          >
            Apply Leave
          </button>
        </div>

        {/* Leave Table */}
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>From</th>
                <th style={styles.th}>To</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>

            <tbody>
              {leaveHistory.length === 0 ? (
                <tr>
                  <td colSpan="5" style={styles.noData}>
                    No Leave Records
                  </td>
                </tr>
              ) : (
                leaveHistory.map((leave, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{leave.leave_type}</td>
                    <td style={styles.td}>{leave.from_date}</td>
                    <td style={styles.td}>{leave.to_date}</td>
                    <td style={styles.td}>{leave.reason}</td>

                    <td style={styles.td}>
                      <span
                        style={
                          leave.status === "Approved"
                            ? styles.approved
                            : leave.status === "Rejected"
                            ? styles.rejected
                            : styles.pending
                        }
                      >
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Leave Form */}
        {showForm && (
          <div style={styles.card}>
            <h3 style={styles.formTitle}>Apply for Leave</h3>

            {successMessage && (
              <div style={styles.successBox}>{successMessage}</div>
            )}

            {errorMessage && (
              <div style={styles.errorBox}>{errorMessage}</div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>

              <select
                name="leaveType"
                value={formData.leaveType}
                onChange={handleChange}
                required
                style={styles.input}
              >
                <option value="">Leave Type</option>
                <option value="Sick">Sick</option>
                <option value="Casual">Casual</option>
                <option value="Earned">Earned</option>
                <option value="Unpaid">Unpaid</option>
              </select>

              <div style={styles.row}>
                <input
                  type="date"
                  name="fromDate"
                  value={formData.fromDate}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />

                <input
                  type="date"
                  name="toDate"
                  value={formData.toDate}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>

              <textarea
                name="reason"
                placeholder="Reason"
                value={formData.reason}
                onChange={handleChange}
                required
                style={styles.textarea}
              />

              <button type="submit" style={styles.submitButton}>
                {loading ? "Submitting..." : "Submit Leave"}
              </button>

            </form>
          </div>
        )}

      </div>
    </Layout>
  );
}

const styles = {

wrapper:{
padding:"30px"
},

header:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"20px"
},

heading:{
color:"#7D3C98"
},

applyButton:{
padding:"10px 18px",
background:"#7D3C98",
color:"#fff",
border:"none",
borderRadius:"8px",
cursor:"pointer"
},

tableCard:{
background:"#fff",
borderRadius:"12px",
boxShadow:"0 10px 20px rgba(0,0,0,0.08)",
padding:"20px",
marginBottom:"30px"
},

table:{
width:"100%",
borderCollapse:"collapse",
textAlign:"center"
},

th:{
padding:"12px",
borderBottom:"2px solid #eee"
},

td:{
padding:"10px",
borderBottom:"1px solid #eee"
},

noData:{
padding:"20px"
},

approved:{
color:"green",
fontWeight:"600"
},

rejected:{
color:"red",
fontWeight:"600"
},

pending:{
color:"orange",
fontWeight:"600"
},

card:{
background:"#fff",
padding:"30px",
borderRadius:"12px",
boxShadow:"0 10px 20px rgba(0,0,0,0.08)",
maxWidth:"600px"
},

form:{
display:"flex",
flexDirection:"column",
gap:"15px"
},

row:{
display:"flex",
gap:"10px"
},

input:{
padding:"10px",
borderRadius:"8px",
border:"1px solid #ddd"
},

textarea:{
padding:"10px",
borderRadius:"8px",
border:"1px solid #ddd",
minHeight:"80px"
},

submitButton:{
padding:"12px",
background:"#7D3C98",
color:"#fff",
border:"none",
borderRadius:"8px",
cursor:"pointer"
},

successBox:{
background:"#DCFCE7",
padding:"10px",
borderRadius:"8px"
},

errorBox:{
background:"#FEE2E2",
padding:"10px",
borderRadius:"8px"
}

};

export default Leave;