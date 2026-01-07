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
using BallSport.Infrastructure.Repositories.OwnerStatistics;

public class OwnerStatisticsTests : IDisposable
{
    private readonly Sep490G19v1Context _context;

    // Khai báo các Repository cần test
    private readonly DailyRevenueRepository _dailyRevenueRepo;
    private readonly OwnerSummaryRepository _summaryRepo;
    private readonly OwnerTimeSlotStatisticRepository _timeSlotRepo;
    private readonly OwnerFillRateRepository _fillRateRepo;

    public OwnerStatisticsTests()
    {
        var options = new DbContextOptionsBuilder<Sep490G19v1Context>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new Sep490G19v1Context(options);

        _dailyRevenueRepo = new DailyRevenueRepository(_context);
        _summaryRepo = new OwnerSummaryRepository(_context);
        _timeSlotRepo = new OwnerTimeSlotStatisticRepository(_context);
        _fillRateRepo = new OwnerFillRateRepository(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    // TEST CASE 1: View successful weekly summary report (Test DailyRevenueRepository)
    [Fact]
    public async Task GetDailyRevenueAsync_ShouldReturnData_WhenBookingsExist()
    {
        // Arrange
        int ownerId = 1;

        var complex = new FieldComplex
        {
            ComplexId = 1,
            OwnerId = ownerId,
            Name = "Complex 1",      
            Address = "Address 1"    
        };
        var field = new Field
        {
            FieldId = 1,
            Complex = complex,
            ComplexId = 1,
            Name = "Field Test 1"    
        };

        var slot = new TimeSlot { SlotId = 1, Price = 100 };
        var schedule = new FieldSchedule { ScheduleId = 1, Field = field, Slot = slot };

        // Booking ngày hôm nay
        var b1 = new Booking
        {
            BookingId = 1,
            Schedule = schedule,
            TotalPrice = 200000,
            BookingStatus = "Completed",
            CreatedAt = DateTime.Now.Date
        };

        // Booking ngày hôm qua
        var b2 = new Booking
        {
            BookingId = 2,
            Schedule = schedule,
            TotalPrice = 150000,
            BookingStatus = "Completed",
            CreatedAt = DateTime.Now.Date.AddDays(-1)
        };

        _context.Bookings.AddRange(b1, b2);
        // Add thêm Field và Complex vào context để chắc chắn
        _context.Fields.Add(field);
        _context.FieldComplexes.Add(complex);

        await _context.SaveChangesAsync();

        // Act
        var result = await _dailyRevenueRepo.GetDailyRevenueAsync(ownerId);

        // Assert
        Assert.Equal(2, result.Count); // Có dữ liệu của 2 ngày
        Assert.Contains(result, r => r.TotalRevenue == 200000);
        Assert.Contains(result, r => r.TotalRevenue == 150000);
    }

    // TEST CASE 2: View weekly report when there are no bookings (Test OwnerSummaryRepository)
    [Fact]
    public async Task GetTotalRevenueAsync_ShouldReturnZero_WhenNoBookings()
    {
        // Arrange
        int ownerId = 2; // Owner mới, chưa có booking

        // Act
        var revenue = await _summaryRepo.GetTotalRevenueAsync(ownerId);
        var count = await _summaryRepo.GetTotalBookingAsync(ownerId);

        // Assert
        Assert.Equal(0, revenue);
        Assert.Equal(0, count);
    }

    // TEST CASE 3: View the report for the weekly comparison (Test DailyRevenueRepository)
    [Fact]
    public async Task GetDailyRevenueAsync_ShouldGroupCorrectly_ForComparison()
    {
        // Kịch bản: So sánh doanh thu Thứ 2 tuần này vs Thứ 2 tuần trước
        int ownerId = 1;

        var complex = new FieldComplex
        {
            ComplexId = 1,
            OwnerId = ownerId,
            Name = "Complex Compare",
            Address = "Address Compare"
        };
        var field = new Field
        {
            FieldId = 1,
            Complex = complex,
            Name = "Field Compare"
        };
        var schedule = new FieldSchedule { ScheduleId = 1, Field = field };

        // Tuần này
        var b1 = new Booking
        {
            BookingId = 1,
            Schedule = schedule,
            TotalPrice = 500000,
            BookingStatus = "Completed",
            CreatedAt = DateTime.Now
        };
        // Tuần trước
        var b2 = new Booking
        {
            BookingId = 2,
            Schedule = schedule,
            TotalPrice = 300000,
            BookingStatus = "Completed",
            CreatedAt = DateTime.Now.AddDays(-7)
        };

        _context.Bookings.AddRange(b1, b2);
        _context.FieldComplexes.Add(complex); // Add vào context
        _context.Fields.Add(field);           // Add vào context

        await _context.SaveChangesAsync();

        var result = await _dailyRevenueRepo.GetDailyRevenueAsync(ownerId);

        Assert.Equal(2, result.Count);

        var todayRev = result.First(x => x.Date.Date == DateTime.Now.Date).TotalRevenue;
        var lastWeekRev = result.First(x => x.Date.Date == DateTime.Now.AddDays(-7).Date).TotalRevenue;

        Assert.Equal(500000, todayRev);
        Assert.Equal(300000, lastWeekRev);
    }

    // TEST CASE 4: The user does not have permission (Data Isolation)
    [Fact]
    public async Task GetTotalRevenueAsync_ShouldNotReturnOtherOwnerData()
    {
        // Arrange
        int ownerA = 1;
        int ownerB = 99; 

        // --- SỬA LỖI: Thêm Name và Address ---
        var complexA = new FieldComplex
        {
            ComplexId = 1,
            OwnerId = ownerA,
            Name = "Complex A",
            Address = "Address A"
        };
        var fieldA = new Field
        {
            FieldId = 1,
            Complex = complexA,
            Name = "Field A"
        };

        var scheduleA = new FieldSchedule { ScheduleId = 1, Field = fieldA };

        // Booking của Owner A đã thanh toán
        var b1 = new Booking
        {
            BookingId = 1,
            Schedule = scheduleA,
            TotalPrice = 1000000,
            PaymentStatus = "Paid"
        };

        _context.Bookings.Add(b1);
        _context.FieldComplexes.Add(complexA);
        _context.Fields.Add(fieldA);

        await _context.SaveChangesAsync();

        // Owner B cố gắng xem doanh thu
        var result = await _summaryRepo.GetTotalRevenueAsync(ownerB);

        // Assert
        Assert.Equal(0, result); // Owner B không được thấy tiền của Owner A
    }

    // TEST CASE 5: The week entered is invalid / Math Error Check (Test TimeSlotStatistic)
    [Fact]
    public async Task GetTimeSlotPerformanceAsync_ShouldHandleDivideByZero_WhenNoBookings()
    {
        int ownerId = 1;
        var complex = new FieldComplex
        {
            ComplexId = 1,
            OwnerId = ownerId,
            Name = "Complex Math",
            Address = "Address Math"
        };
        var field = new Field
        {
            FieldId = 1,
            Complex = complex,
            Name = "Field Math"
        };

        var slot = new TimeSlot { SlotId = 1, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(9, 0) };
        var schedule = new FieldSchedule { ScheduleId = 1, Field = field, Slot = slot };

        // Booking này bị Cancel hoặc Pending (không phải Completed)
        var b1 = new Booking
        {
            BookingId = 1,
            Schedule = schedule,
            TotalPrice = 100,
            BookingStatus = "Cancelled"
        };

        _context.Bookings.Add(b1);
        _context.FieldComplexes.Add(complex);
        _context.Fields.Add(field);

        await _context.SaveChangesAsync();

        var result = await _timeSlotRepo.GetTimeSlotPerformanceAsync(ownerId);

        Assert.NotNull(result);
        Assert.Empty(result);
    }

    // TEST CASE 6: No field data found for Owner (Test OwnerFillRateRepository)
    [Fact]
    public async Task GetFillRateAsync_ShouldReturnZero_WhenOwnerHasNoSlots()
    {
        int ownerId = 1;
        // Owner này không có TimeSlot nào trong DB
        var result = await _fillRateRepo.GetFillRateAsync(ownerId);
        Assert.Equal(0, result);
    }

    // TEST CASE 7: Error querying data from database (Simulate Exception)
    [Fact]
    public async Task GetTotalRevenueAsync_ShouldThrowException_WhenDatabaseFails()
    {
        var mockContext = new Mock<Sep490G19v1Context>();

        mockContext.Setup(x => x.Bookings).Throws(new Exception("Database Connection Timeout"));

        var repoWithMock = new OwnerSummaryRepository(mockContext.Object);
        await Assert.ThrowsAsync<Exception>(() => repoWithMock.GetTotalRevenueAsync(1));
    }
}