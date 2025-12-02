/**
 * Role Constants - Single source of truth for role management
 * Tập trung tất cả logic về roles tại đây để dễ quản lý và bảo trì
 */

export const ROLES = {
  PLAYER: {
    id: 1,
    name: "Player",
    displayName: "Người chơi",
    displayNameVi: "Người chơi",
    color: "bg-blue-100 text-blue-800",
    path: "/dashboard",
  },
  OWNER: {
    id: 2,
    name: "Owner",
    displayName: "Chủ sân",
    displayNameVi: "Chủ sân",
    color: "bg-green-100 text-green-800",
    path: "/owner",
  },
  ADMIN: {
    id: 3,
    name: "Admin",
    displayName: "Quản trị viên",
    displayNameVi: "Quản trị viên",
    color: "bg-red-100 text-red-800",
    path: "/admin",
  },
};

// Role mapping utilities
export const getRoleById = (roleId) => {
  return Object.values(ROLES).find((role) => role.id === roleId) || ROLES.PLAYER;
};

export const getRoleByName = (roleName) => {
  return Object.values(ROLES).find((role) => role.name === roleName) || ROLES.PLAYER;
};

export const getRoleDisplayName = (roleId) => {
  return getRoleById(roleId).displayNameVi;
};

export const getRoleColor = (roleId) => {
  return getRoleById(roleId).color;
};

export const isValidRoleId = (roleId) => {
  return Object.values(ROLES).some((role) => role.id === roleId);
};

export const isValidRoleName = (roleName) => {
  return Object.values(ROLES).some((role) => role.name === roleName);
};

export const getAllRoles = () => {
  return Object.values(ROLES);
};

// Role checking helpers
export const isPlayer = (user) => {
  return user?.roleName === ROLES.PLAYER.name || user?.roleID === ROLES.PLAYER.id;
};

export const isOwner = (user) => {
  return user?.roleName === ROLES.OWNER.name || user?.roleID === ROLES.OWNER.id;
};

export const isAdmin = (user) => {
  return user?.roleName === ROLES.ADMIN.name || user?.roleID === ROLES.ADMIN.id;
};

export const hasRole = (user, roleName) => {
  if (!user) return false;
  return user.roleName === roleName || getRoleByName(roleName)?.id === user.roleID;
};

export const hasAnyRole = (user, roleNames) => {
  if (!user) return false;
  return roleNames.some((roleName) => hasRole(user, roleName));
};

// Get user's default redirect path based on role
export const getDefaultPathForRole = (user) => {
  if (!user) return "/auth";
  const role = getRoleByName(user.roleName);
  return role?.path || "/dashboard";
};

