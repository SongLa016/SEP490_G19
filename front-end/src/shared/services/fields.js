// Service layer for Field, FieldComplex, FieldPrice APIs
import axios from "axios";

// Determine base URL based on environment
// Always use full URL to avoid proxy issues
const getBaseURL = () => {
  return "https://sep490-g19-zxph.onrender.com/api";
};

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // Increased timeout for slower connections
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error) => {
  let errorMessage = "Có lỗi xảy ra khi gọi API";
  let details = "";

  if (error.response) {
    const { status, statusText, data } = error.response;
    if (status === 404) {
      errorMessage = "API endpoint không tồn tại.";
    } else if (status === 500) {
      errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
    } else if (data && data.message) {
      errorMessage = data.message;
    } else {
      errorMessage = `Lỗi ${status}: ${statusText}`;
    }
  } else if (error.request) {
    // Check if it's a CORS error
    if (
      error.code === "ERR_NETWORK" ||
      error.message?.includes("CORS") ||
      error.message?.includes("Network Error")
    ) {
      errorMessage =
        "Lỗi CORS: Backend chưa cấu hình cho phép truy cập từ domain này.";
      details =
        "Vui lòng kiểm tra cấu hình CORS trên backend hoặc liên hệ admin.";
    } else {
      errorMessage =
        "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
    }
  } else {
    errorMessage = error.message || "Đã xảy ra lỗi không xác định.";
  }

  console.error("API Error:", {
    message: error.message,
    code: error.code,
    response: error.response?.data,
    request: error.request,
    config: error.config?.url,
  });

  const fullError = new Error(errorMessage);
  if (details) {
    fullError.details = details;
  }
  throw fullError;
};

// ========== REAL API FUNCTIONS ==========

