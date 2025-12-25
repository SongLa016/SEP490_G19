// hàm xử lý 401 Unauthorized error
import {
  clearPersistedAuth,
  isTokenExpired,
  getStoredToken,
} from "./tokenManager";

let isShowingSessionExpiredAlert = false;

// hàm hiển thị thông báo phiên đăng nhập hết hạn và redirect về login
const showSessionExpiredAndRedirect = async () => {
  if (isShowingSessionExpiredAlert) return;
  isShowingSessionExpiredAlert = true;
  clearPersistedAuth();
  const Swal = (await import("sweetalert2")).default;

  await Swal.fire({
    icon: "warning",
    title: "Phiên đăng nhập hết hạn",
    text: "Vui lòng đăng nhập lại để tiếp tục.",
    confirmButtonText: "Đăng nhập",
    confirmButtonColor: "#0ea5e9",
    allowOutsideClick: false,
    allowEscapeKey: false,
  }).then((result) => {
    isShowingSessionExpiredAlert = false;
    if (result.isConfirmed) {
      window.location.href = "/login";
    }
  });
};

// hàm setup axios interceptor cho một axios instance
export const setupAuthInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getStoredToken();
      if (token && !isTokenExpired(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // hàm xử lý response
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        await showSessionExpiredAndRedirect();
      }
      return Promise.reject(error);
    }
  );
};

export { showSessionExpiredAndRedirect };
