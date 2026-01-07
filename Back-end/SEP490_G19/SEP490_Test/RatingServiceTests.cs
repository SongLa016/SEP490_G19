using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using BallSport.Application.DTOs.RatingBooking;
using BallSport.Application.Services.RatingBooking;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories.RatingBooking;

public class RatingServiceTests : IDisposable
{
    private readonly Mock<RatingRepository> _mockRepo;
    private readonly Sep490G19v1Context _context;
    private readonly RatingService _service;

    public RatingServiceTests()
    {
        var options = new DbContextOptionsBuilder<Sep490G19v1Context>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new Sep490G19v1Context(options);

        _mockRepo = new Mock<RatingRepository>(_context);
        _service = new RatingService(_context, _mockRepo.Object);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    // TEST CASE 1: View successful reviews (from completed bookings)
    [Fact]
    public async Task GetRatingsOfFieldAsync_ShouldReturnList_WhenReviewsExist()
    {
        // Arrange
        int fieldId = 1;
        var fakeRatings = new List<FieldRatingWithRepliesDto>
        {
            new FieldRatingWithRepliesDto { RatingId = 1, Comment = "Good field", Stars = 5 },
            new FieldRatingWithRepliesDto { RatingId = 2, Comment = "Okay", Stars = 3 }
        };

        // Giả lập Repository trả về danh sách đánh giá
        _mockRepo.Setup(x => x.GetRatingsByFieldIdWithRepliesAsync(fieldId))
            .ReturnsAsync(fakeRatings);

        var result = await _service.GetRatingsOfFieldAsync(fieldId);

        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal("Good field", result[0].Comment);
    }

    // TEST CASE 2: No reviews as there are no completed bookings
    [Fact]
    public async Task GetRatingsOfFieldAsync_ShouldReturnEmpty_WhenNoReviewsExist()
    {
        int fieldId = 2; // Giả sử sân này chưa có booking nào xong

        _mockRepo.Setup(x => x.GetRatingsByFieldIdWithRepliesAsync(fieldId))
            .ReturnsAsync(new List<FieldRatingWithRepliesDto>());

        // Act
        var result = await _service.GetRatingsOfFieldAsync(fieldId);

        Assert.NotNull(result);
        Assert.Empty(result); // List phải rỗng
    }

    // TEST CASE 3: The player hasn't completed the booking but tried to submit a review
    [Fact]
    public async Task AddRatingAsync_ShouldFail_WhenBookingIsNotCompleted()
    {
        int userId = 10;
        int bookingId = 100;
        int fieldId = 5;

        var complex = new FieldComplex
        {
            ComplexId = 1,
            Name = "Complex Test",      
            Address = "123 Test St",    
            OwnerId = 99
        };

        var field = new Field
        {
            FieldId = fieldId,
            Name = "Sân bóng 1",       
            ComplexId = 1,
            Complex = complex
        };

        var schedule = new FieldSchedule
        {
            ScheduleId = 1,
            FieldId = fieldId,
            Field = field
        };
        // -------------------------------------------------------------

        var booking = new Booking
        {
            BookingId = bookingId,
            UserId = userId,
            ScheduleId = 1,
            Schedule = schedule,
            PaymentStatus = "Paid",
            BookingStatus = "Pending" 
        };

        _context.Bookings.Add(booking);

        _context.FieldComplexes.Add(complex);
        _context.Fields.Add(field);

        await _context.SaveChangesAsync(); 

        var request = new RatingRequest { BookingId = bookingId, Stars = 5, Comment = "Test" };

        var result = await _service.AddRatingAsync(userId, request);

        Assert.Equal("You can rate only after the match is completed", result);

        _mockRepo.Verify(x => x.AddRatingAsync(It.IsAny<Rating>()), Times.Never);
    }

    // TEST CASE 4: No stadium found to view reviews
    [Fact]
    public async Task GetRatingsOfFieldAsync_ShouldReturnEmpty_WhenFieldNotFound()
    {
        int nonExistentFieldId = 9999;
        _mockRepo.Setup(x => x.GetRatingsByFieldIdWithRepliesAsync(nonExistentFieldId))
            .ReturnsAsync(new List<FieldRatingWithRepliesDto>());

        var result = await _service.GetRatingsOfFieldAsync(nonExistentFieldId);
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    // TEST CASE 5: Error querying reviews from the database
    [Fact]
    public async Task GetRatingsOfFieldAsync_ShouldThrowException_WhenDatabaseFails()
    {
        int fieldId = 1;

        _mockRepo.Setup(x => x.GetRatingsByFieldIdWithRepliesAsync(fieldId))
            .ThrowsAsync(new Exception("Database connection timeout"));
        var exception = await Assert.ThrowsAsync<Exception>(() => _service.GetRatingsOfFieldAsync(fieldId));
        Assert.Equal("Database connection timeout", exception.Message);
    }
}