// Simple localStorage-based auth and OTP store (no backend)

const USERS_KEY = "users";
const SESSION_KEY = "session_user";

function generateId() {
  return "u_" + Math.random().toString(36).slice(2, 10);
}

export function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

export function findUserByEmail(email) {
  const users = getUsers();
  return users.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase()
  );
}

export function findUserByUsername(username) {
  const users = getUsers();
  return users.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );
}

function saveUser(updatedUser) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === updatedUser.id);
  if (idx >= 0) {
    users[idx] = updatedUser;
  } else {
    users.push(updatedUser);
  }
  saveUsers(users);
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function otpKey(email) {
  return `otp:${email.toLowerCase()}`;
}

export function createOtpForEmail(email) {
  const code = generateOtp();
  const payload = {
    code,
    createdAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  };
  localStorage.setItem(otpKey(email), JSON.stringify(payload));
  return code;
}

export function verifyOtpForEmail(email, code) {
  const raw = localStorage.getItem(otpKey(email));
  if (!raw) return { ok: false, reason: "OTP không tồn tại" };
  const data = JSON.parse(raw);
  if (Date.now() > data.expiresAt) return { ok: false, reason: "OTP hết hạn" };
  if (String(code) !== String(data.code))
    return { ok: false, reason: "OTP không đúng" };
  localStorage.removeItem(otpKey(email));
  return { ok: true };
}

export function registerUser({
  username,
  password,
  role,
  ownerDocs,
  name,
  phone,
  email,
}) {
  if (findUserByUsername(username)) {
    return { ok: false, reason: "Tên đăng nhập đã tồn tại" };
  }

  // Check email only if provided
  if (email && findUserByEmail(email)) {
    return { ok: false, reason: "Email đã tồn tại" };
  }

  const user = {
    id: generateId(),
    username,
    password, // For demo only (no hashing in mock)
    role:
      role === "FieldOwner"
        ? "FieldOwner"
        : role === "Admin"
        ? "Admin"
        : "User",
    status: "active", // Active immediately for username-based login
    ownerDocs: role === "FieldOwner" ? ownerDocs || null : null,
    name: name || null, // Optional name, can be added later in profile
    phone: phone || null,
    email: email || null, // Optional email
    emailVerified: false, // Email verification status
    avatar: null,
    createdAt: Date.now(),
  };
  saveUser(user);

  // Only create OTP if email is provided
  if (email) {
    const otp = createOtpForEmail(email);
    return { ok: true, user, otp, requiresEmailVerification: true };
  }

  return { ok: true, user, requiresEmailVerification: false };
}

export function completeRegistrationWithOtp({ email, code }) {
  const verify = verifyOtpForEmail(email, code);
  if (!verify.ok) return verify;
  const users = getUsers();
  const idx = users.findIndex(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (idx < 0) return { ok: false, reason: "Không tìm thấy người dùng" };
  const user = users[idx];
  if (user.role === "User") {
    user.status = "active";
  } else if (user.role === "FieldOwner") {
    user.status = "pending_admin";
  } else if (user.role === "Admin") {
    user.status = "active";
  }
  users[idx] = user;
  saveUsers(users);
  return { ok: true, user };
}

export function loginWithPassword({ username, password }) {
  const user = findUserByUsername(username);
  if (!user) return { ok: false, reason: "Sai tên đăng nhập hoặc mật khẩu" };
  if (user.password !== password)
    return { ok: false, reason: "Sai tên đăng nhập hoặc mật khẩu" };
  setCurrentUser(user);
  return { ok: true, user };
}

export function mockGoogleLogin({ email, name }) {
  // If user exists, login; else create as User active
  let user = findUserByEmail(email);
  if (!user) {
    const username = email.split("@")[0] + Math.floor(Math.random() * 1000);
    user = {
      id: generateId(),
      username,
      email,
      password: null,
      role: "User",
      status: "active",
      createdAt: Date.now(),
      name: name || email.split("@")[0],
      phone: null,
      emailVerified: true, // Google login is pre-verified
      avatar: null,
    };
    saveUser(user);
  }
  setCurrentUser(user);
  return { ok: true, user };
}

export async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function logout() {
  setCurrentUser(null);
}

// Demo users for testing
export function createDemoUsers() {
  const demoUsers = [
    {
      id: "demo_user_1",
      username: "demo",
      password: "123456",
      role: "User",
      status: "active",
      name: "Nguyễn Văn Demo",
      phone: "0123456789",
      email: "demo@example.com",
      emailVerified: true,
      avatar: null,
      createdAt: Date.now(),
    },
    {
      id: "demo_owner_1",
      username: "owner",
      password: "123456",
      role: "FieldOwner",
      status: "active",
      name: "Chủ sân Demo",
      phone: "0987654321",
      email: "owner@example.com",
      emailVerified: true,
      avatar: null,
      createdAt: Date.now(),
    },
    {
      id: "demo_admin_1",
      username: "admin",
      password: "123456",
      role: "Admin",
      status: "active",
      name: "Admin Demo",
      phone: "0111222333",
      email: "admin@example.com",
      emailVerified: true,
      avatar: null,
      createdAt: Date.now(),
    },
  ];

  // Check if demo users already exist
  const existingUsers = getUsers();
  const existingUsernames = existingUsers.map((u) => u.username);

  demoUsers.forEach((demoUser) => {
    if (!existingUsernames.includes(demoUser.username)) {
      existingUsers.push(demoUser);
    }
  });

  saveUsers(existingUsers);
  return demoUsers;
}

// Profile helpers
export function updateUserProfile({
  userId,
  name,
  phone,
  avatar,
  email,
  emailVerified,
}) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) return { ok: false, reason: "Không tìm thấy người dùng" };
  const user = users[idx];
  const updated = {
    ...user,
    name: name ?? user.name,
    phone: phone ?? user.phone,
    avatar: avatar ?? user.avatar,
    email: email ?? user.email,
    emailVerified: emailVerified ?? user.emailVerified,
  };
  users[idx] = updated;
  saveUsers(users);
  setCurrentUser(updated);
  return { ok: true, user: updated };
}

