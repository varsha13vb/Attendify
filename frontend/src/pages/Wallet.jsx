import Layout from "../components/Layout";

function Wallet() {
  // Dummy data for now
  const monthlyLimit = 45;
  const usedMinutes = 18;
  const remaining = monthlyLimit - usedMinutes;

  const percentageUsed = (usedMinutes / monthlyLimit) * 100;

  return (
    <Layout>
      <div style={styles.wrapper}>
        <h2 style={styles.heading}>Late-Time Wallet</h2>

        <div style={styles.card}>
          <div style={styles.statRow}>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Monthly Limit</p>
              <p style={styles.statValue}>{monthlyLimit} Min</p>
            </div>

            <div style={styles.statBox}>
              <p style={styles.statLabel}>Used</p>
              <p style={styles.statValue}>{usedMinutes} Min</p>
            </div>

            <div style={styles.statBox}>
              <p style={styles.statLabel}>Remaining</p>
              <p style={styles.statValue}>{remaining} Min</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={styles.progressWrapper}>
            <div
              style={{
                ...styles.progressFill,
                width: `${percentageUsed}%`,
                background:
                  percentageUsed > 80
                    ? "linear-gradient(135deg, #DC2626, #B91C1C)"
                    : "linear-gradient(135deg, #7D3C98, #5B2C6F)",
              }}
            />
          </div>

          <p style={styles.percentText}>
            {percentageUsed.toFixed(1)}% of monthly limit used
          </p>

          {percentageUsed > 80 && (
            <div style={styles.warningBox}>
              ⚠ You are close to exceeding your late-time limit!
            </div>
          )}
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
    color: "#7D3C98",
    marginBottom: "25px",
  },

  card: {
    maxWidth: "600px",
    backgroundColor: "#FFFFFF",
    padding: "35px",
    borderRadius: "15px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },

  statRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "30px",
  },

  statBox: {
    textAlign: "center",
  },

  statLabel: {
    fontSize: "14px",
    color: "#6B7280",
  },

  statValue: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#7D3C98",
  },

  progressWrapper: {
    width: "100%",
    height: "22px",
    backgroundColor: "#E5E7EB",
    borderRadius: "12px",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    transition: "width 0.6s ease",
  },

  percentText: {
    marginTop: "12px",
    fontWeight: "500",
  },

  warningBox: {
    marginTop: "20px",
    padding: "12px",
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    borderRadius: "10px",
    fontWeight: "500",
  },
};

export default Wallet;