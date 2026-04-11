const STORAGE_KEY = "darkMode";

export function applyDarkMode(enabled) {
  const isDark = Boolean(enabled);
  document.body.classList.toggle("theme-dark", isDark);
  try {
    localStorage.setItem(STORAGE_KEY, isDark ? "true" : "false");
  } catch {
    // ignore storage failures
  }
}

export function getStoredDarkMode() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

