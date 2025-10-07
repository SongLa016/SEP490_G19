using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;

namespace BallSport.Application.Services
{
    public class FieldScheduleService
    {
        private readonly FieldScheduleRepository _repo;

        public FieldScheduleService(FieldScheduleRepository repo)
        {
            _repo = repo;
        }

        //  Lấy tất cả lịch sân
        public async Task<List<FieldScheduleDTO>> GetAllAsync()
        {
            var list = await _repo.GetAllAsync();

            return list.Select(s => new FieldScheduleDTO
            {
                ScheduleId = s.ScheduleId,
                FieldId = s.FieldId,
                FieldName = s.Field?.Name,
                SlotId = s.SlotId,
                SlotName = s.Slot?.SlotName,
                StartTime = s.Slot?.StartTime,
                EndTime = s.Slot?.EndTime,
                Date = s.Date,
                Status = s.Status
            }).ToList();
        }

        // 📌 Lấy lịch sân theo FieldId (1 sân)
        public async Task<List<FieldScheduleDTO>> GetByFieldIdAsync(int fieldId)
        {
            var list = await _repo.GetByFieldIdAsync(fieldId);

            return list.Select(s => new FieldScheduleDTO
            {
                ScheduleId = s.ScheduleId,
                FieldId = s.FieldId,
                FieldName = s.Field?.Name,
                SlotId = s.SlotId,
                SlotName = s.Slot?.SlotName,
                StartTime = s.Slot?.StartTime,
                EndTime = s.Slot?.EndTime,
                Date = s.Date,
                Status = s.Status
            }).ToList();
        }

        //  Thêm lịch sân mới
        public async Task<FieldScheduleDTO> AddAsync(FieldScheduleDTO dto)
        {
            var schedule = new FieldSchedule
            {
                FieldId = dto.FieldId,
                SlotId = dto.SlotId,
                Date = dto.Date,
                Status = dto.Status ?? "Available"
            };

            var created = await _repo.AddAsync(schedule);

            return new FieldScheduleDTO
            {
                ScheduleId = created.ScheduleId,
                FieldId = created.FieldId,
                SlotId = created.SlotId,
                Date = created.Date,
                Status = created.Status
            };
        }

        //  Cập nhật trạng thái (ví dụ: booked / available)
        public async Task<bool> UpdateStatusAsync(int scheduleId, string status)
        {
            var schedule = await _repo.GetByIdAsync(scheduleId);
            if (schedule == null) return false;

            schedule.Status = status;
            await _repo.UpdateAsync(schedule);
            return true;
        }

        //  Xóa lịch sân
        public async Task<bool> DeleteAsync(int id)
        {
            return await _repo.DeleteAsync(id);
        }
    }
}
