import { useState } from "react";
import Layout from "../components/Layout";
import { updateProfile } from "../services/api";

function Profile() {

  const storedUser = JSON.parse(localStorage.getItem("currentUser"));

  const [name, setName] = useState(storedUser?.name || "");
  const [email, setEmail] = useState(storedUser?.email || "");
  const [dob, setDob] = useState(storedUser?.dob || "");

  const [department, setDepartment] = useState(storedUser?.department || "");
  const [joiningDate, setJoiningDate] = useState(storedUser?.joining_date || "");

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(
    storedUser?.profile_image
      ? `http://127.0.0.1:5000/api/profile/uploads/${storedUser.profile_image}`
      : null
  );

  const [loading, setLoading] = useState(false);

  /* IMAGE CHANGE */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file)); // instant preview
    }
  };

  /* SAVE */
  const handleSave = async () => {
    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("name", name);
      formData.append("email", email);
      formData.append("dob", dob);
      formData.append("department", department);
      formData.append("joining_date", joiningDate);

      if (imageFile) {
        formData.append("profile_image", imageFile);
      }

      const response = await updateProfile(formData);

      const updatedUser = {
        ...storedUser,
        name,
        email,
        dob,
        department,
        joining_date: joiningDate,
        profile_image: response.profile_image,
      };

      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      // update preview with real backend image
      if (response.profile_image) {
        setPreview(
          `http://127.0.0.1:5000/api/profile/uploads/${response.profile_image}`
        );
      }

      alert("Profile updated successfully!");

    } catch (error) {
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>

      <div style={styles.wrapper}>

        {/* LEFT CARD */}
        <div style={styles.leftCard}>

          <div style={styles.avatarContainer}>
            {preview ? (
              <img src={preview} alt="profile" style={styles.image} />
            ) : (
              <div style={styles.avatar}>
                {name?.charAt(0).toUpperCase()}
              </div>
            )}

            <label style={styles.editIcon}>
              ✎
              <input type="file" onChange={handleImageChange} hidden />
            </label>
          </div>

          <h3>{name}</h3>
          <p>{email}</p>
          <p style={{ color: "#777" }}>{storedUser?.role}</p>

        </div>


        {/* RIGHT SIDE */}
        <div style={styles.right}>

          {/* PERSONAL INFO */}
          <div style={styles.card}>
            <h3 style={styles.title}>Personal Information</h3>

            <div style={styles.field}>
              <label>Name</label>
              <input value={name} onChange={(e)=>setName(e.target.value)} style={styles.input}/>
            </div>

            <div style={styles.field}>
              <label>Email</label>
              <input value={email} onChange={(e)=>setEmail(e.target.value)} style={styles.input}/>
            </div>

            <div style={styles.field}>
              <label>Date of Birth</label>
              <input type="date" value={dob} onChange={(e)=>setDob(e.target.value)} style={styles.input}/>
            </div>

          </div>

          {/* WORK INFO */}
          <div style={styles.card}>
            <h3 style={styles.title}>Work Information</h3>

            <div style={styles.field}>
              <label>Department</label>
              <input value={department} onChange={(e)=>setDepartment(e.target.value)} style={styles.input}/>
            </div>

            <div style={styles.field}>
              <label>Joining Date</label>
              <input type="date" value={joiningDate} onChange={(e)=>setJoiningDate(e.target.value)} style={styles.input}/>
            </div>

            <div style={styles.field}>
              <label>Employee ID</label>
              <input value={storedUser?.employee_id} disabled style={styles.inputDisabled}/>
            </div>

            <div style={styles.field}>
              <label>Role</label>
              <input value={storedUser?.role} disabled style={styles.inputDisabled}/>
            </div>

          </div>

          <button onClick={handleSave} style={styles.button}>
            {loading ? "Saving..." : "Save Changes"}
          </button>

        </div>

      </div>

    </Layout>
  );
}


/* ===== STYLES ===== */

const styles = {

  wrapper: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    gap: "25px",
    padding: "30px",
  },

  leftCard: {
    background: "#fff",
    padding: "25px",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },

  avatarContainer: {
    position: "relative",
    width: "110px",
    height: "110px",
    margin: "0 auto 10px",
  },

  image: {
    width: "110px",
    height: "110px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #7D3C98",
  },

  avatar: {
    width: "110px",
    height: "110px",
    borderRadius: "50%",
    background: "#7D3C98",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "40px",
  },

  editIcon: {
    position: "absolute",
    bottom: "5px",
    right: "5px",
    background: "#7D3C98",
    color: "#fff",
    borderRadius: "50%",
    padding: "5px",
    cursor: "pointer",
  },

  right: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "16px",
  },

  title: {
    color: "#7D3C98",
    marginBottom: "10px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "12px",
  },

  input: {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },

  inputDisabled: {
    padding: "8px",
    borderRadius: "6px",
    background: "#eee",
    border: "none",
  },

  button: {
    background: "#7D3C98",
    color: "#fff",
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },

};

export default Profile;