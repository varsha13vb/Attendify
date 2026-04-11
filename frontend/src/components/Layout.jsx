import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function Layout({ children }) {
  return (
    <div style={styles.container}>
      <Sidebar />

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
    background: "var(--bg)",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    background: "var(--bg)",
  },
  content: {
    flex: 1,
    padding: "20px",
    overflow: "auto",
    background: "var(--bg)",
    color: "var(--text)",
  },
};

export default Layout;
