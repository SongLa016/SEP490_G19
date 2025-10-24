// Service for managing promotions and campaigns
// Mock data for promotions

const PROMOTIONS = [
  {
    PromotionID: 1,
    OwnerID: 1,
    ComplexID: 101,
    Name: "Giảm giá cuối tuần",
    Description: "Giảm giá đặc biệt cho các slot cuối tuần",
    Code: "WEEKEND20",
    Type: "percentage", // percentage, fixed_amount, free_hour
    Value: 20, // 20% hoặc số tiền cố định
    MinOrderAmount: 300000,
    MaxDiscountAmount: 100000,
    StartDate: "2024-01-01T00:00:00Z",
    EndDate: "2024-12-31T23:59:59Z",
    UsageLimit: 100,
    UsedCount: 15,
    IsActive: true,
    ApplicableSlots: [9, 10, 11], // Slot cuối tuần
    ApplicableDays: [6, 0], // Thứ 7, Chủ nhật
    CreatedAt: "2024-01-01T00:00:00Z",
    UpdatedAt: "2024-01-01T00:00:00Z",
  },
  {
    PromotionID: 2,
    OwnerID: 2,
    ComplexID: 102,
    Name: "Khuyến mãi sáng sớm",
    Description: "Giảm giá cho các slot sáng sớm",
    Code: "EARLY30",
    Type: "percentage",
    Value: 30,
    MinOrderAmount: 200000,
    MaxDiscountAmount: 50000,
    StartDate: "2024-01-01T00:00:00Z",
    EndDate: "2024-12-31T23:59:59Z",
    UsageLimit: 50,
    UsedCount: 8,
    IsActive: true,
    ApplicableSlots: [1, 2, 3], // Slot sáng sớm
    ApplicableDays: [1, 2, 3, 4, 5, 6, 0], // Tất cả ngày
    CreatedAt: "2024-01-02T00:00:00Z",
    UpdatedAt: "2024-01-02T00:00:00Z",
  },
  {
    PromotionID: 3,
    OwnerID: 2,
    ComplexID: 103,
    Name: "Giảm giá sinh nhật",
    Description: "Giảm giá đặc biệt cho khách hàng sinh nhật",
    Code: "BIRTHDAY50",
    Type: "fixed_amount",
    Value: 100000,
    MinOrderAmount: 500000,
    MaxDiscountAmount: 100000,
    StartDate: "2024-01-01T00:00:00Z",
    EndDate: "2024-12-31T23:59:59Z",
    UsageLimit: 20,
    UsedCount: 3,
    IsActive: true,
    ApplicableSlots: [], // Tất cả slot
    ApplicableDays: [1, 2, 3, 4, 5, 6, 0], // Tất cả ngày
    CreatedAt: "2024-01-03T00:00:00Z",
    UpdatedAt: "2024-01-03T00:00:00Z",
  },
  {
    PromotionID: 4,
    OwnerID: 2,
    ComplexID: 104,
    Name: "Khuyến mãi đặt nhiều",
    Description: "Giảm giá khi đặt từ 3 slot trở lên",
    Code: "MULTI15",
    Type: "percentage",
    Value: 15,
    MinOrderAmount: 600000,
    MaxDiscountAmount: 200000,
    StartDate: "2024-01-01T00:00:00Z",
    EndDate: "2024-12-31T23:59:59Z",
    UsageLimit: 30,
    UsedCount: 5,
    IsActive: true,
    ApplicableSlots: [], // Tất cả slot
    ApplicableDays: [1, 2, 3, 4, 5, 6, 0], // Tất cả ngày
    CreatedAt: "2024-01-04T00:00:00Z",
    UpdatedAt: "2024-01-04T00:00:00Z",
  },
  {
    PromotionID: 5,
    OwnerID: 2,
    ComplexID: 105,
    Name: "Giảm giá khách mới",
    Description: "Giảm giá cho khách hàng lần đầu đặt sân",
    Code: "NEWUSER25",
    Type: "percentage",
    Value: 25,
    MinOrderAmount: 300000,
    MaxDiscountAmount: 150000,
    StartDate: "2024-01-01T00:00:00Z",
    EndDate: "2024-12-31T23:59:59Z",
    UsageLimit: 100,
    UsedCount: 12,
    IsActive: true,
    ApplicableSlots: [], // Tất cả slot
    ApplicableDays: [1, 2, 3, 4, 5, 6, 0], // Tất cả ngày
    CreatedAt: "2024-01-05T00:00:00Z",
    UpdatedAt: "2024-01-05T00:00:00Z",
  },
  {
    PromotionID: 6,
    OwnerID: 1,
    ComplexID: 101,
    Name: "Khuyến mãi giờ vàng",
    Description: "Giảm giá cho slot giờ vàng (18:00-21:00)",
    Code: "GOLDEN20",
    Type: "percentage",
    Value: 20,
    MinOrderAmount: 400000,
    MaxDiscountAmount: 120000,
    StartDate: "2024-01-01T00:00:00Z",
    EndDate: "2024-12-31T23:59:59Z",
    UsageLimit: 80,
    UsedCount: 22,
    IsActive: true,
    ApplicableSlots: [9, 10], // Slot giờ vàng
    ApplicableDays: [1, 2, 3, 4, 5], // Thứ 2-6
    CreatedAt: "2024-01-06T00:00:00Z",
    UpdatedAt: "2024-01-06T00:00:00Z",
  },
  {
    PromotionID: 7,
    OwnerID: 2,
    ComplexID: 102,
    Name: "Khuyến mãi nhóm",
    Description: "Giảm giá khi đặt từ 2 slot trở lên",
    Code: "GROUP10",
    Type: "percentage",
    Value: 10,
    MinOrderAmount: 400000,
    MaxDiscountAmount: 80000,
    StartDate: "2024-01-01T00:00:00Z",
    EndDate: "2024-12-31T23:59:59Z",
    UsageLimit: 60,
    UsedCount: 18,
    IsActive: true,
    ApplicableSlots: [], // Tất cả slot
    ApplicableDays: [1, 2, 3, 4, 5, 6, 0], // Tất cả ngày
    CreatedAt: "2024-01-07T00:00:00Z",
    UpdatedAt: "2024-01-07T00:00:00Z",
  },
  {
    PromotionID: 8,
    OwnerID: 2,
    ComplexID: 103,
    Name: "Khuyến mãi tháng mới",
    Description: "Giảm giá đặc biệt đầu tháng",
    Code: "MONTHLY15",
    Type: "percentage",
    Value: 15,
    MinOrderAmount: 350000,
    MaxDiscountAmount: 100000,
    StartDate: "2024-01-01T00:00:00Z",
    EndDate: "2024-12-31T23:59:59Z",
    UsageLimit: 40,
    UsedCount: 7,
    IsActive: true,
    ApplicableSlots: [], // Tất cả slot
    ApplicableDays: [1, 2, 3, 4, 5, 6, 0], // Tất cả ngày
    CreatedAt: "2024-01-08T00:00:00Z",
    UpdatedAt: "2024-01-08T00:00:00Z",
  },
];

