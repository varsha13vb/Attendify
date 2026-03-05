import { useState } from "react";
import Layout from "../components/Layout";
import { updateProfile } from "../services/api";

function Profile() {
  const storedUser = JSON.parse(localStorage.getItem("currentUser"));

  const [name, setName] = useState(storedUser?.name || "");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(storedUser?.profile_image || null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", name);

      if (imageFile) {
        formData.append("profile_image", imageFile);
      }

      const response = await updateProfile(formData);

      const updatedUser = {
        ...storedUser,
        name: response.name,
        profile_image: response.profile_image,
      };

      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

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
        <h2 style={styles.heading}>My Profile</h2>

        <div style={styles.card}>

          {/* Avatar */}
          <div style={styles.avatarContainer}>
            {preview ? (
              <img
                src={`http://127.0.0.1:5000/api/profile/uploads/${preview}`}
                alt="profile"
                style={styles.image}
              />
            ) : (
              <div style={styles.avatar}>
                {name?.charAt(0).toUpperCase()}
              </div>
            )}

            <label style={styles.editIcon}>
              ✎
              <input
                type="file"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {/* Fields */}
          <div style={styles.field}>
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label>Employee ID</label>
            <input
              type="text"
              value={storedUser?.employee_id}
              disabled
              style={styles.inputDisabled}
            />
          </div>

          <div style={styles.field}>
            <label>Role</label>
            <input
              type="text"
              value={storedUser?.role}
              disabled
              style={styles.inputDisabled}
            />
          </div>

          <button
            style={styles.button}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>

        </div>
      </div>
    </Layout>
  );
}

const styles = {
  wrapper: { padding: "30px" },

  heading: {
    color: "#7D3C98",
    marginBottom: "25px",
  },

  card: {
    maxWidth: "600px",
    backgroundColor: "#FFFFFF",
    padding: "40px",
    borderRadius: "18px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },

  avatarContainer: {
    position: "relative",
    width: "130px",
    height: "130px",
    margin: "0 auto 30px auto",
  },

  image: {
    width: "130px",
    height: "130px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "4px solid #7D3C98",
  },

  avatar: {
    width: "130px",
    height: "130px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7D3C98, #5B2C6F)",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "55px",
    fontWeight: "bold",
  },

  editIcon: {
    position: "absolute",
    bottom: "5px",
    right: "5px",
    background: "#7D3C98",
    color: "#FFFFFF",
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "16px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "18px",
  },

  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },

  inputDisabled: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #eee",
    backgroundColor: "#F5F5F5",
  },

  button: {
    padding: "12px",
    background: "linear-gradient(135deg, #7D3C98, #5B2C6F)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "10px",
  },
};

export default Profile;