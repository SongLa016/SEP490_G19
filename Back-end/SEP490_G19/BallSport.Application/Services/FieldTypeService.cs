using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;

namespace BallSport.Application.Services
{
    public class FieldTypeService
    {
        private readonly FieldTypesRepository _repository;

        public FieldTypeService(FieldTypesRepository repository)
        {
            _repository = repository;
        }

        // 📌 Thêm loại sân
        public async Task<FieldTypeDTO> AddFieldTypeAsync(FieldTypeDTO dto)
        {
            var type = new FieldType
            {
                TypeName = dto.TypeName
            };

            var created = await _repository.AddFieldTypeAsync(type);

            return new FieldTypeDTO
            {
                TypeId = created.TypeId,
                TypeName = created.TypeName
            };
        }

        // 📌 Lấy tất cả loại sân
        public async Task<List<FieldTypeDTO>> GetAllFieldTypesAsync()
        {
            var types = await _repository.GetAllFieldTypesAsync();
            return types.Select(t => new FieldTypeDTO
            {
                TypeId = t.TypeId,
                TypeName = t.TypeName
            }).ToList();
        }

        // 📌 Lấy chi tiết 1 loại sân
        public async Task<FieldTypeDTO?> GetFieldTypeByIdAsync(int typeId)
        {
            var type = await _repository.GetFieldTypeByIdAsync(typeId);
            if (type == null) return null;

            return new FieldTypeDTO
            {
                TypeId = type.TypeId,
                TypeName = type.TypeName
            };
        }
    }
}
