const BASE_URL = "http://127.0.0.1:5000";

/* ================= HELPER ================= */

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token found");
  }

  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token.trim()}`
  };
};

/* ---------------- AUTH ---------------- */

export const loginUser = async (credentials) => {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(credentials)
  });

  return response.json();
};

export const registerUser = async (userData) => {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
};

/* ---------------- ATTENDANCE ---------------- */

export const getAttendance = async () => {
  const response = await fetch(`${BASE_URL}/api/attendance/records`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch attendance records");
  }

  return Array.isArray(data) ? data : [];
};

export const getTodayAttendanceStatus = async () => {
  const response = await fetch(`${BASE_URL}/api/attendance/today-status`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch today's attendance status");
  }

  return data;
};

export const requestPasswordReset = async (email) => {
  const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to send password reset email");
  }

  return data;
};

export const resetPasswordWithToken = async ({ token, password, confirmPassword }) => {
  const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      token,
      password,
      confirm_password: confirmPassword,
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to reset password");
  }

  return data;
};

export const clockInAttendance = async () => {
  const response = await fetch(`${BASE_URL}/api/attendance/clock-in`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to clock in");
  }

  return data;
};

export const clockOutAttendance = async () => {
  const response = await fetch(`${BASE_URL}/api/attendance/clock-out`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to clock out");
  }

  return data;
};

export const getAdminAttendanceForDate = async (attendanceDate, employeeId = "all") => {
  const params = new URLSearchParams();
  if (attendanceDate) params.set("date", attendanceDate);
  if (employeeId && employeeId !== "all") params.set("employee_id", employeeId);

  const response = await fetch(`${BASE_URL}/api/attendance/all?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch daily attendance");
  }

  return Array.isArray(data) ? data : [];
};

export const getMonthlyAttendanceSummary = async (month) => {
  const params = new URLSearchParams();
  if (month) params.set("month", month);

  const response = await fetch(`${BASE_URL}/api/attendance/monthly-summary?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch monthly attendance summary");
  }

  return Array.isArray(data) ? data : [];
};

export const getAdminDashboardSummary = async () => {
  const response = await fetch(`${BASE_URL}/api/attendance/dashboard-summary`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch admin dashboard summary");
  }

  return data;
};

/* ---------------- WALLET ---------------- */

export const getWalletInfo = async () => {
  const response = await fetch(`${BASE_URL}/api/wallet/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch wallet info");
  }

  return data;
};

/* ---------------- LEAVE ---------------- */

export const applyLeave = async (leaveData) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No token found");
  }

  const response = await fetch(`${BASE_URL}/api/leave/apply-leave`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token.trim()}`
    },
    body: JSON.stringify(leaveData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

/* ================= LATEST LEAVE ================= */

export const getLatestLeave = async (employeeId) => {
  const response = await fetch(
    `${BASE_URL}/api/leave/latest-leave/${employeeId}`,
    {
      method: "GET",
      headers: getAuthHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch latest leave");
  }

  return data;
};

/* ================= JUSTIFICATION ================= */

export const applyJustification = async (reason, lateMinutes = 0) => {
  const response = await fetch(`${BASE_URL}/api/justification/apply`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      reason,
      late_minutes: lateMinutes
    })
  });

  let data;

  try {
    data = await response.json();
  } catch (err) {
    throw new Error("Server returned invalid response (not JSON)");
  }

  if (!response.ok) {
    console.error("BACKEND ERROR:", data);
    throw new Error(data.message || "Failed to submit justification");
  }

  return data;
};

export const getMyJustifications = async () => {
  const response = await fetch(`${BASE_URL}/api/justification/my`, {
    method: "GET",
    headers: getAuthHeaders()
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch justifications");
  }

  return data;
};

/* ================= PROFILE ================= */
export const updateProfile = async (formData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/api/profile/update-profile`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  return response.json();
};

export const getProfileMe = async () => {
  const response = await fetch(`${BASE_URL}/api/profile/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch profile");
  }

  return data;
};

export const changePassword = async ({ oldPassword, newPassword }) => {
  const response = await fetch(`${BASE_URL}/api/profile/change-password`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update password");
  }

  return data;
};


/* ================= LEAVE HISTORY ================= */

export const getLeaves = async (employeeId) => {
  const response = await fetch(
    `${BASE_URL}/api/leave/my-leaves/${employeeId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch leave history");
  }

  return data;
};

/* ================= HOLIDAYS ================= */

export const getUpcomingHolidays = async () => {
  const response = await fetch(
    `${BASE_URL}/api/holidays/upcoming`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch holidays");
  }

  return data;
};


/* ================= NOTIFICATIONS ================= */

export const getNotifications = async () => {
  const response = await fetch(
    `${BASE_URL}/api/notifications`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch notifications");
  }

  return data;
};

/* ================= PREFERENCES ================= */

export const getPreferences = async () => {
  const response = await fetch(
    `${BASE_URL}/api/preferences/get`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch preferences");
  }

  return data;
};


export const updatePreferences = async (preferencesData) => {
  const response = await fetch(
    `${BASE_URL}/api/preferences/update`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(preferencesData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update preferences");
  }

  return data;
};

/* ================= ADMIN MANAGEMENT ================= */

export const getAllEmployees = async () => {
  const response = await fetch(`${BASE_URL}/api/admin/employees`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch employees");
  return data;
};

export const addEmployee = async (employeeData) => {
  const response = await fetch(`${BASE_URL}/api/admin/employees`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(employeeData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to add employee");
  return data;
};
