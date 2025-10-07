using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;

namespace BallSport.Application.Services
{
    public class TimeSlotService
    {
        private readonly TimeSlotRepository _repo;

        public TimeSlotService(TimeSlotRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<TimeSlotDTO>> GetAllAsync()
        {
            var list = await _repo.GetAllAsync();
            return list.Select(s => new TimeSlotDTO
            {
                SlotId = s.SlotId,
                SlotName = s.SlotName,
                StartTime = s.StartTime,
                EndTime = s.EndTime
            }).ToList();
        }

        public async Task<TimeSlotDTO?> GetByIdAsync(int id)
        {
            var s = await _repo.GetByIdAsync(id);
            if (s == null) return null;

            return new TimeSlotDTO
            {
                SlotId = s.SlotId,
                SlotName = s.SlotName,
                StartTime = s.StartTime,
                EndTime = s.EndTime
            };
        }

        public async Task<TimeSlotDTO> AddAsync(TimeSlotDTO dto)
        {
            var slot = new TimeSlot
            {
                SlotName = dto.SlotName,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime
            };
            var created = await _repo.AddAsync(slot);

            dto.SlotId = created.SlotId;
            return dto;
        }

        public async Task<TimeSlotDTO?> UpdateAsync(TimeSlotDTO dto)
        {
            var slot = new TimeSlot
            {
                SlotId = dto.SlotId,
                SlotName = dto.SlotName,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime
            };

            var updated = await _repo.UpdateAsync(slot);
            if (updated == null) return null;

            return new TimeSlotDTO
            {
                SlotId = updated.SlotId,
                SlotName = updated.SlotName,
                StartTime = updated.StartTime,
                EndTime = updated.EndTime
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _repo.DeleteAsync(id);
        }
    }
}
