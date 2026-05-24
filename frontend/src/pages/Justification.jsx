import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { applyJustification, getMyJustifications } from "../services/api";

function Justification() {

  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getMyJustifications();
        setRequests(data);
      } catch (error) {
        console.error("Error fetching justifications:", error);
      }
    };

    fetchRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      alert("Please enter justification reason");
      return;
    }

    try {
      await applyJustification(reason, Number(0));
      setReason("");
      try {
        const data = await getMyJustifications();
        setRequests(data);
      } catch (fetchErr) {
        console.error("Error fetching justifications:", fetchErr);
      }
      setShowForm(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const getStatusStyle = (status) => {
    if (status === "Approved") return styles.approved;
    if (status === "Rejected") return styles.rejected;
    return styles.pending;
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
                <th style={{ ...styles.th, ...styles.dateColumn }}>Date</th>
                <th style={{ ...styles.th, ...styles.reasonColumn }}>Reason</th>
                <th style={{ ...styles.th, ...styles.statusColumn }}>Status</th>
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
                    <td style={{ ...styles.td, ...styles.dateColumn }}>{req.date}</td>
                    <td style={{ ...styles.td, ...styles.reasonColumn }}>{req.reason}</td>

                    <td style={{ ...styles.td, ...styles.statusColumn, ...styles.statusCell }}>
                      <span style={getStatusStyle(req.status)}>
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
background:"var(--surface)",
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
border:"1px solid var(--border)",
background:"var(--surface)",
color:"var(--text)",
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
background:"var(--surface)",
padding:"20px",
borderRadius:"15px",
boxShadow:"0 10px 25px rgba(0,0,0,0.08)",
overflowX:"auto"
},

table:{
width:"100%",
borderCollapse:"collapse",
tableLayout:"fixed"
},

headerRow:{
background:"var(--surface-2)"
},

th:{
padding:"14px",
borderBottom:"2px solid var(--border)",
textAlign:"left"
},

td:{
padding:"12px",
borderBottom:"1px solid var(--border)",
textAlign:"left",
verticalAlign:"middle",
wordBreak:"break-word"
},

dateColumn:{
width:"22%"
},

reasonColumn:{
width:"50%"
},

statusColumn:{
width:"28%"
},

statusCell:{
whiteSpace:"nowrap"
},

noData:{
padding:"20px",
textAlign:"center",
color:"var(--muted-text)"
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
}

};

export default Justification;
