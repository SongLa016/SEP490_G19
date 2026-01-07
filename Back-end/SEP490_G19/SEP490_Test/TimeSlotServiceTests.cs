using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Xunit;
using Moq;
using Microsoft.EntityFrameworkCore;
using BallSport.Application.DTOs;
using BallSport.Application.Services;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;

public class TimeSlotServiceTests : IDisposable
{
    private readonly Mock<ITimeSlotRepository> _mockRepo;
    private readonly Sep490G19v1Context _context;
    private readonly TimeSlotService _service;

    public TimeSlotServiceTests()
    {
        var options = new DbContextOptionsBuilder<Sep490G19v1Context>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new Sep490G19v1Context(options);
        _mockRepo = new Mock<ITimeSlotRepository>();
        _service = new TimeSlotService(_mockRepo.Object, _context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    // TEST CASE 1: Price updated by time slot successfully
    [Fact]
    public async Task UpdateAsync_ShouldUpdatePrice_WhenDataIsValid()
    {
        // Arrange
        int ownerId = 1;
        int fieldId = 10;
        int slotId = 100;

        // SỬA LỖI: Thêm Name và Address để thỏa mãn ràng buộc Database
        var complex = new FieldComplex
        {
            ComplexId = 1,
            OwnerId = ownerId,
            Name = "Complex Test",      
            Address = "123 Test Street" 
        };

        var field = new Field { FieldId = fieldId, ComplexId = 1, Complex = complex, Name = "Field 1" };

        var existingSlotEntity = new TimeSlot
        {
            SlotId = slotId,
            FieldId = fieldId,
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(9, 0),
            Price = 50000
        };

        _context.FieldComplexes.Add(complex);
        _context.Fields.Add(field);
        _context.TimeSlots.Add(existingSlotEntity);
        await _context.SaveChangesAsync(); 

        _mockRepo.Setup(x => x.GetByIdAsync(slotId, ownerId))
            .ReturnsAsync(existingSlotEntity);

        var dto = new TimeSlotDTO
        {
            FieldId = fieldId,
            SlotName = "Slot 8-9h Updated",
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(9, 0),
            Price = 100000
        };

        // Act
        var result = await _service.UpdateAsync(slotId, dto, ownerId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(100000, result.Price);
        Assert.Equal(100000, existingSlotEntity.Price);

        _mockRepo.Verify(x => x.UpdateAsync(It.Is<TimeSlot>(s => s.Price == 100000)), Times.Once);
    }

    // TEST CASE 2: Invalid time slot price (price = 0 or negative)
    [Fact]
    public async Task UpdateAsync_ShouldThrowException_WhenPriceIsInvalid()
    {
        // Arrange
        int ownerId = 1;
        int slotId = 100;

        _mockRepo.Setup(x => x.GetByIdAsync(slotId, ownerId))
            .ReturnsAsync(new TimeSlot { SlotId = slotId });

        var dto = new TimeSlotDTO
        {
            FieldId = 10,
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(9, 0),
            Price = -50000 // Giá âm
        };

        await Assert.ThrowsAnyAsync<Exception>(() => _service.UpdateAsync(slotId, dto, ownerId));

        _mockRepo.Verify(x => x.UpdateAsync(It.IsAny<TimeSlot>()), Times.Never);
    }

    // TEST CASE 3: Time slot not found to update the price
    [Fact]
    public async Task UpdateAsync_ShouldReturnNull_WhenSlotNotFound()
    {
        int ownerId = 1;
        int slotId = 999;
        var dto = new TimeSlotDTO { Price = 100000 };

        _mockRepo.Setup(x => x.GetByIdAsync(slotId, ownerId))
            .ReturnsAsync((TimeSlot?)null);

        var result = await _service.UpdateAsync(slotId, dto, ownerId);

        Assert.Null(result);
        _mockRepo.Verify(x => x.UpdateAsync(It.IsAny<TimeSlot>()), Times.Never);
    }

    // TEST CASE 4: Error saving time slot price to the database
    [Fact]
    public async Task UpdateAsync_ShouldThrowException_WhenDatabaseSaveFails()
    {
        // Arrange
        int ownerId = 1;
        int fieldId = 10;
        int slotId = 100;

        // SỬA LỖI: Thêm Name và Address
        var complex = new FieldComplex
        {
            ComplexId = 1,
            OwnerId = ownerId,
            Name = "Complex Test Fail",
            Address = "Fail St"
        };

        var field = new Field { FieldId = fieldId, ComplexId = 1, Complex = complex, Name = "Field Fail" };

        var existingSlot = new TimeSlot
        {
            SlotId = slotId,
            FieldId = fieldId,
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(9, 0)
        };

        _context.FieldComplexes.Add(complex);
        _context.Fields.Add(field);
        _context.TimeSlots.Add(existingSlot);
        await _context.SaveChangesAsync();

        _mockRepo.Setup(x => x.GetByIdAsync(slotId, ownerId))
            .ReturnsAsync(existingSlot);

        var dto = new TimeSlotDTO
        {
            FieldId = fieldId,
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(9, 0),
            Price = 200000
        };

        _mockRepo.Setup(x => x.UpdateAsync(It.IsAny<TimeSlot>()))
            .ThrowsAsync(new Exception("Database Connection Timeout"));

        // Act & Assert
        var ex = await Assert.ThrowsAsync<Exception>(() => _service.UpdateAsync(slotId, dto, ownerId));
        Assert.Equal("Database Connection Timeout", ex.Message);
    }

    // TEST CASE 5: Update prices by time slot with the smallest margin value
    [Fact]
    public async Task UpdateAsync_ShouldUpdateSuccessfully_WithSmallestValidPrice()
    {
        int ownerId = 1;
        int fieldId = 10;
        int slotId = 100;

        // SỬA LỖI: Thêm Name và Address
        var complex = new FieldComplex
        {
            ComplexId = 1,
            OwnerId = ownerId,
            Name = "Complex Min Price",
            Address = "Min St"
        };

        var field = new Field { FieldId = fieldId, ComplexId = 1, Complex = complex, Name = "Field Min" };

        var existingSlot = new TimeSlot
        {
            SlotId = slotId,
            FieldId = fieldId,
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
            Price = 50000
        };

        _context.FieldComplexes.Add(complex);
        _context.Fields.Add(field);
        _context.TimeSlots.Add(existingSlot);
        await _context.SaveChangesAsync();

        _mockRepo.Setup(x => x.GetByIdAsync(slotId, ownerId))
            .ReturnsAsync(existingSlot);

        decimal smallestPrice = 0;
        var dto = new TimeSlotDTO
        {
            FieldId = fieldId,
            SlotName = "Free Slot",
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
            Price = smallestPrice
        };

        // Act
        var result = await _service.UpdateAsync(slotId, dto, ownerId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(smallestPrice, result.Price);

        _mockRepo.Verify(x => x.UpdateAsync(It.Is<TimeSlot>(s => s.Price == smallestPrice)), Times.Once);
    }
}