// Helper functions
function findPromotion(promotionId) {
  return PROMOTIONS.find((p) => p.PromotionID === Number(promotionId));
}

function findPromotionsByOwner(ownerId) {
  return PROMOTIONS.filter((p) => p.OwnerID === Number(ownerId));
}

function findPromotionsByComplex(complexId) {
  return PROMOTIONS.filter(
    (p) => p.ComplexID === Number(complexId) && p.IsActive
  );
}

function findPromotionByCode(code) {
  return PROMOTIONS.find((p) => p.Code === code && p.IsActive);
}

// API functions
export async function fetchPromotions(ownerId) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const promotions = findPromotionsByOwner(ownerId);
  return promotions.map((promotion) => ({
    promotionId: promotion.PromotionID,
    complexId: promotion.ComplexID,
    name: promotion.Name,
    description: promotion.Description,
    code: promotion.Code,
    type: promotion.Type,
    value: promotion.Value,
    minOrderAmount: promotion.MinOrderAmount,
    maxDiscountAmount: promotion.MaxDiscountAmount,
    startDate: promotion.StartDate,
    endDate: promotion.EndDate,
    usageLimit: promotion.UsageLimit,
    usedCount: promotion.UsedCount,
    isActive: promotion.IsActive,
    applicableSlots: promotion.ApplicableSlots,
    applicableDays: promotion.ApplicableDays,
    createdAt: promotion.CreatedAt,
    updatedAt: promotion.UpdatedAt,
  }));
}

