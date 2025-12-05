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

        // 🟢 THÊM KHU SÂN (CÓ TỰ ĐỘNG LẤY TỌA ĐỘ)
        public async Task<FieldComplexResponseDTO> AddComplexAsync(FieldComplexDTO dto)
        {
            string? imageUrl = null;

            // ✅ Upload ảnh
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

            // ✅ LẤY TỌA ĐỘ THEO ĐỊA CHỈ
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

                // ✅ QUAN TRỌNG
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

        // 🟢 LẤY TẤT CẢ KHU SÂN
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

        // 🟢 LẤY CHI TIẾT 1 KHU SÂN
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

        // 🟢 CẬP NHẬT KHU SÂN (ĐỔI ĐỊA CHỈ → TỰ CẬP NHẬT LẠI TỌA ĐỘ)
        public async Task<FieldComplexResponseDTO?> UpdateComplexAsync(FieldComplexDTO dto)
        {
            var existing = await _complexRepository.GetComplexByIdAsync(dto.ComplexId);
            if (existing == null) return null;

            existing.Name = dto.Name;
            existing.Description = dto.Description;
            existing.OwnerId = dto.OwnerId;
            existing.Status = dto.Status;

            // ✅ NẾU ĐỔI ĐỊA CHỈ → CẬP NHẬT LẠI TỌA ĐỘ
            if (existing.Address != dto.Address)
            {
                existing.Address = dto.Address;

                if (!string.IsNullOrWhiteSpace(dto.Address))
                {
                    var (lat, lng) =
                        await _geocodingService.GetLocationFromAddressAsync(dto.Address);

                    existing.Latitude = lat;
                    existing.Longitude = lng;
                }
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

        // 🟢 XÓA KHU SÂN
        public async Task<bool> DeleteComplexAsync(int complexId)
        {
            return await _complexRepository.DeleteComplexAsync(complexId);
        }
    }
}
