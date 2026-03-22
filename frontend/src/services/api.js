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
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/api/attendance/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  return response.json();
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

export const applyJustification = async (reason) => {
  const response = await fetch(`${BASE_URL}/api/justification/apply`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason })
  });

  const data = await response.json();

  if (!response.ok) {
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

