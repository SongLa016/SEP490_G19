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
        public async Task<List<FieldComplexDTO>> GetAllComplexesAsync()
        {
            var complexes = await _complexRepository.GetAllComplexesAsync();

            return complexes.Select(c => new FieldComplexDTO
            {
                ComplexId = c.ComplexId,
                OwnerId = c.OwnerId,
                Name = c.Name,
                Address = c.Address,
                Description = c.Description,
                Status = c.Status,
                CreatedAt = c.CreatedAt
            }).ToList();
        }

        // 🟢 Lấy chi tiết 1 khu sân
        public async Task<FieldComplexDTO?> GetComplexByIdAsync(int complexId)
        {
            var c = await _complexRepository.GetComplexByIdAsync(complexId);
            if (c == null) return null;

            return new FieldComplexDTO
            {
                ComplexId = c.ComplexId,
                OwnerId = c.OwnerId,
                Name = c.Name,
                Address = c.Address,
                Description = c.Description,
                Status = c.Status,
                CreatedAt = c.CreatedAt
            };
        }

        // 🟢 Cập nhật khu sân
        public async Task<FieldComplexDTO?> UpdateComplexAsync(FieldComplexDTO dto)
        {
            var existing = await _complexRepository.GetComplexByIdAsync(dto.ComplexId);
            if (existing == null) return null;

            existing.Name = dto.Name;
            existing.Address = dto.Address;
            existing.Description = dto.Description;
            existing.OwnerId = dto.OwnerId;
            existing.Status = dto.Status;

            if (dto.ImageFile != null && dto.ImageFile.Length > 0)
            {
                using (var ms = new MemoryStream())
                {
                    await dto.ImageFile.CopyToAsync(ms);
                    existing.Image = ms.ToArray();
                }
            }

            var updated = await _complexRepository.UpdateComplexAsync(existing);

            return new FieldComplexDTO
            {
                ComplexId = updated.ComplexId,
                OwnerId = updated.OwnerId,
                Name = updated.Name,
                Address = updated.Address,
                Description = updated.Description,
                Status = updated.Status,
                CreatedAt = updated.CreatedAt
            };
        }

        // 🟢 Xóa khu sân
        public async Task<bool> DeleteComplexAsync(int complexId)
        {
            return await _complexRepository.DeleteComplexAsync(complexId);
        }
    }
}
