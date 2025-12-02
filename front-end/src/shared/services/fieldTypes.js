import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://sep490-g19-zxph.onrender.com";

// Create axios instance with base config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for auth token
api.interceptors.request.use(
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

/**
 * Fetch all field types
 * GET /api/FieldType
 */
export const fetchFieldTypes = async () => {
  try {
    const response = await api.get(`${API_BASE_URL}/api/FieldType`);
    return {
      success: true,
      data: response.data || [],
    };
  } catch (error) {
    console.error("Error fetching field types:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch field types",
      data: [],
    };
  }
};

/**
 * Fetch field type by ID
 * GET /api/FieldType/{id}
 */
export const fetchFieldTypeById = async (typeId) => {
  try {
    const response = await api.get(`/api/FieldType/${typeId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error fetching field type:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch field type",
      data: null,
    };
  }
};

/**
 * Create new field type
 * POST /api/FieldType
 * @param {Object} fieldTypeData - { typeName: string }
 */
export const createFieldType = async (fieldTypeData) => {
  try {
    const response = await api.post("/api/FieldType", fieldTypeData);
    return {
      success: true,
      data: response.data,
      message: "Loại sân đã được thêm",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Lỗi khi tạo loại sân",
      data: null,
    };
  }
};

export const updateFieldType = async (typeId, fieldTypeData) => {
  try {
    const response = await api.put(`/api/FieldType/${typeId}`, fieldTypeData);

    return {
      success: true,
      data: response.data,
      message: "Loại sân đã được thêm",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Lỗi khi tạo loại sân",
      data: null,
    };
  }
};

export const deleteFieldType = async (typeId) => {
  try {
    const response = await api.delete(`/api/FieldType/${typeId}`);

    return {
      success: true,
      message: "Field type deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to delete field type",
    };
  }
};

export const normalizeFieldType = (fieldType) => {
  if (!fieldType) return null;

  return {
    typeId: fieldType.typeId || fieldType.TypeID || fieldType.typeID,
    typeName:
      fieldType.typeName || fieldType.TypeName || fieldType.type_name || "",
  };
};
