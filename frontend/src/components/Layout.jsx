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
    height: "100vh",
    background: "#F5F5F5",
    overflow: "hidden",
  },

  main: {
    marginLeft: "240px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    minHeight: 0,
    height: "100vh",
  },

  content: {
    flex: 1,
    minHeight: 0,
    padding: "20px",
    overflowY: "auto",
    overflowX: "hidden",
  },
};

export default Layout;
