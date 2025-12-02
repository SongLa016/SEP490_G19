// Mock data for owner registration requests
const OWNER_REGISTRATION_REQUESTS = [
  {
    id: 1,
    userId: 201,
    businessName: "Sân bóng đá Sao Mai",
    businessType: "Sports Complex",
    contactPerson: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0123456789",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    businessLicense: "BL001234567",
    taxCode: "TC001234567",
    description: "Sân bóng đá chất lượng cao với hệ thống chiếu sáng hiện đại",
    documents: [
      {
        name: "Giấy phép kinh doanh",
        url: "/documents/business-license-1.pdf",
        uploadedAt: "2024-01-15T10:00:00",
      },
      {
        name: "Chứng minh nhân dân",
        url: "/documents/id-card-1.pdf",
        uploadedAt: "2024-01-15T10:05:00",
      },
    ],
    status: "pending", // pending, approved, rejected
    submittedAt: "2024-01-15T10:00:00",
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    notes: "",
  },
  {
    id: 2,
    userId: 202,
    businessName: "Khu thể thao Hồng Hà",
    businessType: "Sports Complex",
    contactPerson: "Trần Thị B",
    email: "tranthib@example.com",
    phone: "0987654321",
    address: "456 Đường XYZ, Quận 2, TP.HCM",
    businessLicense: "BL002345678",
    taxCode: "TC002345678",
    description: "Khu thể thao đa năng với nhiều loại sân",
    documents: [
      {
        name: "Giấy phép kinh doanh",
        url: "/documents/business-license-2.pdf",
        uploadedAt: "2024-01-16T09:00:00",
      },
      {
        name: "Chứng minh nhân dân",
        url: "/documents/id-card-2.pdf",
        uploadedAt: "2024-01-16T09:05:00",
      },
      {
        name: "Giấy phép hoạt động",
        url: "/documents/operation-license-2.pdf",
        uploadedAt: "2024-01-16T09:10:00",
      },
    ],
    status: "pending",
    submittedAt: "2024-01-16T09:00:00",
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    notes: "",
  },
  {
    id: 3,
    userId: 203,
    businessName: "Sân tennis Cầu Giấy",
    businessType: "Tennis Court",
    contactPerson: "Lê Văn C",
    email: "levanc@example.com",
    phone: "0369852147",
    address: "789 Đường DEF, Quận Cầu Giấy, Hà Nội",
    businessLicense: "BL003456789",
    taxCode: "TC003456789",
    description: "Sân tennis chuyên nghiệp với hệ thống booking online",
    documents: [
      {
        name: "Giấy phép kinh doanh",
        url: "/documents/business-license-3.pdf",
        uploadedAt: "2024-01-10T14:00:00",
      },
      {
        name: "Chứng minh nhân dân",
        url: "/documents/id-card-3.pdf",
        uploadedAt: "2024-01-10T14:05:00",
      },
    ],
    status: "approved",
    submittedAt: "2024-01-10T14:00:00",
    reviewedAt: "2024-01-12T10:30:00",
    reviewedBy: 1, // Admin ID
    rejectionReason: null,
    notes: "Đã kiểm tra và phê duyệt. Tài liệu đầy đủ và hợp lệ.",
  },
  {
    id: 4,
    userId: 204,
    businessName: "Sân cầu lông Minh Khai",
    businessType: "Badminton Court",
    contactPerson: "Phạm Thị D",
    email: "phamthid@example.com",
    phone: "0741852963",
    address: "321 Đường GHI, Quận Hai Bà Trưng, Hà Nội",
    businessLicense: "BL004567890",
    taxCode: "TC004567890",
    description: "Sân cầu lông với hệ thống điều hòa và ánh sáng tốt",
    documents: [
      {
        name: "Giấy phép kinh doanh",
        url: "/documents/business-license-4.pdf",
        uploadedAt: "2024-01-08T11:00:00",
      },
    ],
    status: "rejected",
    submittedAt: "2024-01-08T11:00:00",
    reviewedAt: "2024-01-09T15:20:00",
    reviewedBy: 1, // Admin ID
    rejectionReason: "Thiếu chứng minh nhân dân và giấy phép hoạt động",
    notes: "Cần bổ sung đầy đủ tài liệu theo yêu cầu",
  },
];

// Helper functions
function findRequest(id) {
  return OWNER_REGISTRATION_REQUESTS.find((request) => request.id === id);
}

function findRequestsByStatus(status) {
  if (status === "all") {
    return OWNER_REGISTRATION_REQUESTS;
  }
  return OWNER_REGISTRATION_REQUESTS.filter(
    (request) => request.status === status
  );
}

function findRequestsByUser(userId) {
  return OWNER_REGISTRATION_REQUESTS.filter(
    (request) => request.userId === userId
  );
}

// API functions
export async function fetchOwnerRegistrationRequests(status = "all") {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  const requests = findRequestsByStatus(status);
  return requests.sort(
    (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
  );
}

export async function fetchOwnerRegistrationRequest(id) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 300));

  const request = findRequest(id);
  if (!request) {
    throw new Error("Không tìm thấy yêu cầu đăng ký");
  }
  return request;
}

export async function fetchOwnerRegistrationRequestsByUser(userId) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 300));

  return findRequestsByUser(userId);
}

export async function approveOwnerRegistrationRequest(id, adminId, notes = "") {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  const request = findRequest(id);
  if (!request) {
    throw new Error("Không tìm thấy yêu cầu đăng ký");
  }

  if (request.status !== "pending") {
    throw new Error("Yêu cầu đã được xử lý");
  }

  // Update request status
  request.status = "approved";
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = adminId;
  request.notes = notes;

  return request;
}

export async function rejectOwnerRegistrationRequest(
  id,
  adminId,
  rejectionReason,
  notes = ""
) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  const request = findRequest(id);
  if (!request) {
    throw new Error("Không tìm thấy yêu cầu đăng ký");
  }

  if (request.status !== "pending") {
    throw new Error("Yêu cầu đã được xử lý");
  }

  // Update request status
  request.status = "rejected";
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = adminId;
  request.rejectionReason = rejectionReason;
  request.notes = notes;

  return request;
}

export async function createOwnerRegistrationRequest(requestData) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  const newRequest = {
    id: OWNER_REGISTRATION_REQUESTS.length + 1,
    ...requestData,
    status: "pending",
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    notes: "",
  };

  OWNER_REGISTRATION_REQUESTS.unshift(newRequest);
  return newRequest;
}

export async function updateOwnerRegistrationRequest(id, updateData) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  const request = findRequest(id);
  if (!request) {
    throw new Error("Không tìm thấy yêu cầu đăng ký");
  }

  Object.assign(request, updateData);
  return request;
}

export async function deleteOwnerRegistrationRequest(id) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  const index = OWNER_REGISTRATION_REQUESTS.findIndex(
    (request) => request.id === id
  );
  if (index === -1) {
    throw new Error("Không tìm thấy yêu cầu đăng ký");
  }

  OWNER_REGISTRATION_REQUESTS.splice(index, 1);
  return { success: true };
}

export async function getOwnerRegistrationStats() {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 300));

  const total = OWNER_REGISTRATION_REQUESTS.length;
  const pending = OWNER_REGISTRATION_REQUESTS.filter(
    (r) => r.status === "pending"
  ).length;
  const approved = OWNER_REGISTRATION_REQUESTS.filter(
    (r) => r.status === "approved"
  ).length;
  const rejected = OWNER_REGISTRATION_REQUESTS.filter(
    (r) => r.status === "rejected"
  ).length;

  return {
    total,
    pending,
    approved,
    rejected,
  };
}
