using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;

namespace BallSport.Application.Services
{
    public class FieldComplexService
    {
        private readonly FieldComplexRepository _complexRepository;

        public FieldComplexService(FieldComplexRepository complexRepository)
        {
            _complexRepository = complexRepository;
        }

        // Thêm khu sân mới
        public async Task<FieldComplexDTO> AddComplexAsync(FieldComplexDTO dto)
        {
            var complex = new FieldComplex
            {
                OwnerId = dto.OwnerId,
                Name = dto.Name,
                Address = dto.Address,
                Description = dto.Description,
                Image = dto.Image,
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

        //  Lấy tất cả khu sân
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
                CreatedAt = c.CreatedAt,
                Fields = c.Fields?.Select(f => new FieldDTO
                {
                    FieldId = f.FieldId,
                    Name = f.Name,
                    Size = f.Size,
                    GrassType = f.GrassType,
                    PricePerHour = f.PricePerHour,
                    Status = f.Status
                }).ToList()
            }).ToList();
        }

        //  Lấy thông tin chi tiết 1 khu sân
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
                Image = c.Image,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                Fields = c.Fields?.Select(f => new FieldDTO
                {
                    FieldId = f.FieldId,
                    Name = f.Name,
                    Size = f.Size,
                    GrassType = f.GrassType,
                    PricePerHour = f.PricePerHour,
                    Status = f.Status
                }).ToList()
            };
        }
    }
}
