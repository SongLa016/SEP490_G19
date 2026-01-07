using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;
using Moq;
using Microsoft.EntityFrameworkCore;
using BallSport.Application.Services;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using BallSport.Infrastructure.Data;

public class ManageUsersTest
{
    private readonly Mock<UserRepositories> _mockUserRepo;
    private readonly UserService _userService;

    public ManageUsersTest()
    {
        // 1. Setup Dummy Context cho Repo
        var options = new DbContextOptionsBuilder<Sep490G19v1Context>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var dummyContext = new Sep490G19v1Context(options);

        // 2. Mock Repository
        _mockUserRepo = new Mock<UserRepositories>(dummyContext);

        // 3. Init Service (Truyền null cho các service không dùng đến)
        _userService = new UserService(
            _mockUserRepo.Object,
            null, // Jwt
            null, // Email
            null, // OTP
            null, // Cache
            null  // Cloudinary
        );
    }

    // =========================================================================
    // TEST CASE 1: New user account created successfully
    // =========================================================================
    [Fact]
    public async Task CreateUserByAdminAsync_ShouldReturnUser_WhenDataIsValid()
    {
        // Arrange
        var newUser = new User { Email = "new@test.com", Phone = "0123456789", FullName = "New User" };
        var roleName = "Player";
        var role = new Role { RoleId = 1, RoleName = roleName };

        // Mock: Email/Phone chưa tồn tại
        _mockUserRepo.Setup(x => x.IsEmailExists(newUser.Email)).Returns(false);
        _mockUserRepo.Setup(x => x.IsPhoneExists(newUser.Phone)).Returns(false);
        _mockUserRepo.Setup(x => x.GetRoleByName(roleName)).Returns(role);

        // Act
        var result = await _userService.CreateUserByAdminAsync(newUser, roleName);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Active", result.Status);

        // Verify đã gọi hàm lưu xuống DB
        _mockUserRepo.Verify(x => x.AddUser(newUser), Times.Once);
        _mockUserRepo.Verify(x => x.AddUserRole(newUser.UserId, role.RoleId), Times.Once);
    }

    // =========================================================================
    // TEST CASE 2: User account information updated successfully
    // =========================================================================
    [Fact]
    public async Task UpdateUserByAdminAsync_ShouldReturnTrue_WhenUserExists()
    {
        // Arrange
        int userId = 1;
        var existingUser = new User { UserId = userId, FullName = "Old Name", Phone = "000" };

        _mockUserRepo.Setup(x => x.GetByIdAsync(userId))
            .ReturnsAsync(existingUser);

        // Act
        var result = await _userService.UpdateUserByAdminAsync(userId, "New Name", "111");

        // Assert
        Assert.True(result);
        Assert.Equal("New Name", existingUser.FullName); // Kiểm tra xem object đã đổi chưa
        Assert.Equal("111", existingUser.Phone);

        // Verify gọi hàm Update
        _mockUserRepo.Verify(x => x.UpdateUser(existingUser), Times.Once);
    }

    // =========================================================================
    // TEST CASE 3: User account has been successfully locked
    // =========================================================================
    [Fact]
    public async Task LockUserAsync_ShouldUpdateStatus_WhenPermissionIsGranted()
    {
        // Arrange
        int targetUserId = 2;
        string currentAdminRole = "Admin";

        // User bình thường (Player) thì Admin có quyền khóa
        var targetUser = new User { UserId = targetUserId, Status = "Active" };

        _mockUserRepo.Setup(x => x.GetByIdAsync(targetUserId)).ReturnsAsync(targetUser);
        _mockUserRepo.Setup(x => x.GetRolesByUserId(targetUserId)).Returns(new List<string> { "Player" });

        // Act
        var result = await _userService.LockUserAsync(targetUserId, currentAdminRole);

        // Assert
        Assert.True(result);
        Assert.Equal("Locked", targetUser.Status);
        _mockUserRepo.Verify(x => x.UpdateUser(targetUser), Times.Once);
    }

    // =========================================================================
    // TEST CASE 4: Update account does not exist
    // =========================================================================
    [Fact]
    public async Task UpdateUserByAdminAsync_ShouldThrowException_WhenUserNotFound()
    {
        // Arrange
        int nonExistentId = 999;

        _mockUserRepo.Setup(x => x.GetByIdAsync(nonExistentId))
            .ReturnsAsync((User?)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<Exception>(() =>
            _userService.UpdateUserByAdminAsync(nonExistentId, "Name", "Phone"));

        Assert.Equal("User not found.", ex.Message);

        // Verify không bao giờ gọi Update
        _mockUserRepo.Verify(x => x.UpdateUser(It.IsAny<User>()), Times.Never);
    }

    // =========================================================================
    // TEST CASE 5: Admin does not have the right to manage the account
    // =========================================================================
    [Fact]
    public async Task LockUserAsync_ShouldThrowUnauthorized_WhenAdminTriesToLockSuperAdmin()
    {
        // Arrange
        int superAdminId = 10;
        string currentRole = "Admin"; // Admin thường

        var superAdminUser = new User { UserId = superAdminId, Status = "Active" };

        _mockUserRepo.Setup(x => x.GetByIdAsync(superAdminId)).ReturnsAsync(superAdminUser);

        // Giả lập target user có role là SuperAdmin
        _mockUserRepo.Setup(x => x.GetRolesByUserId(superAdminId))
            .Returns(new List<string> { "SuperAdmin" });

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _userService.LockUserAsync(superAdminId, currentRole));

        Assert.Equal("Bạn không có quyền khóa tài khoản SuperAdmin.", ex.Message);

        // Đảm bảo không gọi update xuống DB
        _mockUserRepo.Verify(x => x.UpdateUser(It.IsAny<User>()), Times.Never);
    }
}