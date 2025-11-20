// Service layer for Field, FieldComplex, FieldPrice APIs
import axios from "axios";

const DEFAULT_API_BASE_URL = "https://sep490-g19-zxph.onrender.com";
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
      const payload = {
        complexId: complexData.complexId || 0,
        ownerId: complexData.ownerId,
        name: complexData.name,
        address: complexData.address,
        description: complexData.description || "",
        imageBase64: complexData.imageBase64 || "",
        status: complexData.status || "Active",
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
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    const response = await apiClient.get(endpoint);

    let data = response.data;

    // If response.data is null or undefined
    if (!data) {
      console.warn("Response data is null or undefined, returning empty array");
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
      return {
        complexId: Number.isNaN(complexId) ? rawId : complexId,
        ownerId: complex.ownerId || complex.OwnerID,
        name: complex.name || complex.Name,
        address: complex.address || complex.Address,
        description: complex.description || complex.Description || "",
        imageBase64:
          complex.imageBase64 || complex.ImageBase64 || complex.imageFile || "",
        status: complex.status || complex.Status || "Active",
        createdAt: complex.createdAt || complex.CreatedAt,
        ownerName: complex.ownerName || complex.OwnerName || "",
        lat: complex.lat || complex.Lat,
        lng: complex.lng || complex.Lng,
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
    return response.data;
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

    return response.data;
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
      return response.data;
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
        imageBase64: fieldData.imageBase64 || "",
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
    return response.data;
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
    console.log("Fetching all complexes with their fields...");

    // Bước 1: Lấy tất cả khu sân từ GET /api/FieldComplex
    const complexes = await fetchFieldComplexes();
    console.log(`Found ${complexes.length} complexes`);

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
          console.error(
            `Error fetching fields for complex ${complex.complexId}:`,
            error
          );
          return {
            ...complex,
            fields: [],
            fieldCount: 0,
          };
        }
      })
    );

    console.log(
      `Successfully fetched ${complexesWithFields.length} complexes with their fields`
    );
    return complexesWithFields;
  } catch (error) {
    console.error("Error fetching complexes with fields:", error);
    handleApiError(error);
  }
}

