// hàm ánh xạ vai trò
import {
  getRoleById,
  getRoleByName,
  getRoleDisplayName,
  getRoleColor,
  isValidRoleId,
  isValidRoleName,
  getAllRoles,
} from "../constants/roles";

// ánh xạ vai trò
export const roleMapping = {
  // ánh xạ ID vai trò thành tên vai trò
  getRoleName: (roleID) => {
    return getRoleById(roleID).name;
  },

  // ánh xạ tên vai trò thành ID vai trò
  getRoleID: (roleName) => {
    return getRoleByName(roleName).id;
  },

  // lấy tên hiển thị vai trò
  getRoleDisplayName: (roleID) => {
    return getRoleDisplayName(roleID);
  },

  // lấy màu sắc vai trò
  getRoleColor: (roleID) => {
    return getRoleColor(roleID);
  },

  // kiểm tra nếu ID vai trò hợp lệ
  isValidRoleID: (roleID) => {
    return isValidRoleId(roleID);
  },

  // kiểm tra nếu tên vai trò hợp lệ
  isValidRoleName: (roleName) => {
    return isValidRoleName(roleName);
  },

  // lấy tất cả vai trò
  getAllRoles: () => {
    return getAllRoles();
  },
};

// ánh xạ vai trò
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
