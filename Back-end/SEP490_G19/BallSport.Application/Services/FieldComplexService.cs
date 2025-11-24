using BallSport.Application.DTOs;
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

        public FieldComplexService(FieldComplexRepository complexRepository, Cloudinary cloudinary)
        {
            _complexRepository = complexRepository;
            _cloudinary = cloudinary;
        }

        // 🟢 Thêm khu sân mới
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

            var complex = new FieldComplex
            {
                OwnerId = dto.OwnerId,
                Name = dto.Name,
                Address = dto.Address,
                Description = dto.Description,
                ImageUrl = imageUrl,
                Status = dto.Status ?? "Active",
                CreatedAt = DateTime.Now
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
                ImageUrl = created.ImageUrl
            };
        }

        // 🟢 Lấy tất cả khu sân
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
                ImageUrl = c.ImageUrl
            }).ToList();
        }

        // 🟢 Lấy chi tiết 1 khu sân
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
                ImageUrl = c.ImageUrl
            };
        }

        // 🟢 Cập nhật khu sân
        public async Task<FieldComplexResponseDTO?> UpdateComplexAsync(FieldComplexDTO dto)
        {
            var existing = await _complexRepository.GetComplexByIdAsync(dto.ComplexId);
            if (existing == null) return null;

            existing.Name = dto.Name;
            existing.Address = dto.Address;
            existing.Description = dto.Description;
            existing.OwnerId = dto.OwnerId;
            existing.Status = dto.Status;

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
                ImageUrl = updated.ImageUrl
            };
        }

        // 🟢 Xóa khu sân
        public async Task<bool> DeleteComplexAsync(int complexId)
        {
            return await _complexRepository.DeleteComplexAsync(complexId);
        }
    }
}
