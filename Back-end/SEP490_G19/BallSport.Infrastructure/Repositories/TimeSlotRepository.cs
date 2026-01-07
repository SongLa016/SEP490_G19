using Microsoft.EntityFrameworkCore;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Data;


public interface ITimeSlotRepository
{
    Task<List<TimeSlot>> GetAllByOwnerAsync(int ownerId);
    Task<TimeSlot?> GetByIdAsync(int slotId, int ownerId);
    Task AddAsync(TimeSlot slot);
    Task UpdateAsync(TimeSlot slot);
    Task DeleteAsync(TimeSlot slot);
}

public class TimeSlotRepository : ITimeSlotRepository
{
    private readonly Sep490G19v1Context _context;

    public TimeSlotRepository(Sep490G19v1Context context)
    {
        _context = context;
    }

    public async Task<List<TimeSlot>> GetAllByOwnerAsync(int ownerId)
    {
        return await _context.TimeSlots
            .Include(ts => ts.Field)
                .ThenInclude(f => f.Complex)
            .Where(ts => ts.Field.Complex.OwnerId == ownerId)
            .ToListAsync();
    }

    public async Task<TimeSlot?> GetByIdAsync(int slotId, int ownerId)
    {
        return await _context.TimeSlots
            .Include(ts => ts.Field)
                .ThenInclude(f => f.Complex)
            .FirstOrDefaultAsync(ts => ts.SlotId == slotId && ts.Field.Complex.OwnerId == ownerId);
    }

    public async Task AddAsync(TimeSlot slot)
    {
        _context.TimeSlots.Add(slot);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(TimeSlot slot)
    {
        _context.TimeSlots.Update(slot);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(TimeSlot slot)
    {
        _context.TimeSlots.Remove(slot);
        await _context.SaveChangesAsync();
    }
}
