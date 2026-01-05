/**
 * Validation utilities cho toàn bộ ứng dụng
 * Import: import { validateFieldName, validateComplexData, ... } from '@/shared/utils/validations';
 */

// ==================== FIELD VALIDATIONS ====================

/**
 * Validate tên (sân, khu sân, etc.)
 */
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

/**
 * Validate giá sân
 */
export const validateFieldPrice = (price) => {
  const numPrice = Number(price);
  if (isNaN(numPrice) || price === "" || price === null || price === undefined) {
    return { isValid: false, message: "Vui lòng nhập giá sân" };
  }
  if (numPrice <= 0) {
    return { isValid: false, message: "Giá sân phải lớn hơn 0" };
  }
  if (numPrice < 10000) {
    return { isValid: false, message: "Giá sân tối thiểu 10,000 VND" };
  }
  if (numPrice > 10000000) {
    return { isValid: false, message: "Giá sân tối đa 10,000,000 VND" };
  }
  return { isValid: true, message: "" };
};

/**
 * Validate kích thước sân
 */
export const validateFieldSize = (size) => {
  if (!size || size.trim() === "") {
    return { isValid: true, message: "" };
  }
  const sizeRegex = /^\d+(\.\d+)?\s*[xX×]\s*\d+(\.\d+)?\s*m?$/;
  if (!sizeRegex.test(size.trim())) {
    return { isValid: false, message: "Kích thước không hợp lệ (VD: 20x40m)" };
  }
  return { isValid: true, message: "" };
};

/**
 * Validate địa chỉ
 */
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

/**
 * Validate toàn bộ dữ liệu khu sân (Complex)
 */
export const validateComplexData = (data, isEdit = false) => {
  const errors = {};

  const nameValidation = validateFieldName(data.name, "Tên khu sân");
  if (!nameValidation.isValid) {
    errors.name = nameValidation.message;
  }

  const addressValidation = validateAddress(data.address);
  if (!addressValidation.isValid) {
    errors.address = addressValidation.message;
  }

  if (!isEdit && !data.imageFile && !data.imageUrl && !data.image) {
    errors.image = "Vui lòng chọn hình ảnh cho khu sân";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate toàn bộ dữ liệu sân nhỏ (Field)
 */
export const validateFieldData = (data, isEdit = false) => {
  const errors = {};

  if (!data.complexId) {
    errors.complexId = "Vui lòng chọn khu sân";
  }

  const nameValidation = validateFieldName(data.name, "Tên sân");
  if (!nameValidation.isValid) {
    errors.name = nameValidation.message;
  }

  if (!data.typeId) {
    errors.typeId = "Vui lòng chọn loại sân";
  }

  const priceValidation = validateFieldPrice(data.pricePerHour);
  if (!priceValidation.isValid) {
    errors.pricePerHour = priceValidation.message;
  }

  if (!isEdit && !data.mainImage) {
    errors.mainImage = "Vui lòng chọn ảnh chính cho sân";
  }

  if (!data.bankAccountId) {
    errors.bankAccountId = "Vui lòng chọn tài khoản ngân hàng";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// ==================== BOOKING VALIDATIONS ====================

/**
 * Validate lý do hủy booking
 */
export const validateCancelReason = (reason) => {
  const trimmedReason = reason?.trim() || "";
  if (!trimmedReason) {
    return { isValid: false, message: "Vui lòng nhập lý do hủy" };
  }
  if (trimmedReason.length < 5) {
    return { isValid: false, message: "Lý do hủy phải có ít nhất 5 ký tự" };
  }
  return { isValid: true, message: "" };
};

/**
 * Validate booking ID
 */
export const validateBookingId = (bookingId) => {
  const numericId = Number(bookingId);
  if (isNaN(numericId) || numericId <= 0) {
    return { isValid: false, message: "Booking ID không hợp lệ" };
  }
  return { isValid: true, message: "" };
};

// ==================== COMMON VALIDATIONS ====================

/**
 * Validate email
 */
export const validateEmail = (email) => {
  const trimmedEmail = email?.trim() || "";
  if (!trimmedEmail) {
    return { isValid: false, message: "Vui lòng nhập email" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, message: "Email không hợp lệ" };
  }
  return { isValid: true, message: "" };
};

/**
 * Validate số điện thoại Việt Nam
 */
export const validatePhone = (phone) => {
  const trimmedPhone = phone?.trim() || "";
  if (!trimmedPhone) {
    return { isValid: false, message: "Vui lòng nhập số điện thoại" };
  }
  const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
  if (!phoneRegex.test(trimmedPhone.replace(/\s/g, ""))) {
    return { isValid: false, message: "Số điện thoại không hợp lệ" };
  }
  return { isValid: true, message: "" };
};

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName = "Trường này") => {
  const trimmedValue = typeof value === "string" ? value.trim() : value;
  if (!trimmedValue && trimmedValue !== 0) {
    return { isValid: false, message: `${fieldName} không được để trống` };
  }
  return { isValid: true, message: "" };
};

/**
 * Validate độ dài tối thiểu
 */
export const validateMinLength = (value, minLength, fieldName = "Trường này") => {
  const trimmedValue = value?.trim() || "";
  if (trimmedValue.length < minLength) {
    return { isValid: false, message: `${fieldName} phải có ít nhất ${minLength} ký tự` };
  }
  return { isValid: true, message: "" };
};

/**
 * Validate độ dài tối đa
 */
export const validateMaxLength = (value, maxLength, fieldName = "Trường này") => {
  const trimmedValue = value?.trim() || "";
  if (trimmedValue.length > maxLength) {
    return { isValid: false, message: `${fieldName} không được quá ${maxLength} ký tự` };
  }
  return { isValid: true, message: "" };
};

// ==================== BANK ACCOUNT VALIDATIONS ====================

/**
 * Validate số tài khoản ngân hàng
 */
export const validateBankAccountNumber = (accountNumber) => {
  const trimmed = accountNumber?.trim() || "";
  if (!trimmed) {
    return { isValid: false, message: "Vui lòng nhập số tài khoản" };
  }
  if (!/^\d{6,20}$/.test(trimmed)) {
    return { isValid: false, message: "Số tài khoản phải từ 6-20 chữ số" };
  }
  return { isValid: true, message: "" };
};

/**
 * Validate tên chủ tài khoản
 */
export const validateAccountHolder = (name) => {
  const trimmed = name?.trim() || "";
  if (!trimmed) {
    return { isValid: false, message: "Vui lòng nhập tên chủ tài khoản" };
  }
  if (trimmed.length < 3) {
    return { isValid: false, message: "Tên chủ tài khoản phải có ít nhất 3 ký tự" };
  }
  return { isValid: true, message: "" };
};
