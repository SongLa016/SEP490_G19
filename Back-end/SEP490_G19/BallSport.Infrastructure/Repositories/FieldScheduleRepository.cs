using System;
 
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

public interface IFieldScheduleRepository
{
    Task<FieldSchedule> AddAsync(FieldSchedule schedule);
    Task<FieldSchedule?> GetByIdAsync(int id);
    Task<List<FieldSchedule>> GetAllAsync();
    Task UpdateAsync(FieldSchedule schedule);
    Task DeleteAsync(FieldSchedule schedule);
}

public class FieldScheduleRepository : IFieldScheduleRepository
{
    private readonly Sep490G19v1Context _context;

    public FieldScheduleRepository(Sep490G19v1Context context)
    {
        _context = context;
    }

    public async Task<FieldSchedule> AddAsync(FieldSchedule schedule)
    {
        _context.FieldSchedules.Add(schedule);
        await _context.SaveChangesAsync();
        return schedule;
    }

    public async Task<FieldSchedule?> GetByIdAsync(int id)
    {
        return await _context.FieldSchedules
            .Include(fs => fs.Field)
            .Include(fs => fs.Slot)
            .FirstOrDefaultAsync(fs => fs.ScheduleId == id);
    }

    public async Task<List<FieldSchedule>> GetAllAsync()
    {
        return await _context.FieldSchedules
            .Include(fs => fs.Field)
            .Include(fs => fs.Slot)
            .ToListAsync();
    }

    public async Task UpdateAsync(FieldSchedule schedule)
    {
        _context.FieldSchedules.Update(schedule);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(FieldSchedule schedule)
    {
        _context.FieldSchedules.Remove(schedule);
        await _context.SaveChangesAsync();
    }
}
