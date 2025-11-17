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
        Task<List<TimeSlotDTO>> GetPublicByFieldIdAsync(int fieldId);
    }

    public class TimeSlotService : ITimeSlotService
    {
        private readonly ITimeSlotRepository _repo;
        private readonly Sep490v1Context _context;

        public TimeSlotService(ITimeSlotRepository repo, Sep490v1Context context)
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
                EndTime = ts.EndTime,
                Price = ts.Price
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
                EndTime = ts.EndTime,
                Price = ts.Price
            };
        }

        public async Task<List<TimeSlotReadDTO>> GetByFieldIdAsync(int fieldId, int ownerId)
        {
            var field = await _context.Fields
                .Include(f => f.Complex)
                .FirstOrDefaultAsync(f => f.FieldId == fieldId);

            if (field == null)
                throw new Exception("FieldId không tồn tại");

            if (field.Complex.OwnerId != ownerId)
                throw new UnauthorizedAccessException("Bạn không có quyền xem slot của sân này.");

            var slots = await _context.TimeSlots
                .Where(ts => ts.FieldId == fieldId)
                .OrderBy(ts => ts.StartTime)
                .ToListAsync();

            return slots.Select(ts => new TimeSlotReadDTO
            {
                SlotId = ts.SlotId,
                SlotName = ts.SlotName,
                FieldId = ts.FieldId,
                StartTime = ts.StartTime,
                EndTime = ts.EndTime,
                Price = ts.Price
            }).ToList();
        }

        public async Task<List<TimeSlotDTO>> GetPublicByFieldIdAsync(int fieldId)
        {
            var slots = await _context.TimeSlots
                .Where(s => s.FieldId == fieldId)
                .OrderBy(s => s.StartTime)
                .ToListAsync();

            return slots.Select(s => new TimeSlotDTO
            {
                SlotId = s.SlotId,
                FieldId = s.FieldId,
                SlotName = s.SlotName,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                Price = s.Price
            }).ToList();
        }

        public async Task<TimeSlotReadDTO> CreateAsync(TimeSlotDTO dto, int ownerId)
        {
            var field = await _context.Fields
                .Include(f => f.Complex)
                .FirstOrDefaultAsync(f => f.FieldId == dto.FieldId);

            if (field == null)
                throw new Exception("FieldId không tồn tại");

            if (field.Complex.OwnerId != ownerId)
                throw new UnauthorizedAccessException("Bạn không có quyền thêm slot cho sân này.");

            // Check slot chồng giờ trong cùng Field
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
                EndTime = dto.EndTime,
                Price = dto.Price
            };

            await _repo.AddAsync(slot);

            return new TimeSlotReadDTO
            {
                SlotId = slot.SlotId,
                SlotName = slot.SlotName,
                FieldId = slot.FieldId,
                StartTime = slot.StartTime,
                EndTime = slot.EndTime,
                Price = slot.Price
            };
        }

        public async Task<TimeSlotReadDTO?> UpdateAsync(int slotId, TimeSlotDTO dto, int ownerId)
        {
            var slot = await _repo.GetByIdAsync(slotId, ownerId);
            if (slot == null) return null;

            var field = await _context.Fields
                .Include(f => f.Complex)
                .FirstOrDefaultAsync(f => f.FieldId == dto.FieldId);

            if (field == null)
                throw new Exception("FieldId không tồn tại");

            if (field.Complex.OwnerId != ownerId)
                throw new UnauthorizedAccessException("Bạn không có quyền sửa slot cho sân này.");

            var overlap = await _context.TimeSlots
                .AnyAsync(ts => ts.FieldId == dto.FieldId &&
                                ts.SlotId != slotId &&
                                ts.StartTime < dto.EndTime &&
                                ts.EndTime > dto.StartTime);

            if (overlap)
                throw new Exception("Khung giờ này chồng lấn với slot khác của sân.");

            slot.SlotName = dto.SlotName;
            slot.StartTime = dto.StartTime;
            slot.EndTime = dto.EndTime;
            slot.FieldId = dto.FieldId;
            slot.Price = dto.Price;

            await _repo.UpdateAsync(slot);

            return new TimeSlotReadDTO
            {
                SlotId = slot.SlotId,
                SlotName = slot.SlotName,
                FieldId = slot.FieldId,
                StartTime = slot.StartTime,
                EndTime = slot.EndTime,
                Price = slot.Price
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
