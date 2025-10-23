// Service for managing cancellation policies
// Mock data for cancellation policies

const CANCELLATION_POLICIES = [
  {
    PolicyID: 1,
    OwnerID: 1,
    ComplexID: 101,
    Name: "Chính sách hủy tiêu chuẩn",
    Description: "Hủy trước 24h miễn phí, sau đó tính phí 50%",
    FreeCancellationHours: 24,
    CancellationFeePercentage: 50,
    IsActive: true,
    CreatedAt: "2024-01-01T00:00:00Z",
    UpdatedAt: "2024-01-01T00:00:00Z",
  },
  {
    PolicyID: 2,
    OwnerID: 2,
    ComplexID: 102,
    Name: "Chính sách hủy linh hoạt",
    Description: "Hủy trước 12h miễn phí, sau đó tính phí 30%",
    FreeCancellationHours: 12,
    CancellationFeePercentage: 30,
    IsActive: true,
    CreatedAt: "2024-01-02T00:00:00Z",
    UpdatedAt: "2024-01-02T00:00:00Z",
  },
  {
    PolicyID: 3,
    OwnerID: 2,
    ComplexID: 103,
    Name: "Chính sách hủy nghiêm ngặt",
    Description: "Hủy trước 48h miễn phí, sau đó tính phí 70%",
    FreeCancellationHours: 48,
    CancellationFeePercentage: 70,
    IsActive: true,
    CreatedAt: "2024-01-03T00:00:00Z",
    UpdatedAt: "2024-01-03T00:00:00Z",
  },
  {
    PolicyID: 4,
    OwnerID: 2,
    ComplexID: 104,
    Name: "Chính sách hủy thân thiện",
    Description: "Hủy trước 6h miễn phí, sau đó tính phí 20%",
    FreeCancellationHours: 6,
    CancellationFeePercentage: 20,
    IsActive: true,
    CreatedAt: "2024-01-04T00:00:00Z",
    UpdatedAt: "2024-01-04T00:00:00Z",
  },
  {
    PolicyID: 5,
    OwnerID: 2,
    ComplexID: 105,
    Name: "Chính sách hủy cân bằng",
    Description: "Hủy trước 18h miễn phí, sau đó tính phí 40%",
    FreeCancellationHours: 18,
    CancellationFeePercentage: 40,
    IsActive: true,
    CreatedAt: "2024-01-05T00:00:00Z",
    UpdatedAt: "2024-01-05T00:00:00Z",
  },
];

// Helper functions
function findPolicy(policyId) {
  return CANCELLATION_POLICIES.find((p) => p.PolicyID === Number(policyId));
}

function findPoliciesByOwner(ownerId) {
  return CANCELLATION_POLICIES.filter((p) => p.OwnerID === Number(ownerId));
}

function findPolicyByComplex(complexId) {
  return CANCELLATION_POLICIES.find(
    (p) => p.ComplexID === Number(complexId) && p.IsActive
  );
}

// API functions
export async function fetchCancellationPolicies(ownerId) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const policies = findPoliciesByOwner(ownerId);
  return policies.map((policy) => ({
    policyId: policy.PolicyID,
    complexId: policy.ComplexID,
    name: policy.Name,
    description: policy.Description,
    freeCancellationHours: policy.FreeCancellationHours,
    cancellationFeePercentage: policy.CancellationFeePercentage,
    isActive: policy.IsActive,
    createdAt: policy.CreatedAt,
    updatedAt: policy.UpdatedAt,
  }));
}

export async function fetchCancellationPolicy(policyId) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  const policy = findPolicy(policyId);
  if (!policy) return null;

  return {
    policyId: policy.PolicyID,
    ownerId: policy.OwnerID,
    complexId: policy.ComplexID,
    name: policy.Name,
    description: policy.Description,
    freeCancellationHours: policy.FreeCancellationHours,
    cancellationFeePercentage: policy.CancellationFeePercentage,
    isActive: policy.IsActive,
    createdAt: policy.CreatedAt,
    updatedAt: policy.UpdatedAt,
  };
}

