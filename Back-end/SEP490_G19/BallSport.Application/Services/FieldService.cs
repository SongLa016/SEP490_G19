using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;

namespace BallSport.Application.Services
{
    public class FieldService
    {
        private readonly FieldRepository _fieldRepository;

        public FieldService(FieldRepository fieldRepository)
        {
            _fieldRepository = fieldRepository;
        }

        // Thêm sân mới
        public async Task<FieldDTO> AddFieldAsync(FieldDTO dto)
        {
            var field = new Field
            {
                ComplexId = dto.ComplexId,
                TypeId = dto.TypeId,
                Name = dto.Name,
                Size = dto.Size,
                GrassType = dto.GrassType,
                Description = dto.Description,
                Image = dto.Image,
                PricePerHour = dto.PricePerHour,
                Status = dto.Status ?? "Available",
                CreatedAt = DateTime.Now
            };

            var created = await _fieldRepository.AddFieldAsync(field);

            return new FieldDTO
            {
                FieldId = created.FieldId,
                ComplexId = created.ComplexId,
                TypeId = created.TypeId,
                Name = created.Name,
                Size = created.Size,
                GrassType = created.GrassType,
                Description = created.Description,
                PricePerHour = created.PricePerHour,
                Status = created.Status,
                CreatedAt = created.CreatedAt
            };
        }

        // Lấy tất cả sân trong khu sân
        public async Task<List<FieldDTO>> GetFieldsByComplexIdAsync(int complexId)
        {
            var fields = await _fieldRepository.GetFieldsByComplexIdAsync(complexId);

            return fields.Select(f => new FieldDTO
            {
                FieldId = f.FieldId,
                ComplexId = f.ComplexId,
                TypeId = f.TypeId,
                Name = f.Name,
                Size = f.Size,
                GrassType = f.GrassType,
                Description = f.Description,
                PricePerHour = f.PricePerHour,
                Status = f.Status,
                CreatedAt = f.CreatedAt
            }).ToList();
        }

        // Lấy thông tin chi tiết 1 sân
        public async Task<FieldDTO?> GetFieldByIdAsync(int fieldId)
        {
            var f = await _fieldRepository.GetFieldByIdAsync(fieldId);
            if (f == null) return null;

            return new FieldDTO
            {
                FieldId = f.FieldId,
                ComplexId = f.ComplexId,
                ComplexName = f.Complex?.Name,
                TypeId = f.TypeId,
                TypeName = f.Type?.TypeName,
                Name = f.Name,
                Size = f.Size,
                GrassType = f.GrassType,
                Description = f.Description,
                PricePerHour = f.PricePerHour,
                Status = f.Status,
                CreatedAt = f.CreatedAt
            };
        }
    }
}
