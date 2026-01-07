using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;
using Moq;
using Microsoft.EntityFrameworkCore;
// Namespace của bạn
using BallSport.Application.Services;
using BallSport.Application.DTOs.StatisticPlayer;
using BallSport.Infrastructure.Repositories;
using BallSport.Infrastructure.Data;

public class PlayerStatisticServiceTests
{
    private readonly Mock<PlayRepository> _mockRepo;
    private readonly PlayerStatisticService _service;

    public PlayerStatisticServiceTests()
    {
        // 1. Tạo Dummy Context (Vì PlayRepository cần Context trong Constructor)
        var options = new DbContextOptionsBuilder<Sep490G19v1Context>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dummyContext = new Sep490G19v1Context(options);

        // 2. Mock Repository
        // Truyền dummyContext vào để thỏa mãn Constructor của PlayRepository
        _mockRepo = new Mock<PlayRepository>(dummyContext);

        // 3. Khởi tạo Service với Mock Repo
        _service = new PlayerStatisticService(_mockRepo.Object);
    }

    // ==========================================================
    // TEST CASE 1: Get Total Bookings Success
    // ==========================================================
    [Fact]
    public async Task GetTotalBookingsAsync_ShouldReturnCount_WhenRepoReturnsValue()
    {
        // Arrange
        int userId = 1;
        int expectedCount = 10;

        // Giả lập Repo trả về 10
        _mockRepo.Setup(x => x.GetTotalBookingsAsync(userId))
            .ReturnsAsync(expectedCount);

        // Act
        var result = await _service.GetTotalBookingsAsync(userId);

        // Assert
        Assert.Equal(expectedCount, result);
        _mockRepo.Verify(x => x.GetTotalBookingsAsync(userId), Times.Once);
    }

    // ==========================================================
    // TEST CASE 2: Get Total Playing Hours Success (Mapping DTO)
    // ==========================================================
    [Fact]
    public async Task GetTotalPlayingHoursAsync_ShouldReturnDto_WithCorrectValue()
    {
        // Arrange
        int userId = 1;
        double hours = 5.5;

        _mockRepo.Setup(x => x.GetTotalPlayingHoursAsync(userId))
            .ReturnsAsync(hours);

        // Act
        var result = await _service.GetTotalPlayingHoursAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<PlayerStatsDto>(result); // Kiểm tra đúng kiểu DTO
        Assert.Equal(hours, result.TotalPlayingHours);
    }

    // ==========================================================
    // TEST CASE 3: Get Total Spending Success (Mapping DTO)
    // ==========================================================
    [Fact]
    public async Task GetTotalSpendingAsync_ShouldReturnDto_WithCorrectValue()
    {
        // Arrange
        int userId = 1;
        decimal spending = 500000m;

        _mockRepo.Setup(x => x.GetTotalSpendingAsync(userId))
            .ReturnsAsync(spending);

        // Act
        var result = await _service.GetTotalSpendingAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<PlayerSpendingDTO>(result);
        Assert.Equal(spending, result.TotalSpending);
    }

    // ==========================================================
    // TEST CASE 4: Get Monthly Stats Success (List Mapping)
    // ==========================================================
    [Fact]
    public async Task GetMonthlyStatsAsync_ShouldReturnMappedList_WhenDataExists()
    {
        // Arrange
        int userId = 1;

        // Tạo dữ liệu giả trả về từ Repository
        // Lưu ý: Class MonthlyPlayerStatsDto này nằm trong PlayRepository (Infrastructure)
        var repoData = new List<PlayRepository.MonthlyPlayerStatsDto>
        {
            new PlayRepository.MonthlyPlayerStatsDto
            {
                Month = 5, TotalBookings = 2, TotalPlayingHours = 4, TotalSpending = 200000
            },
            new PlayRepository.MonthlyPlayerStatsDto
            {
                Month = 6, TotalBookings = 1, TotalPlayingHours = 1, TotalSpending = 100000
            }
        };

        _mockRepo.Setup(x => x.GetMonthlyStatsAsync(userId))
            .ReturnsAsync(repoData);

        // Act
        var result = await _service.GetMonthlyStatsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);

        // Kiểm tra mapping
        Assert.Equal(5, result[0].Month);
        Assert.Equal(200000, result[0].TotalSpending);

        // Kiểm tra kiểu dữ liệu trả về phải là DTO của Application
        Assert.IsType<List<MonthlyPlayerStatsDto>>(result);
    }

    // ==========================================================
    // TEST CASE 5: Get Monthly Stats Empty
    // ==========================================================
    [Fact]
    public async Task GetMonthlyStatsAsync_ShouldReturnEmptyList_WhenRepoReturnsEmpty()
    {
        // Arrange
        int userId = 1;
        _mockRepo.Setup(x => x.GetMonthlyStatsAsync(userId))
            .ReturnsAsync(new List<PlayRepository.MonthlyPlayerStatsDto>());

        // Act
        var result = await _service.GetMonthlyStatsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    // ==========================================================
    // TEST CASE 6: Get Average Rating
    // ==========================================================
    [Fact]
    public async Task GetAverageRatingAsync_ShouldReturnRating_WhenUserHasRatings()
    {
        // Arrange
        int userId = 1;
        double avgStars = 4.5;

        _mockRepo.Setup(x => x.GetAverageStarsByUserAsync(userId))
            .ReturnsAsync(avgStars);

        // Act
        var result = await _service.GetAverageRatingAsync(userId);

        // Assert
        Assert.Equal(avgStars, result);
    }

    // ==========================================================
    // TEST CASE 7: Error Handling (Database Fail)
    // ==========================================================
    [Fact]
    public async Task GetTotalBookingsAsync_ShouldThrowException_WhenRepoFails()
    {
        // Arrange
        int userId = 1;
        _mockRepo.Setup(x => x.GetTotalBookingsAsync(userId))
            .ThrowsAsync(new Exception("DB Connection Timeout"));

        // Act & Assert
        var ex = await Assert.ThrowsAsync<Exception>(() => _service.GetTotalBookingsAsync(userId));
        Assert.Equal("DB Connection Timeout", ex.Message);
    }
}