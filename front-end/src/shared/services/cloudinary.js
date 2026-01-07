//tải ảnh lên Cloudinary
import axios from "axios";
import { getStoredToken } from "../utils/tokenManager";

const DEFAULT_API_BASE_URL = "http://localhost:8080";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

// tải ảnh lên Cloudinary
export async function uploadImageToCloudinary(imageFile, folder = "posts") {
  try {
    if (!imageFile) {
      throw new Error("Không có file ảnh để upload.");
    }

    // Validate file type
    if (!imageFile.type.startsWith("image/")) {
      throw new Error("File phải là ảnh.");
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      throw new Error("Kích thước ảnh không được vượt quá 10MB.");
    }

    const token = getStoredToken();
    if (!token) {
      throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
    }

    // tạo FormData
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("folder", folder);
    // tải ảnh lên backend API endpoint xử lý upload Cloudinary
    const response = await axios.post(
      `${API_BASE_URL}/api/Upload/image`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 60 seconds timeout for large files
      }
    );

    // lấy URL ảnh từ response
    let imageUrl = null;
    if (response.data) {
      if (typeof response.data === "string") {
        imageUrl = response.data;
      } else if (response.data.url) {
        imageUrl = response.data.url;
      } else if (response.data.imageUrl) {
        imageUrl = response.data.imageUrl;
      } else if (response.data.secure_url) {
        imageUrl = response.data.secure_url;
      } else if (response.data.data?.url) {
        imageUrl = response.data.data.url;
      } else if (response.data.data?.imageUrl) {
        imageUrl = response.data.data.imageUrl;
      }
    }

    if (!imageUrl) {
      throw new Error("Không thể lấy URL ảnh từ server.");
    }
    return imageUrl;
  } catch (error) {
    let errorMessage = "Không thể upload ảnh. Vui lòng thử lại.";

    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      } else if (status === 413) {
        errorMessage = "File ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn.";
      } else if (data && data.message) {
        errorMessage = data.message;
      } else if (data && typeof data === "string") {
        errorMessage = data;
      }
    } else if (error.request) {
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        errorMessage = "Upload timeout. Vui lòng thử lại với ảnh nhỏ hơn.";
      } else {
        errorMessage =
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}
// xóa ảnh từ Cloudinary
export async function deleteImageFromCloudinary(imageUrl) {
  try {
    if (!imageUrl) {
      return;
    }
    if (
      !imageUrl.includes("cloudinary.com") &&
      !imageUrl.includes("res.cloudinary.com")
    ) {
      return;
    }

    const token = getStoredToken();
    if (!token) {
      return;
    }

    // lấy public_id từ URL ảnh
    const publicIdMatch = imageUrl.match(
      /\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/
    );
    const publicId = publicIdMatch ? publicIdMatch[1] : null;

    if (!publicId) {
      return;
    }
    // gọi backend API để xóa ảnh từ Cloudinary
    await axios.delete(`${API_BASE_URL}/api/Upload/image`, {
      data: { publicId: publicId },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[deleteImageFromCloudinary] Delete error:", error);
  }
}

// tải nhiều ảnh lên Cloudinary
export async function uploadMultipleImagesToCloudinary(
  imageFiles,
  folder = "posts"
) {
  try {
    if (!imageFiles || imageFiles.length === 0) {
      return [];
    }

    const uploadPromises = imageFiles.map((file) =>
      uploadImageToCloudinary(file, folder)
    );
    const urls = await Promise.all(uploadPromises);

    return urls.filter((url) => url !== null);
  } catch (error) {
    console.error("[uploadMultipleImagesToCloudinary] Error:", error);
    throw error;
  }
}
