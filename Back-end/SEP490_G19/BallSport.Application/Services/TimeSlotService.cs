using BallSport.Application.DTOs;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Application.Services
{
    public interface ITimeSlotService
    {
        Task<List<TimeSlotReadDTO>> GetAllAsync(int ownerId);
        Task<TimeSlotReadDTO?> GetByIdAsync(int slotId, int ownerId);
        Task<TimeSlotReadDTO> CreateAsync(TimeSlotDTO dto, int ownerId);
        Task<TimeSlotReadDTO?> UpdateAsync(int slotId, TimeSlotDTO dto, int ownerId);
        Task<bool> DeleteAsync(int slotId, int ownerId);
        Task<List<TimeSlotReadDTO>> GetByFieldIdAsync(int fieldId, int ownerId);

    }

    public class TimeSlotService : ITimeSlotService
    {
        private readonly ITimeSlotRepository _repo;
        private readonly Sep490G19v1Context _context;

        public TimeSlotService(ITimeSlotRepository repo, Sep490G19v1Context context)
        {
            _repo = repo;
            _context = context;
        }

        public async Task<List<TimeSlotReadDTO>> GetAllAsync(int ownerId)
        {
            var slots = await _repo.GetAllByOwnerAsync(ownerId);
            return slots.Select(ts => new TimeSlotReadDTO
            {
                SlotId = ts.SlotId,
                SlotName = ts.SlotName,
                FieldId = ts.FieldId,
                StartTime = ts.StartTime,
                EndTime = ts.EndTime
            }).ToList();
        }

        public async Task<TimeSlotReadDTO?> GetByIdAsync(int slotId, int ownerId)
        {
            var ts = await _repo.GetByIdAsync(slotId, ownerId);
            if (ts == null) return null;
            return new TimeSlotReadDTO
            {
                SlotId = ts.SlotId,
                SlotName = ts.SlotName,
                FieldId = ts.FieldId,
                StartTime = ts.StartTime,
                EndTime = ts.EndTime
            };
        }


        // get theo id sân
        public async Task<List<TimeSlotReadDTO>> GetByFieldIdAsync(int fieldId, int ownerId)
        {
            // Kiểm tra field có thuộc owner không
            var field = await _context.Fields
                .Include(f => f.Complex)
                .FirstOrDefaultAsync(f => f.FieldId == fieldId && f.Complex.OwnerId == ownerId);

            if (field == null)
                throw new UnauthorizedAccessException("Bạn không có quyền xem slot của sân này.");

            // Lấy danh sách slot và sắp xếp theo StartTime (tăng dần)
            var slots = await _context.TimeSlots
                .Where(ts => ts.FieldId == fieldId)
                .OrderBy(ts => ts.StartTime)               // ⭐ Sắp xếp giờ từ bé đến lớn
                .Select(ts => new TimeSlotReadDTO
                {
                    SlotId = ts.SlotId,
                    SlotName = ts.SlotName,
                    FieldId = ts.FieldId,
                    StartTime = ts.StartTime,
                    EndTime = ts.EndTime
                })
                .ToListAsync();

            return slots;
        }



        public async Task<TimeSlotReadDTO> CreateAsync(TimeSlotDTO dto, int ownerId)
        {
            // Kiểm tra quyền trên Field
            var field = await _context.Fields
                .Include(f => f.Complex)
                .FirstOrDefaultAsync(f => f.FieldId == dto.FieldId && f.Complex.OwnerId == ownerId);

            if (field == null)
                throw new UnauthorizedAccessException("Bạn không có quyền thêm slot cho sân này.");

            // --- Check trùng giờ trong cùng Field ---
            var exists = await _context.TimeSlots
                .AnyAsync(ts => ts.FieldId == dto.FieldId &&
                                ts.StartTime == dto.StartTime &&
                                ts.EndTime == dto.EndTime);
            if (exists)
                throw new Exception("Sân này đã có slot trùng giờ. Vui lòng chọn khung giờ khác.");
            //Check starttime slot 2 > endtime của slot 1
            var overlap = await _context.TimeSlots
            .AnyAsync(ts => ts.FieldId == dto.FieldId &&
                    ts.StartTime < dto.EndTime &&
                    ts.EndTime > dto.StartTime);

            if (overlap)
                throw new Exception("Khung giờ này chồng lấn với slot khác của sân.");

            var slot = new TimeSlot
            {
                SlotName = dto.SlotName,
                FieldId = dto.FieldId,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime
            };

            await _repo.AddAsync(slot);

            return new TimeSlotReadDTO
            {
                SlotId = slot.SlotId,
                SlotName = slot.SlotName,
                FieldId = slot.FieldId,
                StartTime = slot.StartTime,
                EndTime = slot.EndTime
            };
        }

        public async Task<TimeSlotReadDTO?> UpdateAsync(int slotId, TimeSlotDTO dto, int ownerId)
        {
            var slot = await _repo.GetByIdAsync(slotId, ownerId);
            if (slot == null) return null;

            // --- Check trùng giờ trong cùng Field, trừ chính slot đang update ---
            var exists = await _context.TimeSlots
                .AnyAsync(ts => ts.FieldId == dto.FieldId &&
                                ts.SlotId != slotId &&
                                ts.StartTime == dto.StartTime &&
                                ts.EndTime == dto.EndTime);
            if (exists)
                throw new Exception("Sân này đã có slot trùng giờ. Vui lòng chọn khung giờ khác.");

            //Check starttime slot 2 > endtime của slot 1
            var overlap = await _context.TimeSlots
             .AnyAsync(ts => ts.FieldId == dto.FieldId &&
                    ts.SlotId != slotId &&
                    ts.StartTime < dto.EndTime &&
                    ts.EndTime > dto.StartTime);

            if (overlap)
                throw new Exception("Khung giờ này trùng với slot khác của sân. Vui lòng chọn giờ khác.");

            slot.SlotName = dto.SlotName;
            slot.StartTime = dto.StartTime;
            slot.EndTime = dto.EndTime;
            slot.FieldId = dto.FieldId;

            await _repo.UpdateAsync(slot);

            return new TimeSlotReadDTO
            {
                SlotId = slot.SlotId,
                SlotName = slot.SlotName,
                FieldId = slot.FieldId,
                StartTime = slot.StartTime,
                EndTime = slot.EndTime
            };
        }

        public async Task<bool> DeleteAsync(int slotId, int ownerId)
        {
            var slot = await _repo.GetByIdAsync(slotId, ownerId);
            if (slot == null) return false;

            await _repo.DeleteAsync(slot);
            return true;
        }
    }

}
