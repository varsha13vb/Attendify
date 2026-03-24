import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/api";
import Swal from "sweetalert2";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dob: "",
    password: "",
    confirmPassword: "",
    role: "employee",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleSelect = (role) => {
    setFormData({
      ...formData,
      role,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const name = (formData.name || "").trim();
    const email = (formData.email || "").trim().toLowerCase();
    const password = formData.password || "";
    const confirmPassword = formData.confirmPassword || "";

    if (!name || !email || !password || !confirmPassword) {
      Swal.fire("Error", "Please fill all fields", "error");
      return;
    }

    const emailRegex = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      Swal.fire("Error", "Invalid email format", "error");
      return;
    }

    if (password.length < 6) {
      Swal.fire("Error", "Password must be at least 6 characters", "error");
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire("Error", "Passwords do not match", "error");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword: _confirmPassword, ...dataToSend } = formData;
      dataToSend.name = name;
      dataToSend.email = email;
      // backend expects `confirm_password`; include it in payload
      dataToSend.confirm_password = confirmPassword;
      const data = await registerUser(dataToSend);

      if (data.employee_id) {
        Swal.fire({
          title: "Registration Successful!",
          html: `
            <p>Your Employee ID is:</p>
            <h2 style="color:#7D3C98">${data.employee_id}</h2>
          `,
          icon: "success",
          confirmButtonColor: "#7D3C98",
        }).then(() => {
          navigate("/");
        });
      } else {
        Swal.fire("Error", data.message || "Registration failed", "error");
      }
    } catch (error) {
      Swal.fire("Error", error?.message || "Something went wrong!", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>

        <form style={styles.form} onSubmit={handleRegister}>
          <h2 style={styles.heading}>Create Account</h2>

          <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} style={styles.input} />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} style={styles.input} />
          <input type="date" name="dob" value={formData.dob} onChange={handleChange} style={styles.input} />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} style={styles.input} />
          <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} style={styles.input} />

          <div style={styles.roleWrapper}>
            <button type="button"
              onClick={() => handleRoleSelect("employee")}
              style={{
                ...styles.roleButton,
                backgroundColor: formData.role === "employee" ? "#7D3C98" : "#F5F5F5",
                color: formData.role === "employee" ? "#FFFFFF" : "#7D3C98"
              }}>
              Employee
            </button>

            <button type="button"
              onClick={() => handleRoleSelect("admin")}
              style={{
                ...styles.roleButton,
                backgroundColor: formData.role === "admin" ? "#7D3C98" : "#F5F5F5",
                color: formData.role === "admin" ? "#FFFFFF" : "#7D3C98"
              }}>
              Admin
            </button>
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>

          <p style={styles.switchText}>
            Already have an account? <Link to="/">Login</Link>
          </p>
        </form>

        <div style={styles.sidePanel}>
          <h2 style={styles.welcomeTitle}>Join Attendify</h2>
          <p style={styles.welcomeText}>
            Create your account and experience seamless attendance management.
          </p>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #F5F5F5, #BDC3C7)",
    fontFamily: "Segoe UI, sans-serif",
  },

  wrapper: {
    display: "flex",
    width: "900px",
    minHeight: "550px",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
    backgroundColor: "#FFFFFF",
  },

  form: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px",
  },

  sidePanel: {
  flex: 1,
  background: "linear-gradient(135deg, #7D3C98, #5B2C6F)",
  color: "#FFFFFF",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: "40px",
  textAlign: "center",

  backgroundImage: "url('/images/bglogin.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
},

  heading: {
    textAlign: "center",
    color: "#7D3C98",
    marginBottom: "20px",
  },

  input: {
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #BDC3C7",
    fontSize: "14px",
  },

  roleWrapper: {
    display: "flex",
    gap: "10px",
    marginBottom: "15px",
  },

  roleButton: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #7D3C98",
    cursor: "pointer",
    fontWeight: "500",
  },

  button: {
    padding: "12px",
    backgroundColor: "#7D3C98",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontWeight: "500",
    cursor: "pointer",
  },

  switchText: {
    textAlign: "center",
    marginTop: "15px",
  },

  welcomeTitle: {
    fontSize: "26px",
    marginBottom: "10px",
  },

  welcomeText: {
    fontSize: "14px",
    maxWidth: "250px",
    opacity: 0.9,
  },
};

export default Register;