export async function fetchCancellationPolicyByComplex(complexId) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  const policy = findPolicyByComplex(complexId);
  if (!policy) return null;

  return {
    policyId: policy.PolicyID,
    complexId: policy.ComplexID,
    name: policy.Name,
    description: policy.Description,
    freeCancellationHours: policy.FreeCancellationHours,
    cancellationFeePercentage: policy.CancellationFeePercentage,
    isActive: policy.IsActive,
  };
}

export async function createCancellationPolicy(policyData) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const newPolicy = {
    PolicyID: CANCELLATION_POLICIES.length + 1,
    OwnerID: policyData.ownerId,
    ComplexID: policyData.complexId,
    Name: policyData.name,
    Description: policyData.description,
    FreeCancellationHours: policyData.freeCancellationHours,
    CancellationFeePercentage: policyData.cancellationFeePercentage,
    IsActive: true,
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  };

  CANCELLATION_POLICIES.push(newPolicy);

  return {
    policyId: newPolicy.PolicyID,
    complexId: newPolicy.ComplexID,
    name: newPolicy.Name,
    description: newPolicy.Description,
    freeCancellationHours: newPolicy.FreeCancellationHours,
    cancellationFeePercentage: newPolicy.CancellationFeePercentage,
    isActive: newPolicy.IsActive,
    createdAt: newPolicy.CreatedAt,
    updatedAt: newPolicy.UpdatedAt,
  };
}

export async function updateCancellationPolicy(policyId, policyData) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const policyIndex = CANCELLATION_POLICIES.findIndex(
    (p) => p.PolicyID === Number(policyId)
  );
  if (policyIndex === -1) {
    throw new Error("Policy not found");
  }

  const updatedPolicy = {
    ...CANCELLATION_POLICIES[policyIndex],
    Name: policyData.name,
    Description: policyData.description,
    FreeCancellationHours: policyData.freeCancellationHours,
    CancellationFeePercentage: policyData.cancellationFeePercentage,
    IsActive:
      policyData.isActive !== undefined
        ? policyData.isActive
        : CANCELLATION_POLICIES[policyIndex].IsActive,
    UpdatedAt: new Date().toISOString(),
  };

  CANCELLATION_POLICIES[policyIndex] = updatedPolicy;

  return {
    policyId: updatedPolicy.PolicyID,
    complexId: updatedPolicy.ComplexID,
    name: updatedPolicy.Name,
    description: updatedPolicy.Description,
    freeCancellationHours: updatedPolicy.FreeCancellationHours,
    cancellationFeePercentage: updatedPolicy.CancellationFeePercentage,
    isActive: updatedPolicy.IsActive,
    createdAt: updatedPolicy.CreatedAt,
    updatedAt: updatedPolicy.UpdatedAt,
  };
}

export async function deleteCancellationPolicy(policyId) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const policyIndex = CANCELLATION_POLICIES.findIndex(
    (p) => p.PolicyID === Number(policyId)
  );
  if (policyIndex === -1) {
    throw new Error("Policy not found");
  }

  CANCELLATION_POLICIES.splice(policyIndex, 1);

  return { success: true };
}

// Calculate cancellation fee based on policy and booking details
export function calculateCancellationFee(
  policy,
  bookingAmount,
  hoursUntilBooking
) {
  if (!policy || !policy.isActive) {
    return { fee: 0, percentage: 0, isFree: true };
  }

  if (hoursUntilBooking >= policy.freeCancellationHours) {
    return { fee: 0, percentage: 0, isFree: true };
  }

  const fee = (bookingAmount * policy.cancellationFeePercentage) / 100;
  return {
    fee: fee,
    percentage: policy.cancellationFeePercentage,
    isFree: false,
  };
}
