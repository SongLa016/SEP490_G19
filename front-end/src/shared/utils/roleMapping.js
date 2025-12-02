/**
 * Role Mapping - Legacy compatibility layer
 * Sử dụng constants mới từ roles.js nhưng giữ backward compatibility
 * 
 * @deprecated - Nên sử dụng trực tiếp từ src/shared/constants/roles.js
 * File này được giữ lại để tương thích với code cũ
 */
import {
  getRoleById,
  getRoleByName,
  getRoleDisplayName,
  getRoleColor,
  isValidRoleId,
  isValidRoleName,
  getAllRoles,
} from "../constants/roles";

// Export với cùng interface như cũ để backward compatibility
export const roleMapping = {
  // RoleID to RoleName mapping
  getRoleName: (roleID) => {
    return getRoleById(roleID).name;
  },

  // RoleName to RoleID mapping
  getRoleID: (roleName) => {
    return getRoleByName(roleName).id;
  },

  // Get role display name in Vietnamese
  getRoleDisplayName: (roleID) => {
    return getRoleDisplayName(roleID);
  },

  // Get role color for UI
  getRoleColor: (roleID) => {
    return getRoleColor(roleID);
  },

  // Validate if roleID is valid
  isValidRoleID: (roleID) => {
    return isValidRoleId(roleID);
  },

  // Validate if roleName is valid
  isValidRoleName: (roleName) => {
    return isValidRoleName(roleName);
  },

  // Get all roles
  getAllRoles: () => {
    return getAllRoles();
  },
};

// Re-export new utilities for convenience
// Note: hasRole and hasAnyRole are NOT re-exported here to avoid conflict with authStore
// If you need the role-based hasRole/hasAnyRole, import directly from "../constants/roles"
export {
  getRoleById,
  getRoleByName,
  getRoleDisplayName,
  getRoleColor,
  isValidRoleId,
  isValidRoleName,
  getAllRoles,
  ROLES,
  isPlayer,
  isOwner,
  isAdmin,
  getDefaultPathForRole,
} from "../constants/roles";