export async function fetchPromotion(promotionId) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  const promotion = findPromotion(promotionId);
  if (!promotion) return null;

  return {
    promotionId: promotion.PromotionID,
    ownerId: promotion.OwnerID,
    complexId: promotion.ComplexID,
    name: promotion.Name,
    description: promotion.Description,
    code: promotion.Code,
    type: promotion.Type,
    value: promotion.Value,
    minOrderAmount: promotion.MinOrderAmount,
    maxDiscountAmount: promotion.MaxDiscountAmount,
    startDate: promotion.StartDate,
    endDate: promotion.EndDate,
    usageLimit: promotion.UsageLimit,
    usedCount: promotion.UsedCount,
    isActive: promotion.IsActive,
    applicableSlots: promotion.ApplicableSlots,
    applicableDays: promotion.ApplicableDays,
    createdAt: promotion.CreatedAt,
    updatedAt: promotion.UpdatedAt,
  };
}

export async function fetchPromotionsByComplex(complexId) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  const promotions = findPromotionsByComplex(complexId);
  return promotions.map((promotion) => ({
    promotionId: promotion.PromotionID,
    complexId: promotion.ComplexID,
    name: promotion.Name,
    description: promotion.Description,
    code: promotion.Code,
    type: promotion.Type,
    value: promotion.Value,
    minOrderAmount: promotion.MinOrderAmount,
    maxDiscountAmount: promotion.MaxDiscountAmount,
    startDate: promotion.StartDate,
    endDate: promotion.EndDate,
    usageLimit: promotion.UsageLimit,
    usedCount: promotion.UsedCount,
    isActive: promotion.IsActive,
    applicableSlots: promotion.ApplicableSlots,
    applicableDays: promotion.ApplicableDays,
  }));
}

export async function validatePromotionCode(
  code,
  complexId,
  slotId,
  dayOfWeek,
  orderAmount
) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const promotion = findPromotionByCode(code);
  if (!promotion) {
    return { valid: false, message: "Mã khuyến mãi không tồn tại" };
  }

  // Check if promotion is for this complex
  if (promotion.ComplexID !== Number(complexId)) {
    return { valid: false, message: "Mã khuyến mãi không áp dụng cho sân này" };
  }

  // Check if promotion is still active
  const now = new Date();
  const startDate = new Date(promotion.StartDate);
  const endDate = new Date(promotion.EndDate);

  if (now < startDate || now > endDate) {
    return { valid: false, message: "Mã khuyến mãi đã hết hạn" };
  }

  // Check usage limit
  if (promotion.UsedCount >= promotion.UsageLimit) {
    return { valid: false, message: "Mã khuyến mãi đã hết lượt sử dụng" };
  }

  // Check minimum order amount
  if (orderAmount < promotion.MinOrderAmount) {
    return {
      valid: false,
      message: `Đơn hàng tối thiểu ${promotion.MinOrderAmount.toLocaleString(
        "vi-VN"
      )} VNĐ`,
    };
  }

  // Check applicable slots
  if (
    promotion.ApplicableSlots.length > 0 &&
    !promotion.ApplicableSlots.includes(Number(slotId))
  ) {
    return {
      valid: false,
      message: "Mã khuyến mãi không áp dụng cho slot này",
    };
  }

  // Check applicable days (0=Sunday, 1=Monday, ..., 6=Saturday)
  if (
    promotion.ApplicableDays.length > 0 &&
    !promotion.ApplicableDays.includes(dayOfWeek)
  ) {
    return {
      valid: false,
      message: "Mã khuyến mãi không áp dụng cho ngày này",
    };
  }

  return { valid: true, promotion: promotion };
}

