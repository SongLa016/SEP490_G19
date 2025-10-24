// Role mapping utility functions
export const roleMapping = {
  // RoleID to RoleName mapping
  getRoleName: (roleID) => {
    switch (roleID) {
      case 1:
        return "Player";
      case 2:
        return "Owner";
      case 3:
        return "Admin";
      default:
        return "Player";
    }
  },

  // RoleName to RoleID mapping
  getRoleID: (roleName) => {
    switch (roleName) {
      case "Player":
        return 1;
      case "Owner":
        return 2;
      case "Admin":
        return 3;
      default:
        return 1;
    }
  },

  // Get role display name in Vietnamese
  getRoleDisplayName: (roleID) => {
    switch (roleID) {
      case 1:
        return "Người chơi";
      case 2:
        return "Chủ sân";
      case 3:
        return "Quản trị viên";
      default:
        return "Người chơi";
    }
  },

  // Get role color for UI
  getRoleColor: (roleID) => {
    switch (roleID) {
      case 1:
        return "bg-blue-100 text-blue-800";
      case 2:
        return "bg-green-100 text-green-800";
      case 3:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  },

  // Validate if roleID is valid
  isValidRoleID: (roleID) => {
    return [1, 2, 3].includes(roleID);
  },

  // Validate if roleName is valid
  isValidRoleName: (roleName) => {
    return ["Player", "Owner", "Admin"].includes(roleName);
  },

  // Get all roles
  getAllRoles: () => {
    return [
      {
        id: 1,
        name: "Player",
        displayName: "Người chơi",
        color: "bg-blue-100 text-blue-800",
      },
      {
        id: 2,
        name: "Owner",
        displayName: "Chủ sân",
        color: "bg-green-100 text-green-800",
      },
      {
        id: 3,
        name: "Admin",
        displayName: "Quản trị viên",
        color: "bg-red-100 text-red-800",
      },
    ];
  },
};
