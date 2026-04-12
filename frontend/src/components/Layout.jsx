import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function Layout({ children }) {
  return (
    <div style={styles.container}>
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main Section */}
      <div style={styles.main}>
        <Navbar />
        <div style={styles.content}>{children}</div>
      </div>

    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#F5F5F5",
  },

  main: {
    marginLeft: "240px",   // 🔥 THIS FIXES YOUR ISSUE
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },

  content: {
    flex: 1,
    padding: "20px",
    overflow: "auto",
  },
};

export default Layout;