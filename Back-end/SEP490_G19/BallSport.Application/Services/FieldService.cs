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

        // CREATE 
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

        //  Lấy tất cả sân trong khu sân
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

        //Lấy thông tin chi tiết 1 sân
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

        // UPDATE 
        public async Task<FieldDTO?> UpdateFieldAsync(FieldDTO dto)
        {
            var existingField = await _fieldRepository.GetFieldByIdAsync(dto.FieldId);
            if (existingField == null) return null;

            existingField.Name = dto.Name;
            existingField.Size = dto.Size;
            existingField.GrassType = dto.GrassType;
            existingField.Description = dto.Description;
            existingField.TypeId = dto.TypeId;
            existingField.PricePerHour = dto.PricePerHour;
            existingField.Status = dto.Status;
            existingField.Image = dto.Image;

            var updated = await _fieldRepository.UpdateFieldAsync(existingField);

            return new FieldDTO
            {
                FieldId = updated.FieldId,
                ComplexId = updated.ComplexId,
                TypeId = updated.TypeId,
                Name = updated.Name,
                Size = updated.Size,
                GrassType = updated.GrassType,
                Description = updated.Description,
                PricePerHour = updated.PricePerHour,
                Status = updated.Status,
                CreatedAt = updated.CreatedAt
            };
        }

        // DELETE 
        public async Task<bool> DeleteFieldAsync(int fieldId)
        {
            var existingField = await _fieldRepository.GetFieldByIdAsync(fieldId);
            if (existingField == null) return false;

            return await _fieldRepository.DeleteFieldAsync(fieldId);
        }
    }
}
