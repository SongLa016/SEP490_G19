using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories
{
    public class FieldPriceRepository
    {
        private readonly Sep490G19v1Context _context;

        public FieldPriceRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        // Lấy tất cả giá sân theo slot
        public async Task<List<FieldPrice>> GetAllAsync()
        {
            return await _context.FieldPrices
                .Include(fp => fp.Slot)
                .Include(fp => fp.Field)
                .ToListAsync();
        }

        // Lấy theo id
        public async Task<FieldPrice?> GetByIdAsync(int id)
        {
            return await _context.FieldPrices
                .Include(fp => fp.Slot)
                .Include(fp => fp.Field)
                .FirstOrDefaultAsync(fp => fp.PriceId == id);
        }

        // Thêm mới
        public async Task<FieldPrice> AddAsync(FieldPrice price)
        {
            _context.FieldPrices.Add(price);
            await _context.SaveChangesAsync();
            return price;
        }

        // Cập nhật
        public async Task<bool> UpdateAsync(FieldPrice price)
        {
            var existing = await _context.FieldPrices.FindAsync(price.PriceId);
            if (existing == null) return false;

            existing.Price = price.Price;
            existing.SlotId = price.SlotId;
            existing.FieldId = price.FieldId;

            await _context.SaveChangesAsync();
            return true;
        }

        // Xóa
        public async Task<bool> DeleteAsync(int id)
        {
            var item = await _context.FieldPrices.FindAsync(id);
            if (item == null) return false;

            _context.FieldPrices.Remove(item);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
