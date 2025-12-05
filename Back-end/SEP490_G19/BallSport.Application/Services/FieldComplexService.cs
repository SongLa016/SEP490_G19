using BallSport.Application.DTOs;
using BallSport.Application.Services.Geocoding;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace BallSport.Application.Services
{
    public class FieldComplexService
    {
        private readonly FieldComplexRepository _complexRepository;
        private readonly Cloudinary _cloudinary;
        private readonly IGeocodingService _geocodingService;

        public FieldComplexService(
            FieldComplexRepository complexRepository,
            Cloudinary cloudinary,
            IGeocodingService geocodingService)
        {
            _complexRepository = complexRepository;
            _cloudinary = cloudinary;
            _geocodingService = geocodingService;
        }

        // ✅ THÊM KHU SÂN - TỰ ĐỘNG LẤY TỌA ĐỘ TỪ ADDRESS
        public async Task<FieldComplexResponseDTO> AddComplexAsync(FieldComplexDTO dto)
        {
            string? imageUrl = null;

            if (dto.ImageFile != null)
            {
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(dto.ImageFile.FileName, dto.ImageFile.OpenReadStream()),
                    Folder = "field-complexes"
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                imageUrl = uploadResult.SecureUrl.AbsoluteUri;
            }

            // ✅ LẤY TỌA ĐỘ TỪ ADDRESS (NOMINATIM)
            double? latitude = null;
            double? longitude = null;

            if (!string.IsNullOrWhiteSpace(dto.Address))
            {
                (latitude, longitude) =
                    await _geocodingService.GetLocationFromAddressAsync(dto.Address);
            }

            var complex = new FieldComplex
            {
                OwnerId = dto.OwnerId,
                Name = dto.Name,
                Address = dto.Address,
                Description = dto.Description,
                ImageUrl = imageUrl,
                Status = dto.Status ?? "Active",
                CreatedAt = DateTime.Now,
                Latitude = latitude,
                Longitude = longitude
            };

            var created = await _complexRepository.AddComplexAsync(complex);

            return new FieldComplexResponseDTO
            {
                ComplexId = created.ComplexId,
                OwnerId = created.OwnerId,
                Name = created.Name,
                Address = created.Address,
                Description = created.Description,
                Status = created.Status,
                CreatedAt = created.CreatedAt,
                ImageUrl = created.ImageUrl,
                Latitude = created.Latitude,
                Longitude = created.Longitude
            };
        }

        // ✅ GET ALL
        public async Task<List<FieldComplexResponseDTO>> GetAllComplexesAsync()
        {
            var complexes = await _complexRepository.GetAllComplexesAsync();

            return complexes.Select(c => new FieldComplexResponseDTO
            {
                ComplexId = c.ComplexId,
                OwnerId = c.OwnerId,
                Name = c.Name,
                Address = c.Address,
                Description = c.Description,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                ImageUrl = c.ImageUrl,
                Latitude = c.Latitude,
                Longitude = c.Longitude
            }).ToList();
        }

        // ✅ GET BY ID
        public async Task<FieldComplexResponseDTO?> GetComplexByIdAsync(int complexId)
        {
            var c = await _complexRepository.GetComplexByIdAsync(complexId);
            if (c == null) return null;

            return new FieldComplexResponseDTO
            {
                ComplexId = c.ComplexId,
                OwnerId = c.OwnerId,
                Name = c.Name,
                Address = c.Address,
                Description = c.Description,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                ImageUrl = c.ImageUrl,
                Latitude = c.Latitude,
                Longitude = c.Longitude
            };
        }

        // ✅ UPDATE – ĐỔI ADDRESS LÀ CẬP NHẬT LẠI TỌA ĐỘ
        public async Task<FieldComplexResponseDTO?> UpdateComplexAsync(FieldComplexDTO dto)
        {
            var existing = await _complexRepository.GetComplexByIdAsync(dto.ComplexId);
            if (existing == null) return null;

            existing.Name = dto.Name;
            existing.Address = dto.Address;
            existing.Description = dto.Description;
            existing.OwnerId = dto.OwnerId;
            existing.Status = dto.Status;

            // ✅ UPDATE LẠI TỌA ĐỘ
            if (!string.IsNullOrWhiteSpace(dto.Address))
            {
                (existing.Latitude, existing.Longitude) =
                    await _geocodingService.GetLocationFromAddressAsync(dto.Address);
            }

            if (dto.ImageFile != null)
            {
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(dto.ImageFile.FileName, dto.ImageFile.OpenReadStream()),
                    Folder = "field-complexes"
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                existing.ImageUrl = uploadResult.SecureUrl.AbsoluteUri;
            }

            var updated = await _complexRepository.UpdateComplexAsync(existing);

            return new FieldComplexResponseDTO
            {
                ComplexId = updated.ComplexId,
                OwnerId = updated.OwnerId,
                Name = updated.Name,
                Address = updated.Address,
                Description = updated.Description,
                Status = updated.Status,
                CreatedAt = updated.CreatedAt,
                ImageUrl = updated.ImageUrl,
                Latitude = updated.Latitude,
                Longitude = updated.Longitude
            };
        }

        // ✅ DELETE
        public async Task<bool> DeleteComplexAsync(int complexId)
        {
            return await _complexRepository.DeleteComplexAsync(complexId);
        }
    }
}
