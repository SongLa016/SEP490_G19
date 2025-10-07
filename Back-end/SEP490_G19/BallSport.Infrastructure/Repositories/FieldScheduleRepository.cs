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

        // Lấy tất cả lịch sân (bao gồm thông tin slot)
        public async Task<List<FieldSchedule>> GetAllAsync()
        {
            return await _context.FieldSchedules
                .Include(fs => fs.Slot)
                .Include(fs => fs.Field)
                .ToListAsync();
        }

        // Lấy lịch theo sân + ngày
        public async Task<List<FieldSchedule>> GetByFieldAndDateAsync(int fieldId, DateOnly date)
        {
            return await _context.FieldSchedules
                .Include(fs => fs.Slot)
                .Include(fs => fs.Field)
                .Where(fs => fs.FieldId == fieldId && fs.Date == date)
                .ToListAsync();
        }

        // Thêm mới
        public async Task<FieldSchedule> AddAsync(FieldSchedule schedule)
        {
            _context.FieldSchedules.Add(schedule);
            await _context.SaveChangesAsync();
            return schedule;
        }

        // Cập nhật trạng thái
        public async Task<bool> UpdateStatusAsync(int scheduleId, string status)
        {
            var schedule = await _context.FieldSchedules.FindAsync(scheduleId);
            if (schedule == null) return false;

            schedule.Status = status;
            await _context.SaveChangesAsync();
            return true;
        }

        // Xóa
        public async Task<bool> DeleteAsync(int id)
        {
            var schedule = await _context.FieldSchedules.FindAsync(id);
            if (schedule == null) return false;

            _context.FieldSchedules.Remove(schedule);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
