
import axios from "axios";

// validation tên sân
export const validateFieldName = (name, label = "Tên") => {
  const trimmedName = name?.trim() || "";
  if (!trimmedName) {
    return { isValid: false, message: `Vui lòng nhập ${label.toLowerCase()}` };
  }
  if (trimmedName.length < 2) {
    return { isValid: false, message: `${label} phải có ít nhất 2 ký tự` };
  }
  if (trimmedName.length > 100) {
    return { isValid: false, message: `${label} không được quá 100 ký tự` };
  }
  return { isValid: true, message: "" };
};

// Validate giá sân
export const validateFieldPrice = (price) => {
  const numPrice = Number(price);
  // Kiểm tra giá trị hợp lệ
  if (isNaN(numPrice) || price === "" || price === null || price === undefined) {
    return { isValid: false, message: "Vui lòng nhập giá sân" };
  }
  // Kiểm tra giá dương
  if (numPrice <= 0) {
    return { isValid: false, message: "Giá sân phải lớn hơn 0" };
  }
  // Kiểm tra giá tối thiểu
  if (numPrice < 10000) {
    return { isValid: false, message: "Giá sân tối thiểu 10,000 VND" };
  }
  // Kiểm tra giá tối đa
  if (numPrice > 10000000) {
    return { isValid: false, message: "Giá sân tối đa 10,000,000 VND" };
  }
  return { isValid: true, message: "" };
};

// Validate kích thước sân
export const validateFieldSize = (size) => {
  if (!size || size.trim() === "") {
    return { isValid: true, message: "" };
  }
  // Regex kiểm tra format: số x số (có thể có đơn vị m)
  const sizeRegex = /^\d+(\.\d+)?\s*[xX×]\s*\d+(\.\d+)?\s*m?$/;
  if (!sizeRegex.test(size.trim())) {
    return { isValid: false, message: "Kích thước không hợp lệ (VD: 20x40m)" };
  }
  return { isValid: true, message: "" };
};

// Validate địa chỉ khu sân

export const validateAddress = (address) => {
  const trimmedAddress = address?.trim() || "";
  if (!trimmedAddress) {
    return { isValid: false, message: "Vui lòng nhập địa chỉ" };
  }
  if (trimmedAddress.length < 10) {
    return { isValid: false, message: "Địa chỉ phải có ít nhất 10 ký tự" };
  }
  if (trimmedAddress.length > 200) {
    return { isValid: false, message: "Địa chỉ không được quá 200 ký tự" };
  }
  return { isValid: true, message: "" };
};

