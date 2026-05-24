import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Layout from "../components/Layout";
import { applyLeave, getLeaves } from "../services/api";

const formatDateInputValue = (dateValue) => {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMinimumLeaveDate = () => {
  const dateValue = new Date();
  dateValue.setHours(0, 0, 0, 0);
  dateValue.setDate(dateValue.getDate() + 2);
  return formatDateInputValue(dateValue);
};

const getTodayDate = () => {
  const dateValue = new Date();
  dateValue.setHours(0, 0, 0, 0);
  return formatDateInputValue(dateValue);
};

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
  const todayDate = getTodayDate();
  const minimumLeaveDate = getMinimumLeaveDate();

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
      const message = "You are not logged in.";
      setErrorMessage(message);
      await Swal.fire("Error", message, "error");
      return;
    }

    if (formData.fromDate < todayDate) {
      const message = "Cannot apply leave for past dates.";
      setErrorMessage(message);
      await Swal.fire("Leave Not Allowed", message, "error");
      return;
    }

    if (formData.fromDate < minimumLeaveDate) {
      const message = "Leave must be applied at least 2 days in advance. You cannot apply for today or tomorrow.";
      setErrorMessage(message);
      await Swal.fire("Leave Not Allowed", message, "error");
      return;
    }

    if (formData.fromDate > formData.toDate) {
      const message = "From Date cannot be after To Date.";
      setErrorMessage(message);
      await Swal.fire("Error", message, "error");
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
        await Swal.fire("Success", "Leave applied successfully!", "success");

        setFormData({
          leaveType: "",
          fromDate: "",
          toDate: "",
          reason: ""
        });

        fetchLeaves(); // refresh table
      }

    } catch (error) {
      const message = error?.message || "Something went wrong.";
      setErrorMessage(message);
      await Swal.fire("Error", message, "error");
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
                <th style={{ ...styles.th, ...styles.typeColumn }}>Type</th>
                <th style={{ ...styles.th, ...styles.dateColumn }}>From</th>
                <th style={{ ...styles.th, ...styles.dateColumn }}>To</th>
                <th style={{ ...styles.th, ...styles.reasonColumn }}>Reason</th>
                <th style={{ ...styles.th, ...styles.statusColumn }}>Status</th>
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
                    <td style={{ ...styles.td, ...styles.typeColumn }}>{leave.leave_type}</td>
                    <td style={{ ...styles.td, ...styles.dateColumn }}>{leave.from_date}</td>
                    <td style={{ ...styles.td, ...styles.dateColumn }}>{leave.to_date}</td>
                    <td style={{ ...styles.td, ...styles.reasonColumn }}>{leave.reason}</td>

                    <td style={{ ...styles.td, ...styles.statusColumn, ...styles.statusCell }}>
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
                  min={minimumLeaveDate}
                  required
                  style={styles.input}
                />

                <input
                  type="date"
                  name="toDate"
                  value={formData.toDate}
                  onChange={handleChange}
                  min={formData.fromDate || minimumLeaveDate}
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
background:"var(--surface)",
borderRadius:"12px",
boxShadow:"0 10px 20px rgba(0,0,0,0.08)",
padding:"20px",
marginBottom:"30px"
},

table:{
width:"100%",
borderCollapse:"collapse",
tableLayout:"fixed"
},

th:{
padding:"14px 16px",
borderBottom:"2px solid var(--border)",
textAlign:"left"
},

td:{
padding:"18px 16px",
borderBottom:"1px solid var(--border)",
textAlign:"left",
verticalAlign:"middle",
wordBreak:"break-word"
},

typeColumn:{
width:"14%"
},

dateColumn:{
width:"18%"
},

reasonColumn:{
width:"32%"
},

statusColumn:{
width:"18%"
},

statusCell:{
whiteSpace:"nowrap"
},

noData:{
padding:"20px"
},

approved:{
background:"#DCFCE7",
color:"#16A34A",
fontWeight:"800",
padding:"6px 14px",
borderRadius:"999px",
fontSize:"12px",
textTransform:"uppercase",
display:"inline-block"
},

rejected:{
background:"#FEE2E2",
color:"#DC2626",
fontWeight:"800",
padding:"6px 14px",
borderRadius:"999px",
fontSize:"12px",
textTransform:"uppercase",
display:"inline-block"
},

pending:{
background:"#FEF3C7",
color:"#B45309",
fontWeight:"800",
padding:"6px 14px",
borderRadius:"999px",
fontSize:"12px",
textTransform:"uppercase",
display:"inline-block"
},

card:{
background:"var(--surface)",
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
border:"1px solid var(--border)",
background:"var(--surface)",
color:"var(--text)"
},

textarea:{
padding:"10px",
borderRadius:"8px",
border:"1px solid var(--border)",
background:"var(--surface)",
color:"var(--text)",
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
