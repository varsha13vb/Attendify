import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Justification from "./pages/Justification";
import AdminPanel from "./pages/AdminPanel";
import Leave from "./pages/Leave";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import Preferences from "./pages/Preferences";
import { getPreferences, getProfileMe } from "./services/api";
import { applyDarkMode, getStoredDarkMode } from "./utils/theme";

function App() {
  useEffect(() => {
    // Apply locally stored theme instantly (avoids flash)
    applyDarkMode(getStoredDarkMode());

    // If logged in, sync from backend preferences
    const token = localStorage.getItem("token");
    if (!token || !token.trim()) return;

    (async () => {
      try {
        const prefs = await getPreferences();
        applyDarkMode(Boolean(prefs?.darkMode));
      } catch {
        // ignore (offline / expired token / etc.)
      }

      try {
        const me = await getProfileMe();
        const userForStorage = {
          employee_id: me.employee_id,
          name: me.name,
          email: me.email,
          dob: me.dob,
          role: me.role,
          profile_image: me.profile_image,
          created_at: me.created_at,
        };
        localStorage.setItem("currentUser", JSON.stringify(userForStorage));
      } catch {
        // ignore (expired token / etc.)
      }
    })();
  }, []);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <Attendance />
          </ProtectedRoute>
        }
      />


      <Route
        path="/justification"
        element={
          <ProtectedRoute>
            <Justification />
          </ProtectedRoute>
        }
      />

      <Route
        path="/leave"
        element={
          <ProtectedRoute>
            <Leave />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      {/* ✅ Profile Route (Protected) */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/preferences"
        element={
          <ProtectedRoute>
            <Preferences />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default App;
