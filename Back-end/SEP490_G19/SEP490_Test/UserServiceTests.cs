using System;
using System.Threading.Tasks;
using Xunit;
using Moq;
using Microsoft.EntityFrameworkCore;
using BallSport.Application.Services;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using BallSport.Infrastructure.Data;

public class UserServiceTests
{
    private readonly Mock<UserRepositories> _mockUserRepo;
    private readonly UserService _userService;

    public UserServiceTests()
    {
        var options = new DbContextOptionsBuilder<Sep490G19v1Context>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var dummyContext = new Sep490G19v1Context(options);

        _mockUserRepo = new Mock<UserRepositories>(dummyContext);

        _userService = new UserService(
            _mockUserRepo.Object,
            null, // JwtService
            null, // EmailService (Nguyên nhân gây lỗi cũ)
            null, // OTPService
            null, // IMemoryCache
            null  // ICloudinaryService
        );
    }

    // TEST CASE 1: User successfully viewed personal information
    [Fact]
    public async Task GetUserProfileAsync_ShouldReturnUser_WhenInfoIsComplete()
    {
        // Arrange
        int userId = 1;
        var expectedUser = new User
        {
            UserId = userId,
            FullName = "Nguyen Van A",
            Email = "a@email.com",
            Phone = "0909090909",
            Avatar = "avatar.jpg"
        };

        // Giả lập Repo trả về User
        _mockUserRepo.Setup(x => x.GetByIdAsync(userId))
            .ReturnsAsync(expectedUser);

        var result = await _userService.GetUserProfileAsync(userId);

        Assert.NotNull(result);
        Assert.Equal(userId, result.UserId);
        Assert.Equal("Nguyen Van A", result.FullName);
        Assert.Equal("avatar.jpg", result.Avatar);
    }

    // TEST CASE 2: User views profile without having fully updated information
    [Fact]
    public async Task GetUserProfileAsync_ShouldReturnUser_WhenInfoIsIncomplete()
    {
        int userId = 2;
        var incompleteUser = new User
        {
            UserId = userId,
            FullName = "Nguyen Van B",
            Email = "b@email.com",
            Phone = null,
            Avatar = null
        };

        _mockUserRepo.Setup(x => x.GetByIdAsync(userId))
            .ReturnsAsync(incompleteUser);

        // Act
        var result = await _userService.GetUserProfileAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Nguyen Van B", result.FullName);
        Assert.Null(result.Phone);  // Kiểm tra trường thiếu
        Assert.Null(result.Avatar); // Kiểm tra trường thiếu
    }

    // TEST CASE 3: User is not logged in to view the profile
    [Fact]
    public async Task GetUserProfileAsync_ShouldThrowUnauthorized_WhenUserIdIsInvalid()
    {
        // Giả sử userId <= 0 đại diện cho việc Token không hợp lệ hoặc chưa đăng nhập
        int invalidUserId = 0;

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _userService.GetUserProfileAsync(invalidUserId));

        Assert.Equal("Người dùng chưa đăng nhập.", ex.Message);

        _mockUserRepo.Verify(x => x.GetByIdAsync(It.IsAny<int>()), Times.Never);
    }

    // TEST CASE 4: UserId does not exist in the system
    [Fact]
    public async Task GetUserProfileAsync_ShouldReturnNull_WhenUserNotFound()
    {
        int nonExistentUserId = 999;
        _mockUserRepo.Setup(x => x.GetByIdAsync(nonExistentUserId))
            .ReturnsAsync((User?)null);
        var result = await _userService.GetUserProfileAsync(nonExistentUserId);

        // Assert
        Assert.Null(result);
    }

    // TEST CASE 5: Error when querying profile information from the database
    [Fact]
    public async Task GetUserProfileAsync_ShouldThrowException_WhenDatabaseFails()
    {
        int userId = 1;

        _mockUserRepo.Setup(x => x.GetByIdAsync(userId))
            .ThrowsAsync(new Exception("Database connection timeout"));

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            _userService.GetUserProfileAsync(userId));

        Assert.Equal("Database connection timeout", ex.Message);
    }
}