// FieldComplex API functions
export async function createFieldComplex(complexData) {
  try {
    // Try different endpoint variations
    const endpoints = [
      "/FieldComplex",
      "/fieldComplex",
      "/field-complex",
      "/FieldComplexes",
      "/fieldComplexes",
    ];
    let response = null;
    let lastError = null;

    const payload = {
      ownerId: complexData.ownerId,
      name: complexData.name,
      address: complexData.address,
      description: complexData.description || "",
      image: complexData.image || "",
      status: complexData.status || "Active",
      fields: complexData.fields || [],
    };

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying POST endpoint: ${getBaseURL()}${endpoint}`);
        response = await apiClient.post(endpoint, payload);
        console.log(`Success with POST endpoint: ${endpoint}`);
        break;
      } catch (err) {
        console.log(
          `Failed with POST endpoint: ${endpoint}`,
          err.response?.status
        );
        lastError = err;
        // If it's not a 404, stop trying other endpoints
        if (err.response?.status !== 404) {
          break;
        }
      }
    }

    if (!response) {
      throw lastError || new Error("Tất cả endpoint đều thất bại");
    }

    return response.data;
  } catch (error) {
    console.error("Error creating field complex:", error);
    handleApiError(error);
  }
}

export async function fetchFieldComplexes() {
  try {
    // Try different endpoint variations
    const endpoints = [
      "/FieldComplex",
      "/fieldComplex",
      "/field-complex",
      "/FieldComplexes",
      "/fieldComplexes",
    ];
    let response = null;
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying GET endpoint: ${getBaseURL()}${endpoint}`);
        response = await apiClient.get(endpoint);
        console.log(`Success with GET endpoint: ${endpoint}`);
        break;
      } catch (err) {
        console.log(
          `Failed with GET endpoint: ${endpoint}`,
          err.response?.status
        );
        lastError = err;
        // If it's not a 404, stop trying other endpoints
        if (err.response?.status !== 404) {
          break;
        }
      }
    }

    if (!response) {
      throw lastError || new Error("Tất cả endpoint đều thất bại");
    }

    // Handle response - can be array or object
    let data = response.data;
    if (!Array.isArray(data)) {
      if (data && Array.isArray(data.data)) {
        data = data.data;
      } else {
        data = [];
      }
    }

    return data.map((complex) => ({
      complexId: complex.complexId,
      ownerId: complex.ownerId,
      name: complex.name,
      address: complex.address,
      description: complex.description || "",
      image: complex.image || "",
      status: complex.status,
      createdAt: complex.createdAt,
      ownerName: complex.ownerName || "",
    }));
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchFieldComplex(id) {
  try {
    const response = await apiClient.get(`/FieldComplex/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateFieldComplex(id, complexData) {
  try {
    const response = await apiClient.put(`/FieldComplex/${id}`, complexData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteFieldComplex(id) {
  try {
    const response = await apiClient.delete(`/FieldComplex/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// Field API functions
export async function createField(fieldData) {
  try {
    const response = await apiClient.post("/Field", {
      complexId: fieldData.complexId,
      typeId: fieldData.typeId,
      name: fieldData.name,
      size: fieldData.size || "",
      grassType: fieldData.grassType || "",
      description: fieldData.description || "",
      image: fieldData.image || "",
      pricePerHour: fieldData.pricePerHour || 0,
      status: fieldData.status || "Available",
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchFieldsByComplex(complexId) {
  try {
    const response = await apiClient.get(`/Field/complex/${complexId}`);
    return response.data.map((field) => ({
      fieldId: field.fieldId,
      complexId: field.complexId,
      typeId: field.typeId,
      name: field.name,
      size: field.size || "",
      grassType: field.grassType || "",
      description: field.description || "",
      image: field.image || "",
      pricePerHour: field.pricePerHour,
      status: field.status,
      createdAt: field.createdAt,
      complexName: field.complexName || "",
      typeName: field.typeName || "",
    }));
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchField(fieldId) {
  try {
    const response = await apiClient.get(`/Field/${fieldId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateField(fieldId, fieldData) {
  try {
    const response = await apiClient.put(`/Field/${fieldId}`, fieldData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteField(fieldId) {
  try {
    const response = await apiClient.delete(`/Field/${fieldId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// FieldPrice API functions
export async function createFieldPrice(priceData) {
  try {
    const response = await apiClient.post("/FieldPrice", {
      fieldId: priceData.fieldId,
      slotId: priceData.slotId,
      price: priceData.price,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchFieldPrices() {
  try {
    const response = await apiClient.get("/FieldPrice");
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchFieldPrice(id) {
  try {
    const response = await apiClient.get(`/FieldPrice/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateFieldPrice(id, priceData) {
  try {
    const response = await apiClient.put(`/FieldPrice/${id}`, priceData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteFieldPrice(id) {
  try {
    const response = await apiClient.delete(`/FieldPrice/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// ========== MOCK DATA (for backward compatibility) ==========
// Mocked service layer aligned with your database schema
// Tables mirrored: FieldComplexes, Fields, FieldTypes, TimeSlots, FieldSchedules, FieldPrices

// --- MOCK TABLES ---
const FIELD_TYPES = [
  { TypeID: 1, TypeName: "5vs5" },
  { TypeID: 2, TypeName: "7vs7" },
  { TypeID: 3, TypeName: "11vs11" },
];

const TIME_SLOTS = [
  { SlotID: 11, SlotName: "Slot 11", StartTime: "07:15", EndTime: "08:45" },
  { SlotID: 10, SlotName: "Slot 10", StartTime: "08:45", EndTime: "10:15" },
  { SlotID: 9, SlotName: "Slot 9", StartTime: "10:15", EndTime: "11:45" },
  { SlotID: 8, SlotName: "Slot 8", StartTime: "11:45", EndTime: "13:15" },
  { SlotID: 7, SlotName: "Slot 7", StartTime: "13:15", EndTime: "14:45" },
  { SlotID: 6, SlotName: "Slot 6", StartTime: "14:45", EndTime: "16:15" },
  { SlotID: 5, SlotName: "Slot 5", StartTime: "16:15", EndTime: "17:45" },
  { SlotID: 4, SlotName: "Slot 4", StartTime: "17:45", EndTime: "19:15" },
  { SlotID: 3, SlotName: "Slot 3", StartTime: "19:15", EndTime: "20:45" },
  { SlotID: 2, SlotName: "Slot 2", StartTime: "20:45", EndTime: "22:15" },
  { SlotID: 1, SlotName: "Slot 1", StartTime: "22:15", EndTime: "23:45" },
];

const FIELD_COMPLEXES = [
  {
    ComplexID: 101,
    OwnerID: 1,
    Name: "Sân vận động Hoàn Kiếm",
    Address: "123 Phố Hàng Bạc, Quận Hoàn Kiếm, Hà Nội",
    Lat: 21.0285,
    Lng: 105.8542,
    Description:
      "Sân vận động lớn với sân 11vs11 chuyên nghiệp và nhiều sân 7vs7.",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    Status: "Active",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-01T00:00:00Z",
    Rating: 4.8,
  },
  {
    ComplexID: 102,
    OwnerID: 2,
    Name: "Khu sân ABC - Ba Đình",
    Address: "456 Đường Kim Mã, Quận Ba Đình, Hà Nội",
    Lat: 21.0333,
    Lng: 105.8167,
    Description: "Nhiều sân 5/7, giá hợp lý.",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    Status: "Active",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-02T00:00:00Z",
    Rating: 4.5,
  },
  {
    ComplexID: 103,
    OwnerID: 2,
    Name: "Khu sân JKL - Đống Đa",
    Address: "789 Đường Láng, Quận Đống Đa, Hà Nội",
    Lat: 21.0167,
    Lng: 105.8167,
    Description: "Nhiều sân 5/7, giá hợp lý.",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    Status: "Active",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-02T00:00:00Z",
    Rating: 4.5,
  },
  {
    ComplexID: 104,
    OwnerID: 2,
    Name: "Khu sân ABC - Cầu Giấy",
    Address: "321 Trần Duy Hưng, Quận Cầu Giấy, Hà Nội",
    Lat: 21.0167,
    Lng: 105.8,
    Description: "Nhiều sân 5/7, giá hợp lý.",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    Status: "Active",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-02T00:00:00Z",
    Rating: 4.5,
  },
  {
    ComplexID: 105,
    OwnerID: 2,
    Name: "Khu sân MNNX - Hai Bà Trưng",
    Address: "654 Bạch Mai, Quận Hai Bà Trưng, Hà Nội",
    Lat: 21.0167,
    Lng: 105.85,
    Description: "Nhiều sân 5/7, giá hợp lý.",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    Status: "Active",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-02T00:00:00Z",
    Rating: 4.5,
  },
];

// FIELDS distribution:
// - Complex 101: 2 sân 11vs11 + 2 sân 7vs7
// - Complexes 102, 103: split into 7-a-side (4 fields each)
// - Complexes 104, 105: split into 5-a-side (6 fields each)
const FIELDS = [
  // 101 -> 11vs11 x2 + 7vs7 x2
  {
    FieldID: 1,
    ComplexID: 101,
    TypeID: 3,
    Name: "Sân 11 người A",
    Size: "68x105m",
    GrassType: "Cỏ tự nhiên",
    Description: "Sân vận động chuyên nghiệp với cỏ tự nhiên",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 500000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-01T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 2,
    ComplexID: 101,
    TypeID: 3,
    Name: "Sân 11 người B",
    Size: "68x105m",
    GrassType: "Cỏ tự nhiên",
    Description: "Sân vận động với hệ thống chiếu sáng hiện đại",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 550000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-01T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 3,
    ComplexID: 101,
    TypeID: 2,
    Name: "Sân 7 người #1",
    Size: "30x50m",
    GrassType: "Nhân tạo",
    Description: "Sân 7 rộng rãi",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 230000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-01T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 4,
    ComplexID: 101,
    TypeID: 2,
    Name: "Sân 7 người #2",
    Size: "30x50m",
    GrassType: "Nhân tạo",
    Description: "Sân 7 thoáng mát",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 235000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-01T00:00:00Z",
    IsHidden: 0,
  },
  // 102 -> 7vs7 x4
  {
    FieldID: 5,
    ComplexID: 102,
    TypeID: 2,
    Name: "Sân 7 người A",
    Size: "30x50m",
    GrassType: "Nhân tạo",
    Description: "Sân A",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 220000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-02T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 6,
    ComplexID: 102,
    TypeID: 2,
    Name: "Sân 7 người B",
    Size: "30x50m",
    GrassType: "Nhân tạo",
    Description: "Sân B",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 225000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-02T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 7,
    ComplexID: 102,
    TypeID: 2,
    Name: "Sân 7 người C",
    Size: "30x50m",
    GrassType: "Nhân tạo",
    Description: "Sân C",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 230000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-02T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 8,
    ComplexID: 102,
    TypeID: 2,
    Name: "Sân 7 người D",
    Size: "30x50m",
    GrassType: "Nhân tạo",
    Description: "Sân D",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 235000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-02T00:00:00Z",
    IsHidden: 0,
  },
  // 103 -> 7vs7 x4
  {
    FieldID: 9,
    ComplexID: 103,
    TypeID: 2,
    Name: "Sân 7 người 1",
    Size: "30x50m",
    GrassType: "Nhân tạo",
    Description: "Sạch đẹp",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 225000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-03T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 10,
    ComplexID: 103,
    TypeID: 2,
    Name: "Sân 7 người 2",
    Size: "30x50m",
    GrassType: "Nhân tạo",
    Description: "Rộng rãi",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 230000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-03T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 11,
    ComplexID: 103,
    TypeID: 2,
    Name: "Sân 7 người 3",
    Size: "30x50m",
    GrassType: "Nhân tạo",
    Description: "Đèn sáng",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 235000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-03T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 12,
    ComplexID: 103,
    TypeID: 2,
    Name: "Sân 7 người 4",
    Size: "30x50m",
    GrassType: "Nhân tạo",
    Description: "Thoáng mát",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 240000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-03T00:00:00Z",
    IsHidden: 0,
  },
  // 104 -> 5vs5 x6
  {
    FieldID: 13,
    ComplexID: 104,
    TypeID: 1,
    Name: "Sân 5 người #1",
    Size: "20x40m",
    GrassType: "Nhân tạo",
    Description: "Cỏ êm",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 170000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-04T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 14,
    ComplexID: 104,
    TypeID: 1,
    Name: "Sân 5 người #2",
    Size: "20x40m",
    GrassType: "Nhân tạo",
    Description: "Bóng tốt",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 175000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-04T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 15,
    ComplexID: 104,
    TypeID: 1,
    Name: "Sân 5 người #3",
    Size: "20x40m",
    GrassType: "Nhân tạo",
    Description: "Đường biên rõ",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 175000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-04T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 16,
    ComplexID: 104,
    TypeID: 1,
    Name: "Sân 5 người #4",
    Size: "20x40m",
    GrassType: "Nhân tạo",
    Description: "Đèn tốt",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 180000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-04T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 17,
    ComplexID: 104,
    TypeID: 1,
    Name: "Sân 5 người #5",
    Size: "20x40m",
    GrassType: "Nhân tạo",
    Description: "An toàn",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 185000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-04T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 18,
    ComplexID: 104,
    TypeID: 1,
    Name: "Sân 5 người #6",
    Size: "20x40m",
    GrassType: "Nhân tạo",
    Description: "Sạch sẽ",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 185000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-04T00:00:00Z",
    IsHidden: 0,
  },
  // 105 -> 5vs5 x6
  {
    FieldID: 19,
    ComplexID: 105,
    TypeID: 1,
    Name: "Sân 5 người A",
    Size: "20x40m",
    GrassType: "Nhân tạo",
    Description: "Cỏ mới",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 165000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-05T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 20,
    ComplexID: 105,
    TypeID: 1,
    Name: "Sân 5 người B",
    Size: "20x40m",
    GrassType: "Nhân tạo",
    Description: "Thoáng",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 170000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-05T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 21,
    ComplexID: 105,
    TypeID: 1,
    Name: "Sân 5 người C",
    Size: "20x40m",
    GrassType: "Nhân tạo",
    Description: "Đường biên rõ",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 170000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-05T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 22,
    ComplexID: 105,
    TypeID: 1,
    Name: "Sân 5 người D",
    Size: "20x40m",
    GrassType: "Nhân tạo",
    Description: "Có mái che",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 175000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-05T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 23,
    ComplexID: 105,
    TypeID: 1,
    Name: "Sân 5 người E",
    Size: "20x40m",
    GrassType: "Nhân tạo",
    Description: "Ánh sáng tốt",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 180000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-05T00:00:00Z",
    IsHidden: 0,
  },
  {
    FieldID: 24,
    ComplexID: 105,
    TypeID: 1,
    Name: "Sân 5 người F",
    Size: "20x40m",
    GrassType: "Nhân tạo",
    Description: "Sạch sẽ",
    Image:
      "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
    PricePerHour: 185000,
    Status: "Available",
    ApprovalStatus: "Approved",
    ApprovedBy: 999,
    ApprovedAt: "2024-01-05T00:00:00Z",
    IsHidden: 0,
  },
];

// FieldPrices: { FieldID, SlotID, Price }
const FIELD_PRICES = [
  // Complex 101 - Sân 11vs11 (FieldID 1-2) + Sân 7vs7 (FieldID 3-4)
  { FieldID: 1, SlotID: 1, Price: 400000 }, // 06:00-07:30
  { FieldID: 1, SlotID: 2, Price: 400000 }, // 07:30-09:00
  { FieldID: 1, SlotID: 3, Price: 500000 }, // 09:00-10:30
  { FieldID: 1, SlotID: 4, Price: 500000 }, // 10:30-12:00
  { FieldID: 1, SlotID: 5, Price: 500000 }, // 12:00-13:30
  { FieldID: 1, SlotID: 6, Price: 500000 }, // 13:30-15:00
  { FieldID: 1, SlotID: 7, Price: 500000 }, // 15:00-16:30
  { FieldID: 1, SlotID: 8, Price: 500000 }, // 16:30-18:00
  { FieldID: 1, SlotID: 9, Price: 600000 }, // 18:00-19:30
  { FieldID: 1, SlotID: 10, Price: 600000 }, // 19:30-21:00
  { FieldID: 1, SlotID: 11, Price: 600000 }, // 21:00-22:30

  { FieldID: 2, SlotID: 1, Price: 450000 },
  { FieldID: 2, SlotID: 2, Price: 450000 },
  { FieldID: 2, SlotID: 3, Price: 550000 },
  { FieldID: 2, SlotID: 4, Price: 550000 },
  { FieldID: 2, SlotID: 5, Price: 550000 },
  { FieldID: 2, SlotID: 6, Price: 550000 },
  { FieldID: 2, SlotID: 7, Price: 550000 },
  { FieldID: 2, SlotID: 8, Price: 550000 },
  { FieldID: 2, SlotID: 9, Price: 650000 },
  { FieldID: 2, SlotID: 10, Price: 650000 },
  { FieldID: 2, SlotID: 11, Price: 650000 },

  { FieldID: 3, SlotID: 1, Price: 200000 },
  { FieldID: 3, SlotID: 2, Price: 200000 },
  { FieldID: 3, SlotID: 3, Price: 250000 },
  { FieldID: 3, SlotID: 4, Price: 250000 },
  { FieldID: 3, SlotID: 5, Price: 250000 },
  { FieldID: 3, SlotID: 6, Price: 250000 },
  { FieldID: 3, SlotID: 7, Price: 250000 },
  { FieldID: 3, SlotID: 8, Price: 250000 },
  { FieldID: 3, SlotID: 9, Price: 300000 },
  { FieldID: 3, SlotID: 10, Price: 300000 },
  { FieldID: 3, SlotID: 11, Price: 300000 },

  { FieldID: 4, SlotID: 1, Price: 200000 },
  { FieldID: 4, SlotID: 2, Price: 200000 },
  { FieldID: 4, SlotID: 3, Price: 250000 },
  { FieldID: 4, SlotID: 4, Price: 255000 },
  { FieldID: 4, SlotID: 5, Price: 250000 },
  { FieldID: 4, SlotID: 6, Price: 250000 },
  { FieldID: 4, SlotID: 7, Price: 250000 },
  { FieldID: 4, SlotID: 8, Price: 250000 },
  { FieldID: 4, SlotID: 9, Price: 300000 },
  { FieldID: 4, SlotID: 10, Price: 300000 },
  { FieldID: 4, SlotID: 11, Price: 300000 },

  // Complex 102 - Sân nhỏ (FieldID 5-8)
  { FieldID: 5, SlotID: 1, Price: 150000 },
  { FieldID: 5, SlotID: 2, Price: 150000 },
  { FieldID: 5, SlotID: 3, Price: 245000 },
  { FieldID: 5, SlotID: 4, Price: 200000 },
  { FieldID: 5, SlotID: 5, Price: 200000 },
  { FieldID: 5, SlotID: 6, Price: 200000 },
  { FieldID: 5, SlotID: 7, Price: 200000 },
  { FieldID: 5, SlotID: 8, Price: 200000 },
  { FieldID: 5, SlotID: 9, Price: 250000 },
  { FieldID: 5, SlotID: 10, Price: 250000 },
  { FieldID: 5, SlotID: 11, Price: 250000 },

  { FieldID: 6, SlotID: 1, Price: 150000 },
  { FieldID: 6, SlotID: 2, Price: 150000 },
  { FieldID: 6, SlotID: 3, Price: 200000 },
  { FieldID: 6, SlotID: 4, Price: 200000 },
  { FieldID: 6, SlotID: 5, Price: 200000 },
  { FieldID: 6, SlotID: 6, Price: 200000 },
  { FieldID: 6, SlotID: 7, Price: 200000 },
  { FieldID: 6, SlotID: 8, Price: 200000 },
  { FieldID: 6, SlotID: 9, Price: 250000 },
  { FieldID: 6, SlotID: 10, Price: 250000 },
  { FieldID: 6, SlotID: 11, Price: 250000 },

  { FieldID: 7, SlotID: 1, Price: 150000 },
  { FieldID: 7, SlotID: 2, Price: 150000 },
  { FieldID: 7, SlotID: 3, Price: 200000 },
  { FieldID: 7, SlotID: 4, Price: 200000 },
  { FieldID: 7, SlotID: 5, Price: 200000 },
  { FieldID: 7, SlotID: 6, Price: 200000 },
  { FieldID: 7, SlotID: 7, Price: 200000 },
  { FieldID: 7, SlotID: 8, Price: 200000 },
  { FieldID: 7, SlotID: 9, Price: 250000 },
  { FieldID: 7, SlotID: 10, Price: 250000 },
  { FieldID: 7, SlotID: 11, Price: 250000 },

  { FieldID: 8, SlotID: 1, Price: 150000 },
  { FieldID: 8, SlotID: 2, Price: 150000 },
  { FieldID: 8, SlotID: 3, Price: 200000 },
  { FieldID: 8, SlotID: 4, Price: 200000 },
  { FieldID: 8, SlotID: 5, Price: 200000 },
  { FieldID: 8, SlotID: 6, Price: 200000 },
  { FieldID: 8, SlotID: 7, Price: 200000 },
  { FieldID: 8, SlotID: 8, Price: 200000 },
  { FieldID: 8, SlotID: 9, Price: 250000 },
  { FieldID: 8, SlotID: 10, Price: 250000 },
  { FieldID: 8, SlotID: 11, Price: 250000 },

  // Complex 103 - Sân 7vs7 (FieldID 9-24)
  { FieldID: 9, SlotID: 1, Price: 180000 },
  { FieldID: 9, SlotID: 2, Price: 180000 },
  { FieldID: 9, SlotID: 3, Price: 240000 },
  { FieldID: 9, SlotID: 4, Price: 220000 },
  { FieldID: 9, SlotID: 5, Price: 220000 },
  { FieldID: 9, SlotID: 6, Price: 220000 },
  { FieldID: 9, SlotID: 7, Price: 220000 },
  { FieldID: 9, SlotID: 8, Price: 220000 },
  { FieldID: 9, SlotID: 9, Price: 280000 },
  { FieldID: 9, SlotID: 10, Price: 280000 },
  { FieldID: 9, SlotID: 11, Price: 280000 },

  { FieldID: 10, SlotID: 1, Price: 180000 },
  { FieldID: 10, SlotID: 2, Price: 180000 },
  { FieldID: 10, SlotID: 3, Price: 230000 },
  { FieldID: 10, SlotID: 4, Price: 220000 },
  { FieldID: 10, SlotID: 5, Price: 220000 },
  { FieldID: 10, SlotID: 6, Price: 220000 },
  { FieldID: 10, SlotID: 7, Price: 220000 },
  { FieldID: 10, SlotID: 8, Price: 220000 },
  { FieldID: 10, SlotID: 9, Price: 280000 },
  { FieldID: 10, SlotID: 10, Price: 280000 },
  { FieldID: 10, SlotID: 11, Price: 280000 },

  { FieldID: 11, SlotID: 1, Price: 180000 },
  { FieldID: 11, SlotID: 2, Price: 180000 },
  { FieldID: 11, SlotID: 3, Price: 220000 },
  { FieldID: 11, SlotID: 4, Price: 220000 },
  { FieldID: 11, SlotID: 5, Price: 220000 },
  { FieldID: 11, SlotID: 6, Price: 220000 },
  { FieldID: 11, SlotID: 7, Price: 220000 },
  { FieldID: 11, SlotID: 8, Price: 220000 },
  { FieldID: 11, SlotID: 9, Price: 280000 },
  { FieldID: 11, SlotID: 10, Price: 280000 },
  { FieldID: 11, SlotID: 11, Price: 280000 },

  { FieldID: 12, SlotID: 1, Price: 180000 },
  { FieldID: 12, SlotID: 2, Price: 180000 },
  { FieldID: 12, SlotID: 3, Price: 220000 },
  { FieldID: 12, SlotID: 4, Price: 220000 },
  { FieldID: 12, SlotID: 5, Price: 220000 },
  { FieldID: 12, SlotID: 6, Price: 220000 },
  { FieldID: 12, SlotID: 7, Price: 220000 },
  { FieldID: 12, SlotID: 8, Price: 220000 },
  { FieldID: 12, SlotID: 9, Price: 280000 },
  { FieldID: 12, SlotID: 10, Price: 280000 },
  { FieldID: 12, SlotID: 11, Price: 280000 },

  { FieldID: 13, SlotID: 1, Price: 180000 },
  { FieldID: 13, SlotID: 2, Price: 180000 },
  { FieldID: 13, SlotID: 3, Price: 195000 },
  { FieldID: 13, SlotID: 4, Price: 220000 },
  { FieldID: 13, SlotID: 5, Price: 220000 },
  { FieldID: 13, SlotID: 6, Price: 220000 },
  { FieldID: 13, SlotID: 7, Price: 220000 },
  { FieldID: 13, SlotID: 8, Price: 220000 },
  { FieldID: 13, SlotID: 9, Price: 280000 },
  { FieldID: 13, SlotID: 10, Price: 280000 },
  { FieldID: 13, SlotID: 11, Price: 280000 },

  { FieldID: 14, SlotID: 1, Price: 180000 },
  { FieldID: 14, SlotID: 2, Price: 180000 },
  { FieldID: 14, SlotID: 3, Price: 220000 },
  { FieldID: 14, SlotID: 4, Price: 220000 },
  { FieldID: 14, SlotID: 5, Price: 220000 },
  { FieldID: 14, SlotID: 6, Price: 220000 },
  { FieldID: 14, SlotID: 7, Price: 220000 },
  { FieldID: 14, SlotID: 8, Price: 220000 },
  { FieldID: 14, SlotID: 9, Price: 280000 },
  { FieldID: 14, SlotID: 10, Price: 280000 },
  { FieldID: 14, SlotID: 11, Price: 280000 },

  { FieldID: 15, SlotID: 1, Price: 180000 },
  { FieldID: 15, SlotID: 2, Price: 180000 },
  { FieldID: 15, SlotID: 3, Price: 220000 },
  { FieldID: 15, SlotID: 4, Price: 220000 },
  { FieldID: 15, SlotID: 5, Price: 220000 },
  { FieldID: 15, SlotID: 6, Price: 220000 },
  { FieldID: 15, SlotID: 7, Price: 220000 },
  { FieldID: 15, SlotID: 8, Price: 220000 },
  { FieldID: 15, SlotID: 9, Price: 280000 },
  { FieldID: 15, SlotID: 10, Price: 280000 },
  { FieldID: 15, SlotID: 11, Price: 280000 },

  { FieldID: 16, SlotID: 1, Price: 180000 },
  { FieldID: 16, SlotID: 2, Price: 180000 },
  { FieldID: 16, SlotID: 3, Price: 220000 },
  { FieldID: 16, SlotID: 4, Price: 220000 },
  { FieldID: 16, SlotID: 5, Price: 220000 },
  { FieldID: 16, SlotID: 6, Price: 220000 },
  { FieldID: 16, SlotID: 7, Price: 220000 },
  { FieldID: 16, SlotID: 8, Price: 220000 },
  { FieldID: 16, SlotID: 9, Price: 280000 },
  { FieldID: 16, SlotID: 10, Price: 280000 },
  { FieldID: 16, SlotID: 11, Price: 280000 },

  { FieldID: 17, SlotID: 1, Price: 180000 },
  { FieldID: 17, SlotID: 2, Price: 180000 },
  { FieldID: 17, SlotID: 3, Price: 220000 },
  { FieldID: 17, SlotID: 4, Price: 220000 },
  { FieldID: 17, SlotID: 5, Price: 220000 },
  { FieldID: 17, SlotID: 6, Price: 220000 },
  { FieldID: 17, SlotID: 7, Price: 220000 },
  { FieldID: 17, SlotID: 8, Price: 220000 },
  { FieldID: 17, SlotID: 9, Price: 280000 },
  { FieldID: 17, SlotID: 10, Price: 280000 },
  { FieldID: 17, SlotID: 11, Price: 280000 },

  { FieldID: 18, SlotID: 1, Price: 180000 },
  { FieldID: 18, SlotID: 2, Price: 180000 },
  { FieldID: 18, SlotID: 3, Price: 220000 },
  { FieldID: 18, SlotID: 4, Price: 220000 },
  { FieldID: 18, SlotID: 5, Price: 220000 },
  { FieldID: 18, SlotID: 6, Price: 220000 },
  { FieldID: 18, SlotID: 7, Price: 220000 },
  { FieldID: 18, SlotID: 8, Price: 220000 },
  { FieldID: 18, SlotID: 9, Price: 280000 },
  { FieldID: 18, SlotID: 10, Price: 280000 },
  { FieldID: 18, SlotID: 11, Price: 280000 },

  { FieldID: 19, SlotID: 1, Price: 180000 },
  { FieldID: 19, SlotID: 2, Price: 180000 },
  { FieldID: 19, SlotID: 3, Price: 190000 },
  { FieldID: 19, SlotID: 4, Price: 220000 },
  { FieldID: 19, SlotID: 5, Price: 220000 },
  { FieldID: 19, SlotID: 6, Price: 220000 },
  { FieldID: 19, SlotID: 7, Price: 220000 },
  { FieldID: 19, SlotID: 8, Price: 220000 },
  { FieldID: 19, SlotID: 9, Price: 280000 },
  { FieldID: 19, SlotID: 10, Price: 280000 },
  { FieldID: 19, SlotID: 11, Price: 280000 },

  { FieldID: 20, SlotID: 1, Price: 180000 },
  { FieldID: 20, SlotID: 2, Price: 180000 },
  { FieldID: 20, SlotID: 3, Price: 220000 },
  { FieldID: 20, SlotID: 4, Price: 220000 },
  { FieldID: 20, SlotID: 5, Price: 220000 },
  { FieldID: 20, SlotID: 6, Price: 220000 },
  { FieldID: 20, SlotID: 7, Price: 220000 },
  { FieldID: 20, SlotID: 8, Price: 220000 },
  { FieldID: 20, SlotID: 9, Price: 280000 },
  { FieldID: 20, SlotID: 10, Price: 280000 },
  { FieldID: 20, SlotID: 11, Price: 280000 },

  { FieldID: 21, SlotID: 1, Price: 180000 },
  { FieldID: 21, SlotID: 2, Price: 180000 },
  { FieldID: 21, SlotID: 3, Price: 220000 },
  { FieldID: 21, SlotID: 4, Price: 220000 },
  { FieldID: 21, SlotID: 5, Price: 220000 },
  { FieldID: 21, SlotID: 6, Price: 220000 },
  { FieldID: 21, SlotID: 7, Price: 220000 },
  { FieldID: 21, SlotID: 8, Price: 220000 },
  { FieldID: 21, SlotID: 9, Price: 280000 },
  { FieldID: 21, SlotID: 10, Price: 280000 },
  { FieldID: 21, SlotID: 11, Price: 280000 },

  { FieldID: 22, SlotID: 1, Price: 180000 },
  { FieldID: 22, SlotID: 2, Price: 180000 },
  { FieldID: 22, SlotID: 3, Price: 220000 },
  { FieldID: 22, SlotID: 4, Price: 220000 },
  { FieldID: 22, SlotID: 5, Price: 220000 },
  { FieldID: 22, SlotID: 6, Price: 220000 },
  { FieldID: 22, SlotID: 7, Price: 220000 },
  { FieldID: 22, SlotID: 8, Price: 220000 },
  { FieldID: 22, SlotID: 9, Price: 280000 },
  { FieldID: 22, SlotID: 10, Price: 280000 },
  { FieldID: 22, SlotID: 11, Price: 280000 },

  { FieldID: 23, SlotID: 1, Price: 180000 },
  { FieldID: 23, SlotID: 2, Price: 180000 },
  { FieldID: 23, SlotID: 3, Price: 220000 },
  { FieldID: 23, SlotID: 4, Price: 220000 },
  { FieldID: 23, SlotID: 5, Price: 220000 },
  { FieldID: 23, SlotID: 6, Price: 220000 },
  { FieldID: 23, SlotID: 7, Price: 220000 },
  { FieldID: 23, SlotID: 8, Price: 220000 },
  { FieldID: 23, SlotID: 9, Price: 280000 },
  { FieldID: 23, SlotID: 10, Price: 280000 },
  { FieldID: 23, SlotID: 11, Price: 280000 },

  { FieldID: 24, SlotID: 1, Price: 180000 },
  { FieldID: 24, SlotID: 2, Price: 180000 },
  { FieldID: 24, SlotID: 3, Price: 220000 },
  { FieldID: 24, SlotID: 4, Price: 220000 },
  { FieldID: 24, SlotID: 5, Price: 220000 },
  { FieldID: 24, SlotID: 6, Price: 220000 },
  { FieldID: 24, SlotID: 7, Price: 220000 },
  { FieldID: 24, SlotID: 8, Price: 220000 },
  { FieldID: 24, SlotID: 9, Price: 280000 },
  { FieldID: 24, SlotID: 10, Price: 280000 },
  { FieldID: 24, SlotID: 11, Price: 280000 },
];

// FieldSchedules: { FieldID, Date, SlotID, Status }
const todayStr = new Date().toISOString().split("T")[0];
const FIELD_SCHEDULES = [
  // mark some busy slots across complexes - mostly available for better demo
  { FieldID: 1, Date: todayStr, SlotID: 3, Status: "Booked" },
  { FieldID: 2, Date: todayStr, SlotID: 3, Status: "Available" },
  { FieldID: 3, Date: todayStr, SlotID: 4, Status: "Available" },
  { FieldID: 4, Date: todayStr, SlotID: 5, Status: "Available" },
  { FieldID: 5, Date: todayStr, SlotID: 3, Status: "Available" },
  { FieldID: 6, Date: todayStr, SlotID: 3, Status: "Available" },
  { FieldID: 7, Date: todayStr, SlotID: 3, Status: "Available" },
  { FieldID: 8, Date: todayStr, SlotID: 4, Status: "Available" },
  { FieldID: 9, Date: todayStr, SlotID: 3, Status: "Available" },
  { FieldID: 10, Date: todayStr, SlotID: 3, Status: "Available" },
  { FieldID: 11, Date: todayStr, SlotID: 5, Status: "Available" },
  { FieldID: 12, Date: todayStr, SlotID: 3, Status: "Available" },
  { FieldID: 13, Date: todayStr, SlotID: 3, Status: "Available" },
  { FieldID: 14, Date: todayStr, SlotID: 3, Status: "Available" },
  { FieldID: 15, Date: todayStr, SlotID: 4, Status: "Available" },
  { FieldID: 16, Date: todayStr, SlotID: 5, Status: "Available" },
  { FieldID: 17, Date: todayStr, SlotID: 3, Status: "Available" },
  { FieldID: 18, Date: todayStr, SlotID: 3, Status: "Available" },
  { FieldID: 19, Date: todayStr, SlotID: 3, Status: "Available" },
  { FieldID: 20, Date: todayStr, SlotID: 3, Status: "Available" },
  { FieldID: 21, Date: todayStr, SlotID: 3, Status: "Available" },
  { FieldID: 22, Date: todayStr, SlotID: 4, Status: "Available" },
  { FieldID: 23, Date: todayStr, SlotID: 3, Status: "Available" },
  { FieldID: 24, Date: todayStr, SlotID: 5, Status: "Available" },
  // Add some variety with different slots
  { FieldID: 1, Date: todayStr, SlotID: 4, Status: "Booked" },
  { FieldID: 3, Date: todayStr, SlotID: 5, Status: "Booked" },
  { FieldID: 8, Date: todayStr, SlotID: 3, Status: "Booked" },
  { FieldID: 14, Date: todayStr, SlotID: 4, Status: "Booked" },
  { FieldID: 19, Date: todayStr, SlotID: 5, Status: "Booked" },
  { FieldID: 22, Date: todayStr, SlotID: 3, Status: "Booked" },

  // Add some maintenance slots
  { FieldID: 4, Date: todayStr, SlotID: 3, Status: "Maintenance" },
  { FieldID: 11, Date: todayStr, SlotID: 3, Status: "Maintenance" },
  { FieldID: 16, Date: todayStr, SlotID: 3, Status: "Maintenance" },
  { FieldID: 24, Date: todayStr, SlotID: 3, Status: "Maintenance" },
];

// --- HELPERS ---
function getTypeName(typeId) {
  const t = FIELD_TYPES.find((x) => x.TypeID === typeId);
  return t ? t.TypeName : "";
}

function findComplex(complexId) {
  return FIELD_COMPLEXES.find((c) => c.ComplexID === complexId);
}

function priceFor(fieldId, slotId) {
  if (!slotId) {
    const f = FIELDS.find((x) => x.FieldID === fieldId);
    return f ? f.PricePerHour : 0;
  }
  const p = FIELD_PRICES.find(
    (fp) => fp.FieldID === fieldId && fp.SlotID === Number(slotId)
  );
  if (p) return p.Price;
  const f = FIELDS.find((x) => x.FieldID === fieldId);
  return f ? f.PricePerHour : 0;
}

function scheduleStatus(fieldId, date, slotId) {
  if (!slotId) return "Available";
  const s = FIELD_SCHEDULES.find(
    (fs) =>
      fs.FieldID === fieldId && fs.Date === date && fs.SlotID === Number(slotId)
  );
  return s ? s.Status : "Available";
}

export async function fetchFieldTimeSlots() {
  return TIME_SLOTS.map((s) => ({
    slotId: s.SlotID,
    name: `${s.StartTime} – ${s.EndTime}`,
    start: s.StartTime,
    end: s.EndTime,
  }));
}

export async function fetchComplexes(params = {}) {
  const {
    query = "",
    date = new Date().toISOString().split("T")[0],
    slotId = "",
    useApi = false,
  } = params;

  // Use real API if requested
  if (useApi) {
    try {
      const complexes = await fetchFieldComplexes();
      // Fetch fields for each complex to get counts
      const complexesWithFields = await Promise.all(
        complexes.map(async (complex) => {
          try {
            const fields = await fetchFieldsByComplex(complex.complexId);
            return {
              complexId: complex.complexId,
              name: complex.name,
              address: complex.address,
              image: complex.image,
              totalFields: fields.length,
              availableFields: fields.filter((f) => f.status === "Available")
                .length,
              minPriceForSelectedSlot:
                fields.length > 0
                  ? Math.min(
                      ...fields
                        .map((f) => f.pricePerHour || 0)
                        .filter((p) => p > 0)
                    )
                  : 0,
              rating: 0, // API might not return rating
            };
          } catch (error) {
            console.error(
              `Error fetching fields for complex ${complex.complexId}:`,
              error
            );
            return {
              complexId: complex.complexId,
              name: complex.name,
              address: complex.address,
              image: complex.image,
              totalFields: 0,
              availableFields: 0,
              minPriceForSelectedSlot: 0,
              rating: 0,
            };
          }
        })
      );

      return complexesWithFields.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.address.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error(
        "Error fetching complexes from API, falling back to mock:",
        error
      );
      // Fall through to mock data
    }
  }

  // Mock data fallback
  const complexes = FIELD_COMPLEXES.filter(
    (c) => c.ApprovalStatus === "Approved"
  );
  return complexes
    .map((c) => {
      const childFields = FIELDS.filter(
        (f) =>
          f.ComplexID === c.ComplexID &&
          f.ApprovalStatus === "Approved" &&
          !f.IsHidden
      );
      const availableCount = slotId
        ? childFields.filter(
            (f) => scheduleStatus(f.FieldID, date, slotId) === "Available"
          ).length
        : childFields.length;
      const prices = childFields
        .map((f) => priceFor(f.FieldID, slotId || 0))
        .filter((p) => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      return {
        complexId: c.ComplexID,
        name: c.Name,
        address: c.Address,
        lat: c.Lat,
        lng: c.Lng,
        image: c.Image,
        totalFields: childFields.length,
        availableFields: availableCount,
        minPriceForSelectedSlot: minPrice,
        rating: c.Rating,
      };
    })
    .filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.address.toLowerCase().includes(query.toLowerCase())
    );
}

export async function fetchFields(params = {}) {
  const {
    complexId,
    query = "",
    date = new Date().toISOString().split("T")[0],
    slotId = "",
    typeId,
    useApi = false,
  } = params;

  // Use real API if requested
  if (useApi && complexId) {
    try {
      const fields = await fetchFieldsByComplex(complexId);
      return fields
        .filter((f) => !typeId || f.typeId === Number(typeId))
        .map((f) => ({
          fieldId: f.fieldId,
          complexId: f.complexId,
          complexName: f.complexName || "",
          name: f.name,
          typeName: f.typeName || "",
          size: f.size || "",
          grassType: f.grassType || "",
          description: f.description || "",
          address: "", // Will need to fetch from complex
          image: f.image,
          priceForSelectedSlot: f.pricePerHour,
          rating: 0,
          reviewCount: 0,
          distanceKm: 0,
          isAvailableForSelectedSlot: f.status === "Available",
        }))
        .filter(
          (item) =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.address.toLowerCase().includes(query.toLowerCase())
        );
    } catch (error) {
      console.error(
        "Error fetching fields from API, falling back to mock:",
        error
      );
      // Fall through to mock data
    }
  }

  // Mock data fallback
  let list = FIELDS.filter(
    (f) => f.ApprovalStatus === "Approved" && !f.IsHidden
  );
  if (complexId) list = list.filter((f) => f.ComplexID === Number(complexId));
  if (typeId) list = list.filter((f) => f.TypeID === Number(typeId));
  return list
    .map((f) => {
      const complex = findComplex(f.ComplexID);
      const price = slotId ? priceFor(f.FieldID, slotId) : f.PricePerHour;
      const status = slotId
        ? scheduleStatus(f.FieldID, date, slotId)
        : "Available";
      return {
        fieldId: f.FieldID,
        complexId: f.ComplexID,
        complexName: complex?.Name || "",
        name: f.Name,
        typeName: getTypeName(f.TypeID),
        size: f.Size || "",
        grassType: f.GrassType || "",
        description: f.Description || "",
        address: complex?.Address || "",
        image: f.Image,
        priceForSelectedSlot: price,
        rating: complex?.Rating || 0,
        reviewCount: 0,
        distanceKm: 0,
        isAvailableForSelectedSlot: status === "Available",
      };
    })
    .filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.address.toLowerCase().includes(query.toLowerCase())
    );
}

export async function fetchFieldAvailability(fieldId, date) {
  const slots = TIME_SLOTS;
  return slots.map((s) => ({
    slotId: s.SlotID,
    name: `${s.StartTime} – ${s.EndTime}`,
    price: priceFor(Number(fieldId), s.SlotID),
    status: scheduleStatus(Number(fieldId), date, s.SlotID),
  }));
}

export async function fetchComplexDetail(complexId, { date, slotId } = {}) {
  const complex = FIELD_COMPLEXES.find(
    (c) => c.ComplexID === Number(complexId)
  );
  return {
    complex: complex
      ? {
          complexId: complex.ComplexID,
          name: complex.Name,
          address: complex.Address,
          description: complex.Description,
          image: complex.Image,
          rating: complex.Rating,
        }
      : null,
    fields: await fetchFields({ complexId, date, slotId }),
  };
}

export async function fetchFieldMeta(fieldId) {
  const f = FIELDS.find((x) => x.FieldID === Number(fieldId));
  const c = f
    ? FIELD_COMPLEXES.find((cc) => cc.ComplexID === f.ComplexID)
    : null;
  return {
    field: f
      ? {
          fieldId: f.FieldID,
          name: f.Name,
          typeName: getTypeName(f.TypeID),
        }
      : null,
    complex: c
      ? {
          complexId: c.ComplexID,
          name: c.Name,
          address: c.Address,
        }
      : null,
  };
}

// Fetch detailed field info by FieldID for FieldDetail page
export async function fetchFieldDetail(fieldId) {
  const f = FIELDS.find((x) => x.FieldID === Number(fieldId));
  if (!f) return null;
  const complex = FIELD_COMPLEXES.find((cc) => cc.ComplexID === f.ComplexID);
  return {
    fieldId: f.FieldID,
    complexId: f.ComplexID,
    complexName: complex?.Name || "",
    address: complex?.Address || "",
    name: f.Name,
    typeId: f.TypeID,
    typeName: getTypeName(f.TypeID),
    size: f.Size || "",
    grassType: f.GrassType || "",
    description: f.Description || "",
    image: f.Image,
    images: [f.Image],
    pricePerHour: f.PricePerHour,
    rating: complex?.Rating || 0,
  };
}

// Mock function to preview recurring schedule and check conflicts
export async function previewRecurringSchedule(
  fieldId,
  startDate,
  slotId,
  weeks
) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const schedule = [];
  const conflicts = [];

  for (let week = 0; week < weeks; week++) {
    const bookingDate = new Date(startDate);
    bookingDate.setDate(bookingDate.getDate() + week * 7);
    const dateStr = bookingDate.toISOString().split("T")[0];

    const status = scheduleStatus(fieldId, dateStr, slotId);
    const price = priceFor(fieldId, slotId);

    schedule.push({
      weekNumber: week + 1,
      date: dateStr,
      slotId: slotId,
      status: status,
      price: price,
      isAvailable: status === "Available",
    });

    // Check for conflicts
    if (status === "Booked") {
      conflicts.push({
        weekNumber: week + 1,
        date: dateStr,
        reason: "Sân đã được đặt",
        alternativeSlots: await getAlternativeSlots(fieldId, dateStr),
      });
    } else if (status === "Maintenance") {
      conflicts.push({
        weekNumber: week + 1,
        date: dateStr,
        reason: "Sân đang bảo trì",
        alternativeSlots: await getAlternativeSlots(fieldId, dateStr),
      });
    }
  }

  return {
    fieldId,
    startDate,
    slotId,
    weeks,
    schedule,
    conflicts,
    hasConflicts: conflicts.length > 0,
    totalPrice: schedule.reduce((sum, item) => sum + item.price, 0),
    availableWeeks: schedule.filter((item) => item.isAvailable).length,
  };
}

// Helper function to get alternative slots for a specific date
async function getAlternativeSlots(fieldId, date) {
  const slots = TIME_SLOTS;
  return slots
    .map((slot) => ({
      slotId: slot.SlotID,
      name: `${slot.StartTime} – ${slot.EndTime}`,
      price: priceFor(fieldId, slot.SlotID),
      status: scheduleStatus(fieldId, date, slot.SlotID),
      isAvailable: scheduleStatus(fieldId, date, slot.SlotID) === "Available",
    }))
    .filter((slot) => slot.isAvailable)
    .slice(0, 3); // Return max 3 alternatives
}

// Mock function to check field availability for multiple dates (for recurring booking)
export async function checkRecurringAvailability(
  fieldId,
  startDate,
  slotId,
  weeks
) {
  const availability = [];

  for (let week = 0; week < weeks; week++) {
    const bookingDate = new Date(startDate);
    bookingDate.setDate(bookingDate.getDate() + week * 7);
    const dateStr = bookingDate.toISOString().split("T")[0];

    const status = scheduleStatus(fieldId, dateStr, slotId);
    const price = priceFor(fieldId, slotId);

    availability.push({
      weekNumber: week + 1,
      date: dateStr,
      slotId: slotId,
      status: status,
      price: price,
      isAvailable: status === "Available",
    });
  }

  return {
    fieldId,
    startDate,
    slotId,
    weeks,
    availability,
    allAvailable: availability.every((item) => item.isAvailable),
    availableCount: availability.filter((item) => item.isAvailable).length,
    conflicts: availability.filter((item) => !item.isAvailable),
  };
}
