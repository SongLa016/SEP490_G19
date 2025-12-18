const TOKEN_KEY = "token";
const USER_KEY = "user";

const safeAtob = (value) => {
  if (!value) {
    return null;
  }

  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    if (typeof window !== "undefined" && typeof window.atob === "function") {
      return window.atob(padded);
    }

    if (typeof Buffer !== "undefined") {
      // Fallback for non-browser environments (tests, storybook, etc.)
      return Buffer.from(padded, "base64").toString("binary");
    }

    return null;
  } catch (error) {
    console.warn("Failed to decode token payload:", error);
    return null;
  }
};

export const decodeTokenPayload = (token) => {
  if (!token) return null;

  const [, payload] = token.split(".");
  if (!payload) return null;

  const decoded = safeAtob(payload);
  if (!decoded) return null;

  try {
    return JSON.parse(decoded);
  } catch (error) {
    console.warn("Failed to parse token payload:", error);
    return null;
  }
};

export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const storeToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch {
    /* istanbul ignore next */
  }
};

export const removeStoredToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* istanbul ignore next */
  }
};

export const isTokenExpired = (token) => {
  if (!token) return true;

  const payload = decodeTokenPayload(token);
  if (!payload?.exp) {
    return false;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
};

export const clearPersistedAuth = () => {
  removeStoredToken();
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    /* istanbul ignore next */
  }
};

export const getValidToken = () => {
  const token = getStoredToken();
  if (!token) {
    return null;
  }

  if (isTokenExpired(token)) {
    clearPersistedAuth();
    return null;
  }

  return token;
};

/**
 * Hiển thị thông báo phiên đăng nhập hết hạn và redirect về trang login
 * @param {Object} options - Tùy chọn
 * @param {string} options.title - Tiêu đề thông báo (mặc định: "Phiên đăng nhập hết hạn")
 * @param {string} options.text - Nội dung thông báo (mặc định: "Vui lòng đăng nhập lại để tiếp tục.")
 * @param {string} options.confirmButtonText - Text của button (mặc định: "Đăng nhập")
 * @param {boolean} options.clearAuth - Có xóa auth data không (mặc định: true)
 * @returns {Promise} Promise từ Swal
 */
export const showSessionExpiredAlert = async (options = {}) => {
  const {
    title = "Phiên đăng nhập hết hạn",
    text = "Vui lòng đăng nhập lại để tiếp tục.",
    confirmButtonText = "Đăng nhập",
    clearAuth = true,
  } = options;

  // Clear auth data if needed
  if (clearAuth) {
    clearPersistedAuth();
  }

  // Dynamic import Swal to avoid circular dependencies
  const Swal = (await import("sweetalert2")).default;

  return Swal.fire({
    icon: "warning",
    title: title,
    text: text,
    confirmButtonText: confirmButtonText,
    confirmButtonColor: "#0ea5e9",
    allowOutsideClick: false,
    allowEscapeKey: false,
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = "/login";
    }
    return result;
  });
};

/**
 * Kiểm tra token và hiển thị thông báo nếu hết hạn
 * @returns {boolean} true nếu token hợp lệ, false nếu không
 */
export const checkTokenAndAlert = async () => {
  const token = getStoredToken();
  
  if (!token || isTokenExpired(token)) {
    await showSessionExpiredAlert();
    return false;
  }
  
  return true;
};
