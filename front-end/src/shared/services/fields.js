import axios from "axios";
import { API_BASE_URL } from "../config/api";

// Re-export validations từ file riêng để giữ backward compatibility
export {
  validateFieldName,
  validateFieldPrice,
  validateFieldSize,
  validateAddress,
  validateComplexData,
  validateFieldData,
} from "../utils/validations";

// tạo instance axios với cấu hình base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// hàm build multipart headers
const buildMultipartHeaders = () => {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

// thêm interceptor request để include token auth nếu có
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

// flag để ngăn chặn nhiều thông báo session expired
let isShowingSessionExpired = false;

// thêm interceptor response để xử lý lỗi 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isShowingSessionExpired) {
      isShowingSessionExpired = true;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // hiển thị thông báo và chuyển hướng
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

// hàm xử lý lỗi API
const handleApiError = (error) => {
  if (error.response) {
    throw error;
  }

  let errorMessage = "Có lỗi xảy ra khi gọi API";
  let details = "";

  if (error.request) {
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

// ========== API FUNCTIONS ==========
// hàm tạo khu sân
export async function createFieldComplex(complexData) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
    }

    const endpoints = ["/api/FieldComplex"];
    let response = null;
    let lastError = null;
    if (complexData instanceof FormData) {
      for (const endpoint of endpoints) {
        try {
          response = await apiClient.post(endpoint, complexData);
          break;
        } catch (err) {
          lastError = err;
          if (err.response?.status !== 404) {
            break;
          }
        }
      }
    } else {
      const payload = {
        complexId: complexData.complexId || 0,
        ownerId: complexData.ownerId,
        name: complexData.name,
        address: complexData.address,
        description: complexData.description || "",
        imageUrl: complexData.imageUrl || "",
        status: complexData.status || "Pending",
      };

      for (const endpoint of endpoints) {
        try {
          response = await apiClient.post(endpoint, payload);
          break;
        } catch (err) {
          lastError = err;
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

// hàm lấy tất cả các khu sân
export async function fetchFieldComplexes() {
  try {
    const endpoint = "/api/FieldComplex";
    const response = await apiClient.get(endpoint);

    let data = response.data;
    if (!data) {
      return [];
    }

    if (Array.isArray(data)) {
    } else if (data && typeof data === "object") {
      if (Array.isArray(data.value)) {
        data = data.value;
      } else if (Array.isArray(data.data)) {
        data = data.data;
      } else if (data.data && Array.isArray(data.data)) {
        data = data.data;
      } else if (Array.isArray(data.results)) {
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

      const imageUrl =
        complex.imageUrl || complex.ImageUrl || complex.imageURL || null;

      return {
        complexId: Number.isNaN(complexId) ? rawId : complexId,
        ownerId: complex.ownerId || complex.OwnerID,
        name: complex.name || complex.Name,
        address: complex.address || complex.Address,
        description: complex.description || complex.Description || "",
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
    handleApiError(error);
  }
}

// hàm lấy khu sân theo id
export async function fetchFieldComplex(id) {
  try {
    const response = await apiClient.get(`/api/FieldComplex/${id}`);
    const data = response.data;
    const complex = data && "data" in data ? data.data : data;

    if (complex) {
      const imageUrl =
        complex.imageUrl || complex.ImageUrl || complex.imageURL || null;

      return {
        ...complex,
        complexId: complex.complexId || complex.ComplexID,
        ownerId: complex.ownerId || complex.OwnerID,
        name: complex.name || complex.Name,
        address: complex.address || complex.Address,
        description: complex.description || complex.Description || "",
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

// hàm cập nhật khu sân
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

// hàm xóa khu sân
export async function deleteFieldComplex(id) {
  try {
    const response = await apiClient.delete(`/api/FieldComplex/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// hàm tạo sân nhỏ
export async function createField(fieldData) {
  try {
    if (fieldData instanceof FormData) {
      const response = await apiClient.post("/api/Field", fieldData);
      const data = response.data;
      return data && "data" in data ? data.data : data;
    }
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

// hàm lấy tất cả khu sân và các sân nhỏ trong mỗi khu sân
export async function fetchAllComplexesWithFields() {
  try {
    const complexes = await fetchFieldComplexes(); // lấy tất cả khu sân
    const complexesWithFields = await Promise.all(
      // lấy các sân nhỏ trong mỗi khu sân
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

// hàm lấy các sân nhỏ theo khu sân
export async function fetchFieldsByComplex(complexId) {
  try {
    const complexIdNum = Number(complexId);
    const endpoint = `/api/Field/complex/${complexIdNum}`;

    const response = await apiClient.get(endpoint);

    if (!response) {
      return [];
    }
    let data = response.data;
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

      const rawTypeId =
        field.typeId ??
        field.TypeID ??
        field.typeID ??
        field.TypeId ??
        field.fieldTypeId ??
        field.FieldTypeID;

      let finalTypeId = null;
      if (rawTypeId != null && rawTypeId !== undefined && rawTypeId !== "") {
        const numTypeId = Number(rawTypeId);
        finalTypeId = !Number.isNaN(numTypeId) ? numTypeId : rawTypeId;
      }

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
        priceForSelectedSlot:
          field.priceForSelectedSlot ||
          field.pricePerHour ||
          field.PricePerHour ||
          0,
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

// hàm lấy sân nhỏ theo id
export async function fetchField(fieldId) {
  try {
    const response = await apiClient.get(`/api/Field/${fieldId}`);
    const data = response.data;
    const field = data && "data" in data ? data.data : data;

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

// hàm cập nhật sân nhỏ
export async function updateField(fieldId, fieldData) {
  try {
    if (fieldData instanceof FormData) {
      const response = await apiClient.put(`/api/Field/${fieldId}`, fieldData);
      return response.data;
    }
    const response = await apiClient.put(`/api/Field/${fieldId}`, fieldData, {
      headers: buildMultipartHeaders(),
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// hàm xóa sân nhỏ
export async function deleteField(fieldId) {
  try {
    const response = await apiClient.delete(`/api/Field/${fieldId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// hàm tạo giá sân nhỏ
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

// hàm lấy tất cả giá sân nhỏ
export async function fetchFieldPrices() {
  try {
    const response = await apiClient.get("/api/FieldPrice");
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// hàm lấy giá sân nhỏ theo id
export async function fetchFieldPrice(id) {
  try {
    const response = await apiClient.get(`/api/FieldPrice/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// hàm cập nhật giá sân nhỏ
export async function updateFieldPrice(id, priceData) {
  try {
    const response = await apiClient.put(`/api/FieldPrice/${id}`, priceData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// hàm xóa giá sân nhỏ
export async function deleteFieldPrice(id) {
  try {
    const response = await apiClient.delete(`/api/FieldPrice/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// hàm lấy tất cả các khu sân và các sân nhỏ trong mỗi khu sân
export async function fetchComplexes(params = {}) {
  const { query = "" } = params;

  try {
    const complexes = await fetchFieldComplexes();
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
            rating: 0,
          };
        } catch (error) {
          return {
            complexId: complex.complexId,
            name: complex.name,
            address: complex.address,
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
      if (!query) return true;
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

// hàm lấy tất cả các sân nhỏ
export async function fetchFields(params = {}) {
  const { complexId, query = "", typeId } = params;

  try {
    let allFields = [];
    let complexes = [];

    if (complexId) {
      // Fetch complexes first to check status
      complexes = await fetchFieldComplexes();

      // Check if the specific complex is Active
      const targetComplex = complexes.find(
        (c) => String(c.complexId) === String(complexId)
      );

      // Only fetch fields if complex is Active
      if (
        targetComplex &&
        (targetComplex.status || targetComplex.Status || "Active") === "Active"
      ) {
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

    return (
      allFields
        .filter((f) => {
          // Only include fields from Active complexes
          const complex = complexMap.get(String(f.complexId));
          return (
            complex &&
            (complex.status || complex.Status || "Active") === "Active"
          );
        })
        .filter((f) => !typeId || f.typeId === Number(typeId))
        // Chỉ hiển thị sân có trạng thái "Available" - không hiển thị sân đang bảo trì
        .filter((f) => {
          const fieldStatus = (
            f.status ||
            f.Status ||
            "Available"
          ).toLowerCase();
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
        })
    );
  } catch (error) {
    throw error;
  }
}

// hàm lấy tất cả các sân nhỏ có thể đặt
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
// hàm lấy chi tiết khu sân
export async function fetchComplexDetail(complexId, { date, slotId } = {}) {
  try {
    const [complex, fields] = await Promise.all([
      fetchFieldComplex(complexId).catch((err) => {
        return null;
      }),
      fetchFields({ complexId, date, slotId }).catch((err) => {
        return [];
      }),
    ]);

    const complexStatus = complex
      ? (complex.status || complex.Status || "").toString().toLowerCase()
      : "";
    const isActive = complexStatus === "active" || complexStatus === "";

    return {
      complex:
        complex && isActive
          ? {
              complexId: complex.complexId,
              name: complex.name,
              address: complex.address,
              description: complex.description,
              imageUrl: complex.imageUrl,
              rating: 0,
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

// hàm lấy meta sân nhỏ
export async function fetchFieldMeta(fieldId) {
  try {
    const field = await fetchField(fieldId);
    if (!field) return { field: null, complex: null };

    const complex = await fetchFieldComplex(field.complexId);

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

// hàm lấy chi tiết sân nhỏ
export async function fetchFieldDetail(fieldId) {
  try {
    const field = await fetchField(fieldId);
    if (!field) return null;

    const complex = await fetchFieldComplex(field.complexId);

    if (
      complex &&
      (complex.status || complex.Status || "Active") !== "Active"
    ) {
      return null;
    }

    const typeId =
      field.typeId || field.typeID || field.TypeID || field.TypeId || null;
    const typeName = field.typeName || field.typeName || field.TypeName || "";
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

// hàm lấy top sân nhỏ đặt nhiều nhất
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