export function changePassword({ userId, oldPassword, newPassword }) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) return { ok: false, reason: "Không tìm thấy người dùng" };
  const user = users[idx];
  if (user.password && user.password !== oldPassword) {
    return { ok: false, reason: "Mật khẩu cũ không đúng" };
  }
  users[idx] = { ...user, password: newPassword };
  saveUsers(users);
  return { ok: true };
}

export function upgradeUserToFieldOwner({ userId, ownerDocs }) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) return { ok: false, reason: "Không tìm thấy người dùng" };
  const user = users[idx];
  user.role = "FieldOwner";
  user.ownerDocs = ownerDocs || null;
  user.status = "pending_admin";
  users[idx] = user;
  saveUsers(users);
  setCurrentUser(user);
  return { ok: true, user };
}

// Helper functions for role-based access
export function hasRole(user, requiredRole) {
  if (!user) return false;
  return user.role === requiredRole;
}

export function hasAnyRole(user, roles) {
  if (!user) return false;
  return roles.includes(user.role);
}

export function isActiveUser(user) {
  return user && user.status === "active";
}

export function canAccessFeature(user, feature) {
  if (!user) return false;

  const rolePermissions = {
    Visitor: [
      "view_home",
      "search_fields",
      "view_field_details",
      "view_schedule",
      "view_reviews",
      "view_blog",
      "register",
      "login",
    ],
    User: [
      "view_home",
      "search_fields",
      "view_field_details",
      "view_schedule",
      "view_reviews",
      "view_blog",
      "register",
      "login",
      "update_profile",
      "change_password",
      "verify_email",
      "view_booking_history",
      "book_field",
      "payment_online",
      "payment_qr",
      "cancel_booking",
      "reschedule_booking",
      "view_invoice",
      "recurring_booking",
      "rate_field",
      "report_issue",
      "community",
      "create_team",
      "find_opponent",
      "join_tournament",
      "chat_owner",
      "team_chat",
      "tournament_notifications",
      "find_teammate",
    ],
    FieldOwner: [
      "view_home",
      "search_fields",
      "view_field_details",
      "view_schedule",
      "view_reviews",
      "view_blog",
      "register",
      "login",
      "update_profile",
      "change_password",
      "verify_email",
      "personal_stats",
      "register_owner",
      "add_field",
      "upload_field_images",
      "set_pricing",
      "manage_schedule",
      "update_field_status",
      "view_bookings",
      "confirm_booking",
      "cancel_booking",
      "send_notifications",
      "revenue_report",
      "export_report",
      "cancellation_policy",
      "view_ratings",
      "respond_feedback",
      "create_event",
      "manage_payments",
      "track_payments",
      "revenue_dashboard",
      "manage_contact",
    ],
    Admin: [
      "view_home",
      "search_fields",
      "view_field_details",
      "view_schedule",
      "view_reviews",
      "view_blog",
      "register",
      "login",
      "update_profile",
      "change_password",
      "verify_email",
      "manage_users",
      "manage_field_owners",
      "manage_fields",
      "manage_reports",
      "manage_service_reports",
      "manage_tournaments",
      "manage_blog",
      "send_system_notifications",
      "manage_cancellation_policy",
      "manage_fees",
      "system_reports",
      "top_fields_report",
      "suspend_field",
    ],
  };

  const userRole = user.role;
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(feature);
}
