import axios from "axios";

const API_BASE = "http://localhost:8080/api/match-requests/";

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
  // xử lý các shape khác nhau
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.items)) return responseData.items;
  if (Array.isArray(responseData?.data?.items)) return responseData.data.items;
  if (Array.isArray(responseData?.data?.data)) return responseData.data.data;
  if (Array.isArray(responseData?.data?.results))
    return responseData.data.results;
  if (Array.isArray(responseData?.results)) return responseData.results;
  if (Array.isArray(responseData?.data?.list)) return responseData.data.list;
  return [];
};

// hàm lấy tất cả các yêu cầu đối đầu
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

// hàm lấy yêu cầu đối đầu theo id
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

// hàm lấy yêu cầu đối đầu theo id đặt sân
export async function fetchMatchRequestByBookingId(bookingId) {
  if (!bookingId) {
    return { success: false, error: "Thiếu bookingId" };
  }
  try {
    const response = await apiClient.get(`booking/${bookingId}`);
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

// hàm kiểm tra đặt sân có yêu cầu đối đầu không
export async function checkBookingHasMatchRequest(bookingId) {
  if (!bookingId) {
    return { success: false, error: "Thiếu bookingId", hasRequest: false };
  }
  try {
    const response = await apiClient.get(`booking/${bookingId}/has-request`);
    return {
      success: true,
      hasRequest:
        response.data?.data?.hasRequest || response.data?.hasRequest || false,
      data: response.data,
    };
  } catch (error) {
    // nếu 404, đặt sân không có yêu cầu đối đầu
    if (error.response?.status === 404) {
      return {
        success: true,
        hasRequest: false,
      };
    }
    return {
      success: false,
      error: handleApiError(error),
      hasRequest: false,
    };
  }
}

// hàm tạo yêu cầu đối đầu
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

// hàm tham gia yêu cầu đối đầu
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

// hàm chấp nhận tham gia yêu cầu đối đầu
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

// hàm từ chối hoặc rút tham gia yêu cầu đối đầu
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

// hàm xóa yêu cầu đối đầu
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

// hàm lấy lịch sử yêu cầu đối đầu của tôi
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

// hàm kiểm tra yêu cầu đối đầu theo id đặt sân
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

// hàm hết hạn yêu cầu đối đầu
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
