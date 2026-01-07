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

public class PlayerBookingServiceTests
{
    private readonly Mock<PlayRepository> _mockRepo;
    private readonly PlayerStatisticService _service;

    public PlayerBookingServiceTests()
    {
        var options = new DbContextOptionsBuilder<Sep490G19v1Context>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var dummyContext = new Sep490G19v1Context(options);

        // 2. Mock Repository
        // Chúng ta truyền dummyContext vào để thỏa mãn Constructor, nhưng Moq sẽ ghi đè logic bên trong
        _mockRepo = new Mock<PlayRepository>(dummyContext);

        // 3. Khởi tạo Service
        _service = new PlayerStatisticService(_mockRepo.Object);
    }

    // TEST CASE 1: Lấy tổng số booking thành công
    [Fact]
    public async Task GetTotalBookingsAsync_ShouldReturnCount_WhenRepoReturnsValue()
    {
        int userId = 1;
        int expectedCount = 50;
        _mockRepo.Setup(x => x.GetTotalBookingsAsync(userId))
            .ReturnsAsync(expectedCount);
        var result = await _service.GetTotalBookingsAsync(userId);
        Assert.Equal(expectedCount, result);
        _mockRepo.Verify(x => x.GetTotalBookingsAsync(userId), Times.Once);
    }

    // TEST CASE 2: Lấy tổng giờ chơi (Kiểm tra mapping sang DTO)
    [Fact]
    public async Task GetTotalPlayingHoursAsync_ShouldReturnDto_WithCorrectValue()
    {
        int userId = 1;
        double expectedHours = 12.5;

        // Giả lập Repo trả về 12.5 giờ
        _mockRepo.Setup(x => x.GetTotalPlayingHoursAsync(userId))
            .ReturnsAsync(expectedHours);

        var result = await _service.GetTotalPlayingHoursAsync(userId);

        Assert.NotNull(result);
        Assert.IsType<PlayerStatsDto>(result); // Kiểm tra đúng kiểu DTO
        Assert.Equal(expectedHours, result.TotalPlayingHours);
    }

    // TEST CASE 3: Lấy tổng tiền chi tiêu (Kiểm tra mapping sang DTO)
    [Fact]
    public async Task GetTotalSpendingAsync_ShouldReturnDto_WithCorrectValue()
    {
        int userId = 1;
        decimal expectedSpending = 5000000m;

        _mockRepo.Setup(x => x.GetTotalSpendingAsync(userId))
            .ReturnsAsync(expectedSpending);

        var result = await _service.GetTotalSpendingAsync(userId);

        Assert.NotNull(result);
        Assert.IsType<PlayerSpendingDTO>(result);
        Assert.Equal(expectedSpending, result.TotalSpending);
    }

    // TEST CASE 4: Lấy thống kê theo tháng (Kiểm tra mapping List DTO)
    [Fact]
    public async Task GetMonthlyStatsAsync_ShouldReturnMappedList_WhenDataExists()
    {
        int userId = 1;

        var repoData = new List<PlayRepository.MonthlyPlayerStatsDto>
        {
            new PlayRepository.MonthlyPlayerStatsDto
            {
                Month = 1, TotalBookings = 5, TotalPlayingHours = 10, TotalSpending = 500000
            },
            new PlayRepository.MonthlyPlayerStatsDto
            {
                Month = 2, TotalBookings = 3, TotalPlayingHours = 6, TotalSpending = 300000
            }
        };

        _mockRepo.Setup(x => x.GetMonthlyStatsAsync(userId))
            .ReturnsAsync(repoData);

        var result = await _service.GetMonthlyStatsAsync(userId);

        Assert.NotNull(result);
        Assert.Equal(2, result.Count);

        Assert.Equal(1, result[0].Month);
        Assert.Equal(500000, result[0].TotalSpending);
        Assert.Equal(2, result[1].Month);

        Assert.IsType<List<BallSport.Application.DTOs.StatisticPlayer.MonthlyPlayerStatsDto>>(result);
    }

    // TEST CASE 5: Lấy thống kê tháng trả về rỗng
    [Fact]
    public async Task GetMonthlyStatsAsync_ShouldReturnEmptyList_WhenRepoReturnsEmpty()
    {
        int userId = 1;
        _mockRepo.Setup(x => x.GetMonthlyStatsAsync(userId))
            .ReturnsAsync(new List<PlayRepository.MonthlyPlayerStatsDto>());

        var result = await _service.GetMonthlyStatsAsync(userId);
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    // TEST CASE 6: Lấy đánh giá trung bình
    [Fact]
    public async Task GetAverageRatingAsync_ShouldReturnRating_WhenUserHasRatings()
    {
        int userId = 1;
        double expectedRating = 4.8;

        _mockRepo.Setup(x => x.GetAverageStarsByUserAsync(userId))
            .ReturnsAsync(expectedRating);

        var result = await _service.GetAverageRatingAsync(userId);

        Assert.Equal(expectedRating, result);
    }

    // TEST CASE 7: Xử lý lỗi khi Database gặp sự cố
    [Fact]
    public async Task GetTotalBookingsAsync_ShouldThrowException_WhenRepoFails()
    {
        int userId = 1;
        _mockRepo.Setup(x => x.GetTotalBookingsAsync(userId))
            .ThrowsAsync(new Exception("Database Connection Error"));

        var ex = await Assert.ThrowsAsync<Exception>(() => _service.GetTotalBookingsAsync(userId));
        Assert.Equal("Database Connection Error", ex.Message);
    }
}