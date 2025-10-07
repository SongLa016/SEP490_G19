using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;

namespace BallSport.Application.Services
{
    public class FieldPriceService
    {
        private readonly FieldPriceRepository _repo;

        public FieldPriceService(FieldPriceRepository repo)
        {
            _repo = repo;
        }

        //  Lấy tất cả giá sân
        public async Task<List<FieldPriceDTO>> GetAllAsync()
        {
            var list = await _repo.GetAllAsync();
            return list.Select(fp => new FieldPriceDTO
            {
                PriceId = fp.PriceId,
                FieldId = fp.FieldId,
                FieldName = fp.Field?.Name,
                SlotId = fp.SlotId,
                SlotName = fp.Slot?.SlotName,
                Price = fp.Price
            }).ToList();
        }

        //  Lấy theo ID
        public async Task<FieldPriceDTO?> GetByIdAsync(int id)
        {
            var fp = await _repo.GetByIdAsync(id);
            if (fp == null) return null;

            return new FieldPriceDTO
            {
                PriceId = fp.PriceId,
                FieldId = fp.FieldId,
                FieldName = fp.Field?.Name,
                SlotId = fp.SlotId,
                SlotName = fp.Slot?.SlotName,
                Price = fp.Price
            };
        }

        //  Thêm mới
        public async Task<FieldPriceDTO> AddAsync(FieldPriceDTO dto)
        {
            var entity = new FieldPrice
            {
                FieldId = dto.FieldId,
                SlotId = dto.SlotId,
                Price = dto.Price
            };

            var added = await _repo.AddAsync(entity);
            return new FieldPriceDTO
            {
                PriceId = added.PriceId,
                FieldId = added.FieldId,
                SlotId = added.SlotId,
                Price = added.Price
            };
        }

        //  Cập nhật
        public async Task<bool> UpdateAsync(FieldPriceDTO dto)
        {
            var entity = new FieldPrice
            {
                PriceId = dto.PriceId,
                FieldId = dto.FieldId,
                SlotId = dto.SlotId,
                Price = dto.Price
            };

            return await _repo.UpdateAsync(entity);
        }

        //  Xóa
        public async Task<bool> DeleteAsync(int id)
        {
            return await _repo.DeleteAsync(id);
        }
    }
}
