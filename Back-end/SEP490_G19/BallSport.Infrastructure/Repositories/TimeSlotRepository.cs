using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories
{
    public class TimeSlotRepository
    {
        private readonly Sep490G19v1Context _context;

        public TimeSlotRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        // Lấy toàn bộ slot
        public async Task<List<TimeSlot>> GetAllAsync()
        {
            return await _context.TimeSlots
                .OrderBy(ts => ts.StartTime)
                .ToListAsync();
        }

        // Lấy slot theo ID
        public async Task<TimeSlot?> GetByIdAsync(int id)
        {
            return await _context.TimeSlots
                .FirstOrDefaultAsync(ts => ts.SlotId == id);
        }

        // Thêm slot mới
        public async Task<TimeSlot> AddAsync(TimeSlot slot)
        {
            _context.TimeSlots.Add(slot);
            await _context.SaveChangesAsync();
            return slot;
        }

        // Cập nhật slot
        public async Task<bool> UpdateAsync(TimeSlot slot)
        {
            var existing = await _context.TimeSlots.FindAsync(slot.SlotId);
            if (existing == null) return false;

            existing.SlotName = slot.SlotName;
            existing.StartTime = slot.StartTime;
            existing.EndTime = slot.EndTime;

            await _context.SaveChangesAsync();
            return true;
        }

        // Xóa slot
        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _context.TimeSlots.FindAsync(id);
            if (existing == null) return false;

            _context.TimeSlots.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }

        // Kiểm tra trùng giờ
        public async Task<bool> IsTimeDuplicateAsync(TimeOnly start, TimeOnly end)
        {
            return await _context.TimeSlots
                .AnyAsync(ts => ts.StartTime == start && ts.EndTime == end);
        }
    }
}