export async function createPromotion(promotionData) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const newPromotion = {
    PromotionID: PROMOTIONS.length + 1,
    OwnerID: promotionData.ownerId,
    ComplexID: promotionData.complexId,
    Name: promotionData.name,
    Description: promotionData.description,
    Code: promotionData.code,
    Type: promotionData.type,
    Value: promotionData.value,
    MinOrderAmount: promotionData.minOrderAmount,
    MaxDiscountAmount: promotionData.maxDiscountAmount,
    StartDate: promotionData.startDate,
    EndDate: promotionData.endDate,
    UsageLimit: promotionData.usageLimit,
    UsedCount: 0,
    IsActive: true,
    ApplicableSlots: promotionData.applicableSlots || [],
    ApplicableDays: promotionData.applicableDays || [],
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  };

  PROMOTIONS.push(newPromotion);

  return {
    promotionId: newPromotion.PromotionID,
    complexId: newPromotion.ComplexID,
    name: newPromotion.Name,
    description: newPromotion.Description,
    code: newPromotion.Code,
    type: newPromotion.Type,
    value: newPromotion.Value,
    minOrderAmount: newPromotion.MinOrderAmount,
    maxDiscountAmount: newPromotion.MaxDiscountAmount,
    startDate: newPromotion.StartDate,
    endDate: newPromotion.EndDate,
    usageLimit: newPromotion.UsageLimit,
    usedCount: newPromotion.UsedCount,
    isActive: newPromotion.IsActive,
    applicableSlots: newPromotion.ApplicableSlots,
    applicableDays: newPromotion.ApplicableDays,
    createdAt: newPromotion.CreatedAt,
    updatedAt: newPromotion.UpdatedAt,
  };
}

export async function updatePromotion(promotionId, promotionData) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const promotionIndex = PROMOTIONS.findIndex(
    (p) => p.PromotionID === Number(promotionId)
  );
  if (promotionIndex === -1) {
    throw new Error("Promotion not found");
  }

  const updatedPromotion = {
    ...PROMOTIONS[promotionIndex],
    Name: promotionData.name,
    Description: promotionData.description,
    Code: promotionData.code,
    Type: promotionData.type,
    Value: promotionData.value,
    MinOrderAmount: promotionData.minOrderAmount,
    MaxDiscountAmount: promotionData.maxDiscountAmount,
    StartDate: promotionData.startDate,
    EndDate: promotionData.endDate,
    UsageLimit: promotionData.usageLimit,
    IsActive:
      promotionData.isActive !== undefined
        ? promotionData.isActive
        : PROMOTIONS[promotionIndex].IsActive,
    ApplicableSlots:
      promotionData.applicableSlots ||
      PROMOTIONS[promotionIndex].ApplicableSlots,
    ApplicableDays:
      promotionData.applicableDays || PROMOTIONS[promotionIndex].ApplicableDays,
    UpdatedAt: new Date().toISOString(),
  };

  PROMOTIONS[promotionIndex] = updatedPromotion;

  return {
    promotionId: updatedPromotion.PromotionID,
    complexId: updatedPromotion.ComplexID,
    name: updatedPromotion.Name,
    description: updatedPromotion.Description,
    code: updatedPromotion.Code,
    type: updatedPromotion.Type,
    value: updatedPromotion.Value,
    minOrderAmount: updatedPromotion.MinOrderAmount,
    maxDiscountAmount: updatedPromotion.MaxDiscountAmount,
    startDate: updatedPromotion.StartDate,
    endDate: updatedPromotion.EndDate,
    usageLimit: updatedPromotion.UsageLimit,
    usedCount: updatedPromotion.UsedCount,
    isActive: updatedPromotion.IsActive,
    applicableSlots: updatedPromotion.ApplicableSlots,
    applicableDays: updatedPromotion.ApplicableDays,
    createdAt: updatedPromotion.CreatedAt,
    updatedAt: updatedPromotion.UpdatedAt,
  };
}

export async function deletePromotion(promotionId) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const promotionIndex = PROMOTIONS.findIndex(
    (p) => p.PromotionID === Number(promotionId)
  );
  if (promotionIndex === -1) {
    throw new Error("Promotion not found");
  }

  PROMOTIONS.splice(promotionIndex, 1);

  return { success: true };
}

// Calculate discount amount based on promotion and order details
export function calculateDiscountAmount(promotion, orderAmount) {
  if (!promotion || !promotion.isActive) {
    return { discountAmount: 0, finalAmount: orderAmount };
  }

  let discountAmount = 0;

  if (promotion.type === "percentage") {
    discountAmount = (orderAmount * promotion.value) / 100;
    // Apply maximum discount limit
    if (
      promotion.maxDiscountAmount &&
      discountAmount > promotion.maxDiscountAmount
    ) {
      discountAmount = promotion.maxDiscountAmount;
    }
  } else if (promotion.type === "fixed_amount") {
    discountAmount = promotion.value;
  }

  const finalAmount = Math.max(0, orderAmount - discountAmount);

  return {
    discountAmount: discountAmount,
    finalAmount: finalAmount,
    discountPercentage: promotion.type === "percentage" ? promotion.value : 0,
  };
}
