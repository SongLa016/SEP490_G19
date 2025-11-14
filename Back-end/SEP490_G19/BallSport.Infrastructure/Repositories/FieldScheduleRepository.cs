using BallSport.Infrastructure;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories
{
    public class FieldScheduleRepository 
    {
        private readonly Sep490G19v1Context _context;

        public FieldScheduleRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        //  Lấy toàn bộ lịch sân (gồm Field + Slot)
        public async Task<List<FieldSchedule>> GetAllAsync()
        {
            return await _context.FieldSchedules
                .Include(s => s.Field)
                .Include(s => s.Slot)
                .ToListAsync();
        }

        //  Lấy danh sách lịch theo FieldId
        public async Task<List<FieldSchedule>> GetByFieldIdAsync(int fieldId)
        {
            return await _context.FieldSchedules
                .Where(s => s.FieldId == fieldId)
                .Include(s => s.Field)
                .Include(s => s.Slot)
                .ToListAsync();
        }

        //  Lấy 1 lịch theo ScheduleId
        public async Task<FieldSchedule?> GetByIdAsync(int scheduleId)
        {
            return await _context.FieldSchedules
                .Include(s => s.Field)
                .Include(s => s.Slot)
                .FirstOrDefaultAsync(s => s.ScheduleId == scheduleId);
        }

        //  Thêm mới
        public async Task<FieldSchedule> AddAsync(FieldSchedule schedule)
        {
            _context.FieldSchedules.Add(schedule);
            await _context.SaveChangesAsync();
            return schedule;
        }

        //  Cập nhật
        public async Task UpdateAsync(FieldSchedule schedule)
        {
            _context.FieldSchedules.Update(schedule);
            await _context.SaveChangesAsync();
        }

        //  Xóa
        public async Task<bool> DeleteAsync(int id)
        {
            var schedule = await _context.FieldSchedules.FindAsync(id);
            if (schedule == null) return false;

            _context.FieldSchedules.Remove(schedule);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
