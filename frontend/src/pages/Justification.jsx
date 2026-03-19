import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { applyJustification, getMyJustifications } from "../services/api";

function Justification() {

  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await getMyJustifications();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching justifications:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      alert("Please enter justification reason");
      return;
    }

    try {
      await applyJustification(reason);
      setReason("");
      fetchRequests();
      setShowForm(false);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <Layout>
      <div style={styles.wrapper}>

        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.heading}>Late Justification Requests</h2>

          <button
            style={styles.applyButton}
            onClick={() => setShowForm(!showForm)}
          >
            Apply Justification
          </button>
        </div>

        {/* Table */}
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>

            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="3" style={styles.noData}>
                    No Requests Found
                  </td>
                </tr>
              ) : (
                requests.map((req, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{req.date}</td>
                    <td style={styles.td}>{req.reason}</td>

                    <td style={styles.td}>
                      <span
                        style={
                          req.status === "Approved"
                            ? styles.approvedBadge
                            : req.status === "Rejected"
                            ? styles.rejectedBadge
                            : styles.pendingBadge
                        }
                      >
                        {req.status}
                      </span>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Form */}
        {showForm && (
          <div style={styles.formCard}>

            <form onSubmit={handleSubmit} style={styles.form}>

              <textarea
                placeholder="Enter your reason for late arrival..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={styles.textarea}
              />

              <button type="submit" style={styles.button}>
                Submit Justification
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

formCard:{
background:"#FFFFFF",
padding:"25px",
borderRadius:"15px",
boxShadow:"0 10px 25px rgba(0,0,0,0.08)",
maxWidth:"600px",
marginTop:"25px"
},

form:{
display:"flex",
flexDirection:"column",
gap:"15px"
},

textarea:{
minHeight:"100px",
padding:"12px",
borderRadius:"10px",
border:"1px solid #E5E7EB",
resize:"none"
},

button:{
padding:"12px",
background:"linear-gradient(135deg,#7D3C98,#5B2C6F)",
color:"#fff",
border:"none",
borderRadius:"10px",
cursor:"pointer"
},

tableCard:{
background:"#FFFFFF",
padding:"20px",
borderRadius:"15px",
boxShadow:"0 10px 25px rgba(0,0,0,0.08)",
overflowX:"auto"
},

table:{
width:"100%",
borderCollapse:"collapse"
},

headerRow:{
background:"#F8F9FB"
},

th:{
padding:"14px",
borderBottom:"2px solid #EEE",
textAlign:"left"
},

td:{
padding:"12px",
borderBottom:"1px solid #F1F5F9"
},

noData:{
padding:"20px",
textAlign:"center",
color:"#95A5A6"
},

pendingBadge:{
background:"#FEF3C7",
color:"#D97706",
padding:"6px 12px",
borderRadius:"20px",
fontSize:"13px"
},

approvedBadge:{
background:"#DCFCE7",
color:"#16A34A",
padding:"6px 12px",
borderRadius:"20px",
fontSize:"13px"
},

rejectedBadge:{
background:"#FEE2E2",
color:"#DC2626",
padding:"6px 12px",
borderRadius:"20px",
fontSize:"13px"
}

};

export default Justification;