// Validate toàn bộ dữ liệu khu sân (Complex)
export const validateComplexData = (data, isEdit = false) => {
  const errors = {};

  // Validate tên khu sân
  const nameValidation = validateFieldName(data.name, "Tên khu sân");
  if (!nameValidation.isValid) {
    errors.name = nameValidation.message;
  }

  // Validate địa chỉ
  const addressValidation = validateAddress(data.address);
  if (!addressValidation.isValid) {
    errors.address = addressValidation.message;
  }

  // Validate hình ảnh (chỉ bắt buộc khi tạo mới)
  if (!isEdit && !data.imageFile && !data.imageUrl && !data.image) {
    errors.image = "Vui lòng chọn hình ảnh cho khu sân";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate toàn bộ dữ liệu sân (Field)
 * @param {Object} data - Dữ liệu sân
 * @param {boolean} isEdit - Đang chỉnh sửa hay tạo mới
 * @returns {{ isValid: boolean, errors: Object }}
 */
export const validateFieldData = (data, isEdit = false) => {
  const errors = {};

  // Validate khu sân
  if (!data.complexId) {
    errors.complexId = "Vui lòng chọn khu sân";
  }

  // Validate tên sân
  const nameValidation = validateFieldName(data.name, "Tên sân");
  if (!nameValidation.isValid) {
    errors.name = nameValidation.message;
  }

  // Validate loại sân
  if (!data.typeId) {
    errors.typeId = "Vui lòng chọn loại sân";
  }

  // Validate giá
  const priceValidation = validateFieldPrice(data.pricePerHour);
  if (!priceValidation.isValid) {
    errors.pricePerHour = priceValidation.message;
  }

  // Validate kích thước (optional)
  const sizeValidation = validateFieldSize(data.size);
  if (!sizeValidation.isValid) {
    errors.size = sizeValidation.message;
  }

  // Validate ảnh chính (bắt buộc khi tạo mới)
  if (!isEdit && !data.mainImage) {
    errors.mainImage = "Vui lòng chọn ảnh chính cho sân";
  }

  // Validate tài khoản ngân hàng
  if (!data.bankAccountId) {
    errors.bankAccountId = "Vui lòng chọn tài khoản ngân hàng";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const DEFAULT_API_BASE_URL = "http://localhost:8080";
// Always use full URL to avoid proxy issues
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased timeout to 60 seconds for slower connections
  headers: {
    "Content-Type": "application/json",
  },
});

const buildMultipartHeaders = () => {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

// Add request interceptor to include auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag to prevent multiple session expired alerts
let isShowingSessionExpired = false;

// Add response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isShowingSessionExpired) {
      isShowingSessionExpired = true;
      // Clear auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Show alert and redirect
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
        isShowingSessionExpired = false;
        if (result.isConfirmed) {
          window.location.href = "/login";
        }
      });
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error) => {
  // Preserve the original error with all its properties
  // This allows components to access error.response for detailed error handling
  if (error.response) {
    // Keep the original error so components can access error.response
    throw error;
  }

  // For non-response errors, create a new error with message
  let errorMessage = "Có lỗi xảy ra khi gọi API";
  let details = "";

  if (error.request) {
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
    } else if (
      error.code === "ECONNABORTED" ||
      error.message?.includes("timeout")
    ) {
      errorMessage = "Kết nối timeout. Vui lòng thử lại sau.";
      details = "Server có thể đang quá tải hoặc kết nối mạng chậm.";
    } else {
      errorMessage =
        "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
    }
  } else {
    errorMessage = error.message || "Đã xảy ra lỗi không xác định.";
  }

  const fullError = new Error(errorMessage);
  fullError.originalError = error;
  if (details) {
    fullError.details = details;
  }
  throw fullError;
};

// ========== REAL API FUNCTIONS ==========

