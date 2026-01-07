using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;
using BallSport.Application.DTOs;
using BallSport.Application.Services;
using BallSport.Infrastructure.Models; 
using BallSport.Infrastructure.Repositories;
using CloudinaryDotNet;

public class FieldServiceTests
{
    private readonly Mock<FieldRepository> _mockFieldRepo;
    private readonly Mock<OwnerBankAccountRepository> _mockBankRepo;
    private readonly Mock<FieldService> _mockFieldService;

    public FieldServiceTests()
    {
        _mockFieldRepo = new Mock<FieldRepository>();
        _mockBankRepo = new Mock<OwnerBankAccountRepository>();

        _mockFieldService = new Mock<FieldService>(
            _mockFieldRepo.Object,
            _mockBankRepo.Object,
            null
        );

        _mockFieldService.CallBase = true;
    }

    // TEST CASE 1: Successfully added the field with complete information
    [Fact]
    public async Task AddFieldAsync_ShouldReturnResponse_WhenInputIsComplete()
    {
        // Arrange
        int ownerId = 1;
        var dto = new FieldDTO
        {
            ComplexId = 10,
            BankAccountId = 5,
            Name = "Sân Full Option",
            PricePerHour = 100000,
            MainImage = new Mock<IFormFile>().Object,
            ImageFiles = new List<IFormFile> { new Mock<IFormFile>().Object }
        };

        _mockFieldRepo.Setup(x => x.GetComplexByIdAsync(dto.ComplexId.Value))
            .ReturnsAsync(new FieldComplex { ComplexId = 10, OwnerId = ownerId });

        _mockBankRepo.Setup(x => x.GetByIdAsync(dto.BankAccountId.Value))
            .ReturnsAsync(new OwnerBankAccount { BankAccountId = 5, OwnerId = ownerId });

        _mockFieldService.Setup(x => x.UploadToCloudinary(It.IsAny<IFormFile>()))
            .ReturnsAsync("https://fake-cloudinary.com/image.jpg");

        var createdField = new Field
        {
            FieldId = 1,
            ComplexId = 10,
            ImageUrl = "https://fake-cloudinary.com/image.jpg",
            PricePerHour = 100000
        };
        _mockFieldRepo.Setup(x => x.AddFieldAsync(It.IsAny<Field>()))
            .ReturnsAsync(createdField);

        var result = await _mockFieldService.Object.AddFieldAsync(dto, ownerId);
        Assert.NotNull(result);
        Assert.Equal("https://fake-cloudinary.com/image.jpg", result.MainImageUrl);
        _mockFieldRepo.Verify(x => x.AddFieldImagesAsync(1, It.IsAny<List<string>>()), Times.Once);
    }

    // TEST CASE 2: Error uploading main image
    [Fact]
    public async Task AddFieldAsync_ShouldThrowException_WhenUploadFails()
    {
        int ownerId = 1;
        var dto = new FieldDTO
        {
            ComplexId = 10,
            BankAccountId = 5,
            PricePerHour = 100,
            MainImage = new Mock<IFormFile>().Object
        };

        _mockFieldRepo.Setup(x => x.GetComplexByIdAsync(dto.ComplexId.Value))
            .ReturnsAsync(new FieldComplex { ComplexId = 10, OwnerId = ownerId });

        // SỬA LỖI: Dùng OwnerBankAccount
        _mockBankRepo.Setup(x => x.GetByIdAsync(dto.BankAccountId.Value))
            .ReturnsAsync(new OwnerBankAccount { BankAccountId = 5, OwnerId = ownerId });

        // Giả lập lỗi Upload
        _mockFieldService.Setup(x => x.UploadToCloudinary(It.IsAny<IFormFile>()))
            .ThrowsAsync(new Exception("Cloudinary connection failed"));

        var ex = await Assert.ThrowsAsync<Exception>(() => _mockFieldService.Object.AddFieldAsync(dto, ownerId));
        Assert.Equal("Cloudinary connection failed", ex.Message);

        _mockFieldRepo.Verify(x => x.AddFieldAsync(It.IsAny<Field>()), Times.Never);
    }

    // TEST CASE 3: Add court without image
    [Fact]
    public async Task AddFieldAsync_ShouldSuccess_WhenNoImageProvided()
    {
        // Arrange
        int ownerId = 1;
        var dto = new FieldDTO
        {
            ComplexId = 10,
            BankAccountId = 5,
            Name = "Sân Không Ảnh",
            PricePerHour = 50000,
            MainImage = null,
            ImageFiles = null
        };

        _mockFieldRepo.Setup(x => x.GetComplexByIdAsync(dto.ComplexId.Value))
            .ReturnsAsync(new FieldComplex { ComplexId = 10, OwnerId = ownerId });

        // SỬA LỖI: Dùng OwnerBankAccount
        _mockBankRepo.Setup(x => x.GetByIdAsync(dto.BankAccountId.Value))
            .ReturnsAsync(new OwnerBankAccount { BankAccountId = 5, OwnerId = ownerId });

        var createdField = new Field { FieldId = 2, Name = "Sân Không Ảnh", ImageUrl = null };
        _mockFieldRepo.Setup(x => x.AddFieldAsync(It.IsAny<Field>()))
            .ReturnsAsync(createdField);

        // Act
        var result = await _mockFieldService.Object.AddFieldAsync(dto, ownerId);

        // Assert
        Assert.NotNull(result);
        Assert.Null(result.MainImageUrl);
        _mockFieldService.Verify(x => x.UploadToCloudinary(It.IsAny<IFormFile>()), Times.Never);
    }

    // TEST CASE 4: Error when the repository fails to create Field
    [Fact]
    public async Task AddFieldAsync_ShouldThrowException_WhenDbFails()
    {
        // Arrange
        int ownerId = 1;
        var dto = new FieldDTO
        {
            ComplexId = 10,
            BankAccountId = 5,
            PricePerHour = 50000
        };

        _mockFieldRepo.Setup(x => x.GetComplexByIdAsync(dto.ComplexId.Value))
            .ReturnsAsync(new FieldComplex { ComplexId = 10, OwnerId = ownerId });

        // SỬA LỖI: Dùng OwnerBankAccount
        _mockBankRepo.Setup(x => x.GetByIdAsync(dto.BankAccountId.Value))
            .ReturnsAsync(new OwnerBankAccount { BankAccountId = 5, OwnerId = ownerId });

        _mockFieldRepo.Setup(x => x.AddFieldAsync(It.IsAny<Field>()))
            .ThrowsAsync(new Exception("Database Error"));

        var ex = await Assert.ThrowsAsync<Exception>(() => _mockFieldService.Object.AddFieldAsync(dto, ownerId));
        Assert.Equal("Database Error", ex.Message);
    }
}