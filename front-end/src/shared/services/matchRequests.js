import axios from "axios";

const API_BASE = "https://sep490-g19-zxph.onrender.com/api/match-requests/";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const handleApiError = (error) => {
  let errorMessage = "Có lỗi xảy ra khi gọi API";

  if (error.response) {
    const { status, data, statusText } = error.response;
    if (status === 404) {
      errorMessage = "Không tìm thấy dữ liệu hoặc endpoint.";
    } else if (status === 400) {
      errorMessage = data?.message || "Dữ liệu không hợp lệ.";
    } else if (status === 401) {
      errorMessage = "Bạn cần đăng nhập để thực hiện hành động này.";
    } else if (status === 403) {
      errorMessage = "Bạn không có quyền thực hiện hành động này.";
    } else if (status === 500) {
      errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
    } else {
      errorMessage = data?.message || data?.error || statusText || errorMessage;
    }
  } else if (error.request) {
    errorMessage = "Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng.";
  } else if (error.message) {
    errorMessage = error.message;
  }

  console.error("MatchRequest API Error:", {
    url: error.config?.url,
    method: error.config?.method,
    data: error.config?.data,
    response: error.response?.data,
    message: errorMessage,
  });

  return errorMessage;
};

const extractDataList = (responseData) => {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.items)) return responseData.items;
  return [];
};

export async function fetchMatchRequests(params = {}) {
  try {
    const { page = 1, size = 20 } = params;
    const response = await apiClient.get("", {
      params: { page, size },
    });
    return {
      success: true,
      data: extractDataList(response.data),
      raw: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

export async function fetchMatchRequestById(requestId) {
  if (!requestId) {
    return { success: false, error: "Thiếu requestId" };
  }
  try {
    const response = await apiClient.get(`${requestId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

export async function createMatchRequestAPI(payload) {
  try {
    const response = await apiClient.post("", payload);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

export async function joinMatchRequestAPI(requestId, payload) {
  if (!requestId) {
    return { success: false, error: "Thiếu requestId" };
  }
  try {
    const response = await apiClient.post(`${requestId}/join`, payload);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

export async function acceptMatchParticipant(requestId, participantId) {
  if (!requestId || !participantId) {
    return { success: false, error: "Thiếu requestId hoặc participantId" };
  }
  try {
    const response = await apiClient.post(
      `${requestId}/accept/${participantId}`
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

export async function rejectOrWithdrawParticipant(requestId, participantId) {
  if (!requestId || !participantId) {
    return { success: false, error: "Thiếu requestId hoặc participantId" };
  }
  try {
    const response = await apiClient.post(
      `${requestId}/reject-or-withdraw/${participantId}`
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

export async function deleteMatchRequest(requestId) {
  if (!requestId) {
    return { success: false, error: "Thiếu requestId" };
  }
  try {
    const response = await apiClient.delete(`${requestId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

export async function fetchMyMatchHistory(params = {}) {
  try {
    const { page = 1, size = 20 } = params;
    const response = await apiClient.get("my-history", {
      params: { page, size },
    });
    return {
      success: true,
      data: extractDataList(response.data),
      raw: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

export async function checkMatchRequestByBooking(bookingId) {
  if (!bookingId) {
    return { success: false, error: "Thiếu bookingId" };
  }
  try {
    const response = await apiClient.get(`booking/${bookingId}/has-request`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

export async function expireOldMatchRequests() {
  try {
    const response = await apiClient.post("expire-old");
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}