// FieldComplex API functions
export async function createFieldComplex(complexData) {
  try {
    // Validate token before making request
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
    }

    // Try different endpoint variations
    const endpoints = ["/api/FieldComplex"];
    let response = null;
    let lastError = null;

    // If complexData is FormData, send as multipart/form-data
    if (complexData instanceof FormData) {
      for (const endpoint of endpoints) {
        try {
          response = await apiClient.post(endpoint, complexData);
          break;
        } catch (err) {
          lastError = err;
          // If it's not a 404, stop trying other endpoints
          if (err.response?.status !== 404) {
            break;
          }
        }
      }
    } else {
      // Prepare payload according to new backend structure
      // Backend will handle File upload to Cloudinary
      const payload = {
        complexId: complexData.complexId || 0,
        ownerId: complexData.ownerId,
        name: complexData.name,
        address: complexData.address,
        description: complexData.description || "",
        // Only include imageUrl if it's a URL string (existing image)
        // File objects should be sent via FormData
        imageUrl: complexData.imageUrl || "",
        // Default to Pending - Admin will approve to Active
        status: complexData.status || "Pending",
      };

      for (const endpoint of endpoints) {
        try {
          response = await apiClient.post(endpoint, payload);
          break;
        } catch (err) {
          lastError = err;
          // If it's not a 404, stop trying other endpoints
          if (err.response?.status !== 404) {
            break;
          }
        }
      }
    }

    if (!response) {
      throw lastError || new Error("Tất cả endpoint đều thất bại");
    }

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchFieldComplexes() {
  try {
    const endpoint = "/api/FieldComplex";
    const response = await apiClient.get(endpoint);

    let data = response.data;

    // If response.data is null or undefined
    if (!data) {
      return [];
    }

    // If it's already an array, use it
    if (Array.isArray(data)) {
    }
    // If it's an object, check for common property names
    else if (data && typeof data === "object") {
      // Check for 'value' property (common in OData/ASP.NET Core APIs)
      if (Array.isArray(data.value)) {
        data = data.value;
      }
      // Check for 'data' property
      else if (Array.isArray(data.data)) {
        data = data.data;
      }
      // Check for nested data.data
      else if (data.data && Array.isArray(data.data)) {
        data = data.data;
      }
      // Check for 'results' property
      else if (Array.isArray(data.results)) {
        data = data.results;
      } else {
        data = [];
      }
    } else {
      data = [];
    }

    const mapped = data.map((complex) => {
      const rawId = complex.complexId ?? complex.ComplexID;
      const complexId = Number(rawId);

      // Only use imageUrl from Cloudinary
      const imageUrl =
        complex.imageUrl || complex.ImageUrl || complex.imageURL || null;

      return {
        complexId: Number.isNaN(complexId) ? rawId : complexId,
        ownerId: complex.ownerId || complex.OwnerID,
        name: complex.name || complex.Name,
        address: complex.address || complex.Address,
        description: complex.description || complex.Description || "",
        // Only use URL from Cloudinary
        imageUrl: imageUrl,
        status: complex.status || complex.Status || "Active",
        createdAt: complex.createdAt || complex.CreatedAt,
        ownerName: complex.ownerName || complex.OwnerName || "",
        lat: complex.lat || complex.Lat || complex.latitude || complex.Latitude,
        lng:
          complex.lng || complex.Lng || complex.longitude || complex.Longitude,
        latitude:
          complex.latitude || complex.Latitude || complex.lat || complex.Lat,
        longitude:
          complex.longitude || complex.Longitude || complex.lng || complex.Lng,
        ward: complex.ward || complex.Ward || "",
        district: complex.district || complex.District || "",
        province: complex.province || complex.Province || "",
      };
    });

    return mapped;
  } catch (error) {
    // Throw error instead of returning empty array
    handleApiError(error);
  }
}

export async function fetchFieldComplex(id) {
  try {
    const response = await apiClient.get(`/api/FieldComplex/${id}`);
    const data = response.data;
    // Safely unwrap data. If data.data exists (even if null), use it.
    // Otherwise use data itself, but only if it doesn't look like a wrapper with 'success' property
    const complex = data && "data" in data ? data.data : data;

    // Normalize complex data to include imageUrl
    if (complex) {
      // Only use imageUrl from Cloudinary
      const imageUrl =
        complex.imageUrl || complex.ImageUrl || complex.imageURL || null;

      return {
        ...complex,
        complexId: complex.complexId || complex.ComplexID,
        ownerId: complex.ownerId || complex.OwnerID,
        name: complex.name || complex.Name,
        address: complex.address || complex.Address,
        description: complex.description || complex.Description || "",
        // Only use URL from Cloudinary
        imageUrl: imageUrl,
        status: complex.status || complex.Status || "Active",
        createdAt: complex.createdAt || complex.CreatedAt,
        ownerName: complex.ownerName || complex.OwnerName || "",
        lat: complex.lat || complex.Lat || complex.latitude || complex.Latitude,
        lng:
          complex.lng || complex.Lng || complex.longitude || complex.Longitude,
        latitude:
          complex.latitude || complex.Latitude || complex.lat || complex.Lat,
        longitude:
          complex.longitude || complex.Longitude || complex.lng || complex.Lng,
        ward: complex.ward || complex.Ward || "",
        district: complex.district || complex.District || "",
        province: complex.province || complex.Province || "",
      };
    }

    return complex;
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateFieldComplex(id, complexData) {
  try {
    let response;

    if (complexData instanceof FormData) {
      response = await apiClient.put(`/api/FieldComplex/${id}`, complexData);
    } else {
      response = await apiClient.put(`/api/FieldComplex/${id}`, complexData);
    }

    const data = response.data;
    return data && "data" in data ? data.data : data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteFieldComplex(id) {
  try {
    const response = await apiClient.delete(`/api/FieldComplex/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// Field API functions
export async function createField(fieldData) {
  try {
    // If fieldData is FormData, send as multipart/form-data
    if (fieldData instanceof FormData) {
      const response = await apiClient.post("/api/Field", fieldData);
      const data = response.data;
      return data && "data" in data ? data.data : data;
    }

    // Otherwise, send as JSON (for backward compatibility)
    const response = await apiClient.post(
      "/api/Field",
      {
        complexId: fieldData.complexId,
        typeId: fieldData.typeId,
        name: fieldData.name,
        size: fieldData.size || "",
        grassType: fieldData.grassType || "",
        description: fieldData.description || "",
        pricePerHour: fieldData.pricePerHour || 0,
        status: fieldData.status || "Available",
        bankAccountId: fieldData.bankAccountId || null,
        bankName: fieldData.bankName || "",
        bankShortCode: fieldData.bankShortCode || "",
        accountNumber: fieldData.accountNumber || "",
        accountHolder: fieldData.accountHolder || "",
      },
      { headers: buildMultipartHeaders() }
    );
    const data = response.data;
    return data && "data" in data ? data.data : data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Lấy tất cả khu sân (FieldComplex) và các sân nhỏ (Field) trong mỗi khu sân
 * @returns {Promise<Array>} Mảng các khu sân, mỗi khu sân có thuộc tính fields chứa danh sách sân nhỏ
 */
export async function fetchAllComplexesWithFields() {
  try {
    // Bước 1: Lấy tất cả khu sân từ GET /api/FieldComplex
    const complexes = await fetchFieldComplexes();

    // Bước 2: Với mỗi khu sân, lấy các sân nhỏ từ GET /api/Field/complex/{complexId}
    const complexesWithFields = await Promise.all(
      complexes.map(async (complex) => {
        try {
          const fields = await fetchFieldsByComplex(complex.complexId);
          return {
            ...complex,
            fields: fields || [],
            fieldCount: fields?.length || 0,
          };
        } catch (error) {
          return {
            ...complex,
            fields: [],
            fieldCount: 0,
          };
        }
      })
    );

    return complexesWithFields;
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchFieldsByComplex(complexId) {
  try {
    const complexIdNum = Number(complexId);
    const endpoint = `/api/Field/complex/${complexIdNum}`;

    const response = await apiClient.get(endpoint);

    if (!response) {
      return [];
    }
    // Handle response - can be array or object
    let data = response.data;
    // Handle wrapper object
    if (data && !Array.isArray(data)) {
      if (Array.isArray(data.data)) {
        data = data.data;
      } else if (data.data && Array.isArray(data.data.data)) {
        data = data.data.data;
      } else if (Array.isArray(data.value)) {
        data = data.value;
      } else if (Array.isArray(data.results)) {
        data = data.results;
      } else {
        data = [];
      }
    }

    return data.map((field) => {
      const rawFieldId = field.fieldId ?? field.FieldID;
      const normalizedFieldId = Number(rawFieldId);
      const fieldId = Number.isNaN(normalizedFieldId)
        ? rawFieldId
        : normalizedFieldId;

      const rawComplexId = field.complexId ?? field.ComplexID ?? complexIdNum;
      const normalizedComplexId = Number(rawComplexId);
      const complexIdValue = Number.isNaN(normalizedComplexId)
        ? rawComplexId
        : normalizedComplexId;

      // Try multiple variations of typeId field name (typeId is the correct one from API)
      const rawTypeId =
        field.typeId ??
        field.TypeID ??
        field.typeID ??
        field.TypeId ??
        field.fieldTypeId ??
        field.FieldTypeID;

      // Normalize typeId - ensure it's a number if it exists
      let finalTypeId = null;
      if (rawTypeId != null && rawTypeId !== undefined && rawTypeId !== "") {
        const numTypeId = Number(rawTypeId);
        finalTypeId = !Number.isNaN(numTypeId) ? numTypeId : rawTypeId;
      }

      // Only use URLs from Cloudinary
      const mainImageUrl = field.mainImageUrl || field.MainImageUrl || null;
      const imageUrls = field.imageUrls || field.ImageUrls || [];

      const normalizedField = {
        fieldId,
        complexId: complexIdValue,
        typeId: finalTypeId,
        name: field.name || field.Name || "",
        size: field.size || field.Size || "",
        grassType: field.grassType || field.GrassType || "",
        description: field.description || field.Description || "",
        // Only use URLs from Cloudinary
        mainImageUrl: mainImageUrl,
        imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
        pricePerHour: field.pricePerHour || field.PricePerHour || 0,
        status: field.status || field.Status || "Available",
        createdAt: field.createdAt || field.CreatedAt,
        complexName: field.complexName || field.ComplexName || "",
        typeName: field.typeName || field.TypeName || "",
        bankAccountId: field.bankAccountId || field.BankAccountId || null,
        bankName: field.bankName || field.BankName || "",
        bankShortCode: field.bankShortCode || field.BankShortCode || "",
        accountNumber: field.accountNumber || field.AccountNumber || "",
        accountHolder: field.accountHolder || field.AccountHolder || "",
        // Add priceForSelectedSlot if available
        priceForSelectedSlot:
          field.priceForSelectedSlot ||
          field.pricePerHour ||
          field.PricePerHour ||
          0,
        // Add isAvailableForSelectedSlot if available
        isAvailableForSelectedSlot:
          field.isAvailableForSelectedSlot !== undefined
            ? field.isAvailableForSelectedSlot
            : field.status === "Available" || field.Status === "Available",
      };

      return normalizedField;
    });
  } catch (error) {
    if (error?.response?.status === 404) {
      return [];
    }
    handleApiError(error);
  }
}

export async function fetchField(fieldId) {
  try {
    const response = await apiClient.get(`/api/Field/${fieldId}`);
    const data = response.data;
    // Safely unwrap data. If data.data exists (even if null), use it.
    // Otherwise use data itself, but only if it doesn't look like a wrapper with 'success' property
    const field = data && "data" in data ? data.data : data;

    // Normalize field data to ensure typeId and complexId are preserved
    if (field) {
      return {
        ...field,
        typeId:
          field.typeId ?? field.TypeID ?? field.typeID ?? field.TypeId ?? null,
        typeName: field.typeName ?? field.TypeName ?? "",
        complexId:
          field.complexId ??
          field.complexID ??
          field.ComplexID ??
          field.complex_id ??
          null,
      };
    }

    return field;
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateField(fieldId, fieldData) {
  try {
    // If fieldData is FormData, send as multipart/form-data
    if (fieldData instanceof FormData) {
      const response = await apiClient.put(`/api/Field/${fieldId}`, fieldData);
      return response.data;
    }

    // Otherwise, send as JSON (for backward compatibility)
    const response = await apiClient.put(`/api/Field/${fieldId}`, fieldData, {
      headers: buildMultipartHeaders(),
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteField(fieldId) {
  try {
    const response = await apiClient.delete(`/api/Field/${fieldId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// FieldPrice API functions
export async function createFieldPrice(priceData) {
  try {
    const response = await apiClient.post("/api/FieldPrice", {
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
    const response = await apiClient.get("/api/FieldPrice");
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchFieldPrice(id) {
  try {
    const response = await apiClient.get(`/api/FieldPrice/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateFieldPrice(id, priceData) {
  try {
    const response = await apiClient.put(`/api/FieldPrice/${id}`, priceData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteFieldPrice(id) {
  try {
    const response = await apiClient.delete(`/api/FieldPrice/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// // Time slots - should be fetched from API in the future
// export async function fetchFieldTimeSlots() {
//   // TODO: Replace with real API call when available
//   const TIME_SLOTS = [
//     { SlotID: 11, SlotName: "Slot 11", StartTime: "07:15", EndTime: "08:45" },
//     { SlotID: 10, SlotName: "Slot 10", StartTime: "08:45", EndTime: "10:15" },
//     { SlotID: 9, SlotName: "Slot 9", StartTime: "10:15", EndTime: "11:45" },
//     { SlotID: 8, SlotName: "Slot 8", StartTime: "11:45", EndTime: "13:15" },
//     { SlotID: 7, SlotName: "Slot 7", StartTime: "13:15", EndTime: "14:45" },
//     { SlotID: 6, SlotName: "Slot 6", StartTime: "14:45", EndTime: "16:15" },
//     { SlotID: 5, SlotName: "Slot 5", StartTime: "16:15", EndTime: "17:45" },
//     { SlotID: 4, SlotName: "Slot 4", StartTime: "17:45", EndTime: "19:15" },
//     { SlotID: 3, SlotName: "Slot 3", StartTime: "19:15", EndTime: "20:45" },
//     { SlotID: 2, SlotName: "Slot 2", StartTime: "20:45", EndTime: "22:15" },
//     { SlotID: 1, SlotName: "Slot 1", StartTime: "22:15", EndTime: "23:40" },
//   ];

//   return TIME_SLOTS.map((s) => ({
//     slotId: s.SlotID,
//     name: `${s.StartTime} – ${s.EndTime}`,
//     start: s.StartTime,
//     end: s.EndTime,
//   }));
// }

// Simplified functions that only use real API data
export async function fetchComplexes(params = {}) {
  const { query = "" } = params;

  try {
    const complexes = await fetchFieldComplexes();

    // Filter only Active complexes for Player pages
    const activeComplexes = complexes.filter(
      (complex) => (complex.status || complex.Status || "Active") === "Active"
    );

    // Fetch fields for each complex to get counts
    const complexesWithFields = await Promise.all(
      activeComplexes.map(async (complex) => {
        try {
          const fields = await fetchFieldsByComplex(complex.complexId);
          return {
            complexId: complex.complexId,
            name: complex.name,
            address: complex.address,
            // Only use URL from Cloudinary
            imageUrl: complex.imageUrl,
            lat: complex.lat || complex.latitude,
            lng: complex.lng || complex.longitude,
            latitude: complex.latitude || complex.lat,
            longitude: complex.longitude || complex.lng,
            ward: complex.ward || "",
            district: complex.district || "",
            province: complex.province || "",
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
          return {
            complexId: complex.complexId,
            name: complex.name,
            address: complex.address,
            // Only use URL from Cloudinary
            imageUrl: complex.imageUrl,
            lat: complex.lat || complex.latitude,
            lng: complex.lng || complex.longitude,
            latitude: complex.latitude || complex.lat,
            longitude: complex.longitude || complex.lng,
            ward: complex.ward || "",
            district: complex.district || "",
            province: complex.province || "",
            totalFields: 0,
            availableFields: 0,
            minPriceForSelectedSlot: 0,
            rating: 0,
          };
        }
      })
    );

    const filtered = complexesWithFields.filter((item) => {
      if (!query) return true; // Return all if no query
      const q = query.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        (item.district || "").toLowerCase().includes(q)
      );
    });

    return filtered;
  } catch (error) {
    throw error;
  }
}

export async function fetchFields(params = {}) {
  const { complexId, query = "", typeId } = params;

  try {
    let allFields = [];
    let complexes = [];

    if (complexId) {
      // Fetch complexes first to check status
      complexes = await fetchFieldComplexes();
      
      // Check if the specific complex is Active
      const targetComplex = complexes.find(c => 
        String(c.complexId) === String(complexId)
      );
      
      // Only fetch fields if complex is Active
      if (targetComplex && (targetComplex.status || targetComplex.Status || "Active") === "Active") {
        try {
          const fields = await fetchFieldsByComplex(complexId);
          allFields = Array.isArray(fields) ? fields : [];
        } catch (error) {
          console.error(
            `[fetchFields] Error fetching fields for complex ${complexId}:`,
            error
          );
          allFields = [];
        }
      } else {
        // Complex is not Active (Pending/Rejected), return empty
        allFields = [];
      }
    } else {
      // Fetch all fields from all complexes
      complexes = await fetchFieldComplexes();

      // Filter only Active complexes for Player pages
      const activeComplexes = complexes.filter(
        (complex) => (complex.status || complex.Status || "Active") === "Active"
      );

      const fieldsPromises = activeComplexes.map(async (complex) => {
        try {
          return await fetchFieldsByComplex(complex.complexId);
        } catch (error) {
          return [];
        }
      });
      const fieldsArrays = await Promise.all(fieldsPromises);
      allFields = fieldsArrays.flat();
    }

    // Get complex info for address mapping (only Active complexes)
    const activeComplexes = complexes.filter(
      (complex) => (complex.status || complex.Status || "Active") === "Active"
    );
    const complexMap = new Map(
      activeComplexes.map((c) => [String(c.complexId), c])
    );

    return allFields
      .filter((f) => {
        // Only include fields from Active complexes
        const complex = complexMap.get(String(f.complexId));
        return (
          complex && (complex.status || complex.Status || "Active") === "Active"
        );
      })
      .filter((f) => !typeId || f.typeId === Number(typeId))
      // Chỉ hiển thị sân có trạng thái "Available" - không hiển thị sân đang bảo trì
      .filter((f) => {
        const fieldStatus = (f.status || f.Status || "Available").toLowerCase();
        return fieldStatus === "available";
      })
      .map((f) => {
        const complex = complexMap.get(String(f.complexId));
        const status = f.status || f.Status || "Available";

        // Only use URLs from Cloudinary
        const mainImageUrl = f.mainImageUrl || f.MainImageUrl || null;
        const imageUrls = f.imageUrls || f.ImageUrls || [];

        return {
          fieldId: f.fieldId,
          complexId: f.complexId,
          typeId: f.typeId ?? f.TypeID ?? f.typeID ?? f.TypeId ?? null, // Ensure typeId is preserved
          complexName: f.complexName || complex?.name || "",
          name: f.name,
          typeName: f.typeName || f.TypeName || "",
          size: f.size || "",
          grassType: f.grassType || "",
          description: f.description || "",
          address: complex?.address || "",
          complexAddress: complex?.address || "",
          district: complex?.district || complex?.District || "",
          ward: complex?.ward || complex?.Ward || "",
          province: complex?.province || complex?.Province || "",
          // Only use URLs from Cloudinary
          mainImageUrl: mainImageUrl,
          imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
          priceForSelectedSlot: f.pricePerHour,
          rating: 0,
          reviewCount: 0,
          distanceKm: 0,
          isAvailableForSelectedSlot: status === "Available",
          bankName: f.bankName || "",
          bankShortCode: f.bankShortCode || "",
          accountNumber: f.accountNumber || "",
          accountHolder: f.accountHolder || "",
        };
      })
      .filter((item) => {
        if (!query) return true; // Return all if no query
        const q = query.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.address.toLowerCase().includes(q) ||
          (item.district || "").toLowerCase().includes(q) ||
          (item.complexName || "").toLowerCase().includes(q)
        );
      });
  } catch (error) {
    throw error;
  }
}

// Simplified field availability - should be replaced with real API
export async function fetchFieldAvailability(fieldId, date) {
  // TODO: Replace with real API call when available
  const TIME_SLOTS = [
    { SlotID: 11, StartTime: "07:15", EndTime: "08:45" },
    { SlotID: 10, StartTime: "08:45", EndTime: "10:15" },
    { SlotID: 9, StartTime: "10:15", EndTime: "11:45" },
    { SlotID: 8, StartTime: "11:45", EndTime: "13:15" },
    { SlotID: 7, StartTime: "13:15", EndTime: "14:45" },
    { SlotID: 6, StartTime: "14:45", EndTime: "16:15" },
    { SlotID: 5, StartTime: "16:15", EndTime: "17:45" },
    { SlotID: 4, StartTime: "17:45", EndTime: "19:15" },
    { SlotID: 3, StartTime: "19:15", EndTime: "20:45" },
    { SlotID: 2, StartTime: "20:45", EndTime: "22:15" },
    { SlotID: 1, StartTime: "22:15", EndTime: "23:45" },
  ];

  return TIME_SLOTS.map((s) => ({
    slotId: s.SlotID,
    name: `${s.StartTime} – ${s.EndTime}`,
    price: 200000, // Default price - should come from API
    status: "Available", // Default status - should come from API
  }));
}

export async function fetchComplexDetail(complexId, { date, slotId } = {}) {
  try {
    // Fetch complex and fields in parallel for better performance
    const [complex, fields] = await Promise.all([
      fetchFieldComplex(complexId).catch((err) => {
        return null;
      }),
      fetchFields({ complexId, date, slotId }).catch((err) => {
        return [];
      }),
    ]);

    // Normalize status check - case insensitive
    const complexStatus = complex
      ? (complex.status || complex.Status || "").toString().toLowerCase()
      : "";
    const isActive = complexStatus === "active" || complexStatus === "";

    // If complex is not Active, still return fields but mark complex as inactive
    // This allows viewing fields even if complex status is not "Active"
    return {
      complex:
        complex && isActive
          ? {
              complexId: complex.complexId,
              name: complex.name,
              address: complex.address,
              description: complex.description,
              // Only use URL from Cloudinary
              imageUrl: complex.imageUrl,
              rating: 0, // Should come from API
              status: complex.status || complex.Status || "Active",
            }
          : complex
          ? {
              complexId: complex.complexId,
              name: complex.name,
              address: complex.address,
              description: complex.description,
              imageUrl: complex.imageUrl,
              rating: 0,
              status: complex.status || complex.Status || "Active",
            }
          : null,
      fields: Array.isArray(fields) ? fields : [],
    };
  } catch (error) {
    throw new Error("Không thể tải thông tin khu sân. Vui lòng thử lại sau.");
  }
}

export async function fetchFieldMeta(fieldId) {
  try {
    const field = await fetchField(fieldId);
    if (!field) return { field: null, complex: null };

    const complex = await fetchFieldComplex(field.complexId);

    // Check if complex is Active - if not, return null for Player pages
    if (
      complex &&
      (complex.status || complex.Status || "Active") !== "Active"
    ) {
      return { field: null, complex: null };
    }

    return {
      field: {
        fieldId: field.fieldId,
        name: field.name,
        typeName: field.typeName || "",
      },
      complex: complex
        ? {
            complexId: complex.complexId,
            name: complex.name,
            address: complex.address,
            imageUrl: complex.imageUrl,
          }
        : null,
    };
  } catch (error) {
    throw error;
  }
}

export async function fetchFieldDetail(fieldId) {
  try {
    const field = await fetchField(fieldId);
    if (!field) return null;

    const complex = await fetchFieldComplex(field.complexId);

    // Check if complex is Active - if not, return null for Player pages
    if (
      complex &&
      (complex.status || complex.Status || "Active") !== "Active"
    ) {
      return null;
    }

    // Normalize field type information - support multiple field name variations
    const typeId =
      field.typeId || field.typeID || field.TypeID || field.TypeId || null;
    const typeName = field.typeName || field.typeName || field.TypeName || "";

    // Only use URLs from Cloudinary
    const mainImageUrl = field.mainImageUrl || field.MainImageUrl || null;
    const imageUrls = field.imageUrls || field.ImageUrls || [];

    return {
      fieldId: field.fieldId || field.fieldID || field.FieldID,
      complexId: field.complexId || field.complexID || field.ComplexID,
      complexName: complex?.name || "",
      address: complex?.address || "",
      name: field.name || field.Name || "",
      typeId: typeId,
      typeName: typeName,
      size: field.size || field.Size || "",
      grassType: field.grassType || field.grassType || field.GrassType || "",
      description: field.description || field.Description || "",
      // Only use URLs from Cloudinary
      mainImageUrl: mainImageUrl,
      imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
      pricePerHour:
        field.pricePerHour || field.pricePerHour || field.PricePerHour || 0,
      rating: field.rating || field.Rating || 0,
    };
  } catch (error) {
    console.error("Error fetching field detail:", error);
    throw error;
  }
}

// Fetch top booking fields
export async function fetchTopBookingFields() {
  try {
    const response = await apiClient.get("/api/TopField/top-field");
    return response.data || [];
  } catch (error) {
    console.error("Error fetching top booking fields:", error);
    handleApiError(error);
    return [];
  }
}
