using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using System.IO;

namespace BallSport.Application.Services
{
    public class FieldComplexService
    {
        private readonly FieldComplexRepository _complexRepository;

        public FieldComplexService(FieldComplexRepository complexRepository)
        {
            _complexRepository = complexRepository;
        }

        // 🟢 Thêm khu sân mới
        public async Task<FieldComplexDTO> AddComplexAsync(FieldComplexDTO dto)
        {
            byte[]? imageBytes = null;

            if (dto.ImageFile != null && dto.ImageFile.Length > 0)
            {
                using (var ms = new MemoryStream())
                {
                    await dto.ImageFile.CopyToAsync(ms);
                    imageBytes = ms.ToArray();
                }
            }

            var complex = new FieldComplex
            {
                OwnerId = dto.OwnerId,
                Name = dto.Name,
                Address = dto.Address,
                Description = dto.Description,
                Image = imageBytes,
                Status = dto.Status ?? "Active",
                CreatedAt = DateTime.Now
            };

            var created = await _complexRepository.AddComplexAsync(complex);

            return new FieldComplexDTO
            {
                ComplexId = created.ComplexId,
                OwnerId = created.OwnerId,
                Name = created.Name,
                Address = created.Address,
                Description = created.Description,
                Status = created.Status,
                CreatedAt = created.CreatedAt
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

                ImageBase64 = c.Image != null
             ? Convert.ToBase64String(c.Image)
             : null
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

                ImageBase64 = c.Image != null
                    ? Convert.ToBase64String(c.Image)
                    : null
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

            // 🔥 Update ảnh nếu có
            if (dto.ImageFile != null && dto.ImageFile.Length > 0)
            {
                using (var ms = new MemoryStream())
                {
                    await dto.ImageFile.CopyToAsync(ms);
                    existing.Image = ms.ToArray();
                }
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

                ImageBase64 = updated.Image != null
                    ? Convert.ToBase64String(updated.Image)
                    : null
            };
        }


        // 🟢 Xóa khu sân
        public async Task<bool> DeleteComplexAsync(int complexId)
        {
            return await _complexRepository.DeleteComplexAsync(complexId);
        }
    }
}