export async function fetchFieldsByComplex(complexId) {
  try {
    const complexIdNum = Number(complexId);
    console.log(
      `Fetching fields for complex ${complexIdNum} from:`,
      `${API_BASE_URL}/api/Field/complex/${complexIdNum}`
    );

    // Use the correct endpoint from Swagger: GET /api/Field/complex/{complexId}
    const response = await apiClient.get(`/api/Field/complex/${complexIdNum}`);
    console.log(`Fields for complex ${complexIdNum} response:`, response.data);

    // Handle response - can be array or object
    let data = response.data;
    if (!Array.isArray(data)) {
      if (data && Array.isArray(data.data)) {
        data = data.data;
      } else if (data && data.data && Array.isArray(data.data)) {
        data = data.data;
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

      const rawTypeId = field.typeId ?? field.TypeID;
      const normalizedTypeId = Number(rawTypeId);

      return {
        fieldId,
        complexId: complexIdValue,
        typeId: Number.isNaN(normalizedTypeId) ? rawTypeId : normalizedTypeId,
        name: field.name || field.Name,
        size: field.size || field.Size || "",
        grassType: field.grassType || field.GrassType || "",
        description: field.description || field.Description || "",
        imageBase64: field.imageBase64 || field.ImageBase64 || "",
        pricePerHour: field.pricePerHour || field.PricePerHour,
        status: field.status || field.Status || "Available",
        createdAt: field.createdAt || field.CreatedAt,
        complexName: field.complexName || field.ComplexName || "",
        typeName: field.typeName || field.TypeName || "",
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
    return response.data;
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

    console.log(`Fetched ${complexes.length} complexes from API`);

    // Fetch fields for each complex to get counts
    const complexesWithFields = await Promise.all(
      complexes.map(async (complex) => {
        try {
          const fields = await fetchFieldsByComplex(complex.complexId);
          return {
            complexId: complex.complexId,
            name: complex.name,
            address: complex.address,
            imageBase64: complex.imageBase64,
            lat: complex.lat,
            lng: complex.lng,
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
          console.warn(
            `Error fetching fields for complex ${complex.complexId}:`,
            error?.message || error
          );
          return {
            complexId: complex.complexId,
            name: complex.name,
            address: complex.address,
            imageBase64: complex.imageBase64,
            lat: complex.lat,
            lng: complex.lng,
            totalFields: 0,
            availableFields: 0,
            minPriceForSelectedSlot: 0,
            rating: 0,
          };
        }
      })
    );

    const filtered = complexesWithFields.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.address.toLowerCase().includes(query.toLowerCase())
    );

    console.log(`Returning ${filtered.length} filtered complexes from API`);
    return filtered;
  } catch (error) {
    console.error(
      "Error fetching complexes from API:",
      error?.message || error
    );
    throw error;
  }
}

export async function fetchFields(params = {}) {
  const { complexId, query = "", typeId } = params;

  try {
    let allFields = [];
    let complexes = [];

    if (complexId) {
      // Fetch fields for a specific complex
      const fields = await fetchFieldsByComplex(complexId);
      allFields = fields;
      // Fetch complexes for address mapping
      complexes = await fetchFieldComplexes();
    } else {
      // Fetch all fields from all complexes
      complexes = await fetchFieldComplexes();
      const fieldsPromises = complexes.map(async (complex) => {
        try {
          return await fetchFieldsByComplex(complex.complexId);
        } catch (error) {
          console.error(
            `Error fetching fields for complex ${complex.complexId}:`,
            error
          );
          return [];
        }
      });
      const fieldsArrays = await Promise.all(fieldsPromises);
      allFields = fieldsArrays.flat();
    }

    // Get complex info for address mapping
    const complexMap = new Map(complexes.map((c) => [String(c.complexId), c]));

    return allFields
      .filter((f) => !typeId || f.typeId === Number(typeId))
      .map((f) => {
        const complex = complexMap.get(String(f.complexId));
        const status = f.status || "Available";
        return {
          fieldId: f.fieldId,
          complexId: f.complexId,
          complexName: f.complexName || complex?.name || "",
          name: f.name,
          typeName: f.typeName || "",
          size: f.size || "",
          grassType: f.grassType || "",
          description: f.description || "",
          address: complex?.address || "",
          imageBase64: f.imageBase64,
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
      .filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.address.toLowerCase().includes(query.toLowerCase())
      );
  } catch (error) {
    console.error("Error fetching fields from API:", error);
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
        console.warn("Error fetching complex:", err);
        return null;
      }),
      fetchFields({ complexId, date, slotId }).catch((err) => {
        console.warn("Error fetching fields:", err);
        return [];
      }),
    ]);

    return {
      complex: complex
        ? {
            complexId: complex.complexId,
            name: complex.name,
            address: complex.address,
            description: complex.description,
            imageBase64: complex.imageBase64,
            rating: 0, // Should come from API
          }
        : null,
      fields: fields || [],
    };
  } catch (error) {
    console.error("Error fetching complex detail:", error);
    throw new Error("Không thể tải thông tin khu sân. Vui lòng thử lại sau.");
  }
}

export async function fetchFieldMeta(fieldId) {
  try {
    const field = await fetchField(fieldId);
    if (!field) return { field: null, complex: null };

    const complex = await fetchFieldComplex(field.complexId);

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
            imageBase64: complex.imageBase64,
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching field meta:", error);
    throw error;
  }
}

export async function fetchFieldDetail(fieldId) {
  try {
    const field = await fetchField(fieldId);
    if (!field) return null;

    const complex = await fetchFieldComplex(field.complexId);

    return {
      fieldId: field.fieldId,
      complexId: field.complexId,
      complexName: complex?.name || "",
      address: complex?.address || "",
      name: field.name,
      typeId: field.typeId,
      typeName: field.typeName || "",
      size: field.size || "",
      grassType: field.grassType || "",
      description: field.description || "",
      imageBase64: field.imageBase64,
      images: [field.imageBase64],
      pricePerHour: field.pricePerHour,
      rating: 0, // Should come from API
    };
  } catch (error) {
    console.error("Error fetching field detail:", error);
    throw error;
  }
}
