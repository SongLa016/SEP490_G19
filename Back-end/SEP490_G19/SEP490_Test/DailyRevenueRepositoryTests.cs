using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Moq;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories.StatisticOwner;

public class DailyRevenueRepositoryTests : IDisposable
{
    private readonly Sep490G19v1Context _context;
    private readonly DailyRevenueRepository _repo;

    public DailyRevenueRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<Sep490G19v1Context>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new Sep490G19v1Context(options);
        _repo = new DailyRevenueRepository(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    // TEST CASE 1: Owner views statistics for a valid time period (fromDate – toDate)
    [Fact]
    public async Task GetDailyRevenueAsync_ShouldReturnCorrectData_ForTimePeriodValidation()
    {
        // Arrange
        int ownerId = 1;

        // Tạo dữ liệu nền (Complex, Field...) - LƯU Ý: Phải có Name/Address để không lỗi DB
        var complex = new FieldComplex { ComplexId = 1, OwnerId = ownerId, Name = "Complex A", Address = "Address A" };
        var field = new Field { FieldId = 1, Complex = complex, Name = "Field A" };
        var schedule = new FieldSchedule { ScheduleId = 1, Field = field };

        // Giả lập khoảng thời gian muốn xem: 01/10/2023 -> 05/10/2023
        var dateWithinRange1 = new DateTime(2023, 10, 01);
        var dateWithinRange2 = new DateTime(2023, 10, 05);
        var dateOutsideRange = new DateTime(2023, 12, 01); // Ngày nằm ngoài

        var b1 = new Booking
        {
            BookingId = 1,
            Schedule = schedule,
            TotalPrice = 100,
            BookingStatus = "Completed",
            CreatedAt = dateWithinRange1
        };
        var b2 = new Booking
        {
            BookingId = 2,
            Schedule = schedule,
            TotalPrice = 200,
            BookingStatus = "Completed",
            CreatedAt = dateWithinRange2
        };
        var b3 = new Booking
        {
            BookingId = 3,
            Schedule = schedule,
            TotalPrice = 500,
            BookingStatus = "Completed",
            CreatedAt = dateOutsideRange
        };

        _context.FieldComplexes.Add(complex);
        _context.Fields.Add(field);
        _context.Bookings.AddRange(b1, b2, b3);
        await _context.SaveChangesAsync();

        var result = await _repo.GetDailyRevenueAsync(ownerId);

        // Logic lọc fromDate-toDate sẽ nằm ở tầng trên, ở đây ta đảm bảo Data tồn tại đúng ngày
        Assert.Contains(result, r => r.Date == dateWithinRange1 && r.TotalRevenue == 100);
        Assert.Contains(result, r => r.Date == dateWithinRange2 && r.TotalRevenue == 200);
        Assert.Contains(result, r => r.Date == dateOutsideRange);
    }

    // TEST CASE 2: Owner does not exist in the system
    [Fact]
    public async Task GetDailyRevenueAsync_ShouldReturnEmpty_WhenOwnerDoesNotExist()
    {
        int existOwner = 1;
        int notExistOwner = 999;

        // Tạo data cho Owner tồn tại để chứng minh code lọc đúng ID
        var complex = new FieldComplex { ComplexId = 1, OwnerId = existOwner, Name = "C1", Address = "A1" };
        var field = new Field { FieldId = 1, Complex = complex, Name = "F1" };
        var b1 = new Booking { BookingId = 1, Schedule = new FieldSchedule { Field = field }, BookingStatus = "Completed", TotalPrice = 100, CreatedAt = DateTime.Now };

        _context.FieldComplexes.Add(complex);
        _context.Fields.Add(field);
        _context.Bookings.Add(b1);
        await _context.SaveChangesAsync();

        var result = await _repo.GetDailyRevenueAsync(notExistOwner);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result); // Phải trả về list rỗng
    }

    // TEST CASE 3: Can connect with serverError when querying statistical data from the database
    [Fact]
    public async Task GetDailyRevenueAsync_ShouldThrowException_WhenDatabaseConnectionFails()
    {
        var mockContext = new Mock<Sep490G19v1Context>();

        mockContext.Setup(c => c.Bookings).Throws(new Exception("Database Connection Error"));

        var repoWithMock = new DailyRevenueRepository(mockContext.Object);
        int ownerId = 1;

        var ex = await Assert.ThrowsAsync<Exception>(() => repoWithMock.GetDailyRevenueAsync(ownerId));
        Assert.Equal("Database Connection Error", ex.Message);
    }

    // TEST CASE 4: Can connect with serverOwner views statistics when there is no data (no bookings)
    [Fact]
    public async Task GetDailyRevenueAsync_ShouldReturnEmpty_WhenOwnerHasNoBookings()
    {
        int ownerId = 1;

        // Owner có sân nhưng chưa có ai đặt
        var complex = new FieldComplex { ComplexId = 1, OwnerId = ownerId, Name = "C1", Address = "A1" };
        var field = new Field { FieldId = 1, Complex = complex, Name = "F1" };

        _context.FieldComplexes.Add(complex);
        _context.Fields.Add(field);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repo.GetDailyRevenueAsync(ownerId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    // TEST CASE 5: Owner views statistics & revenue success by day
    [Fact]
    public async Task GetDailyRevenueAsync_ShouldGroupAndSumRevenue_ByDayCorrectly()
    {
        int ownerId = 1;
        var complex = new FieldComplex { ComplexId = 1, OwnerId = ownerId, Name = "C1", Address = "A1" };
        var field = new Field { FieldId = 1, Complex = complex, Name = "F1" };
        var schedule = new FieldSchedule { ScheduleId = 1, Field = field };

        var today = DateTime.Now.Date;
        var tomorrow = DateTime.Now.Date.AddDays(1);

        // 2 Booking trong CÙNG 1 NGÀY (Hôm nay)
        var b1 = new Booking
        {
            BookingId = 1,
            Schedule = schedule,
            TotalPrice = 100000,
            BookingStatus = "Completed",
            CreatedAt = today.AddHours(9)
        };
        var b2 = new Booking
        {
            BookingId = 2,
            Schedule = schedule,
            TotalPrice = 200000,
            BookingStatus = "Completed",
            CreatedAt = today.AddHours(14)
        };

        // 1 Booking ngày mai
        var b3 = new Booking
        {
            BookingId = 3,
            Schedule = schedule,
            TotalPrice = 500000,
            BookingStatus = "Completed",
            CreatedAt = tomorrow
        };

        _context.FieldComplexes.Add(complex);
        _context.Fields.Add(field);
        _context.Bookings.AddRange(b1, b2, b3);
        await _context.SaveChangesAsync();

        var result = await _repo.GetDailyRevenueAsync(ownerId);

        Assert.Equal(2, result.Count); 

        // Check Ngày hôm nay: Phải là tổng (100k + 200k = 300k)
        var todayStats = result.FirstOrDefault(x => x.Date == today);
        Assert.NotNull(todayStats);
        Assert.Equal(300000, todayStats.TotalRevenue);

        // Check Ngày mai: 500k
        var tomorrowStats = result.FirstOrDefault(x => x.Date == tomorrow);
        Assert.NotNull(tomorrowStats);
        Assert.Equal(500000, tomorrowStats.TotalRevenue);
    }
}