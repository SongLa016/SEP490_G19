const TOKEN_KEY = "token";
const USER_KEY = "user";
// hàm an toàn decode token
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
      return Buffer.from(padded, "base64").toString("binary");
    }

    return null;
  } catch (error) {
    console.warn("Failed to decode token payload:", error);
    return null;
  }
};

// hàm decode payload token
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

// hàm lấy token đã lưu
export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

// hàm lưu token
export const storeToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch {
    /* istanbul ignore next */
  }
};

// hàm xóa token
export const removeStoredToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* istanbul ignore next */
  }
};

// hàm kiểm tra token hết hạn
export const isTokenExpired = (token) => {
  if (!token) return true;

  const payload = decodeTokenPayload(token);
  if (!payload?.exp) {
    return false;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
};

// hàm xóa auth đã lưu
export const clearPersistedAuth = () => {
  removeStoredToken();
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    /* istanbul ignore next */
  }
};

// hàm lấy token hợp lệ
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
 * hiển thị thông báo phiên đăng nhập hết hạn và redirect về trang login
 */
export const showSessionExpiredAlert = async (options = {}) => {
  const {
    title = "Phiên đăng nhập hết hạn",
    text = "Vui lòng đăng nhập lại để tiếp tục.",
    confirmButtonText = "Đăng nhập",
    clearAuth = true,
  } = options;

  // xóa auth data nếu cần
  if (clearAuth) {
    clearPersistedAuth();
  }

  // dynamic import Swal để tránh vòng lặp
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
 * kiểm tra token và hiển thị thông báo nếu hết hạn
 */
export const checkTokenAndAlert = async () => {
  const token = getStoredToken();

  if (!token || isTokenExpired(token)) {
    await showSessionExpiredAlert();
    return false;
  }

  return true;
};
