import Navbar from "./Navbar";

function Layout({ children }) {
  return (
    <div style={{ background: "#F5F5F5", minHeight: "100vh" }}>
      <Navbar />

      <main style={{ padding: "30px" }}>
        {children}
      </main>
    </div>
  );
}

export default Layout;