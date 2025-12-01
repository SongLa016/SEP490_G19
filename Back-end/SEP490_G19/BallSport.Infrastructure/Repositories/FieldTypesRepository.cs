using System;
 
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

public interface IFieldTypeRepository
{
    Task<List<FieldType>> GetAllAsync();
    Task<FieldType?> GetByIdAsync(int typeId);
    Task AddAsync(FieldType entity);
    Task UpdateAsync(FieldType entity);
    Task DeleteAsync(FieldType entity);
}

public class FieldTypeRepository : IFieldTypeRepository
{
    private readonly Sep490G19v1Context _context;

    public FieldTypeRepository(Sep490G19v1Context context)
    {
        _context = context;
    }

    public async Task<List<FieldType>> GetAllAsync() =>
        await _context.FieldTypes.ToListAsync();

    public async Task<FieldType?> GetByIdAsync(int typeId) =>
        await _context.FieldTypes
            .Include(ft => ft.Fields) // cần để kiểm tra owner
            .FirstOrDefaultAsync(ft => ft.TypeId == typeId);

    public async Task AddAsync(FieldType entity)
    {
        await _context.FieldTypes.AddAsync(entity);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(FieldType entity)
    {
        _context.FieldTypes.Update(entity);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(FieldType entity)
    {
        _context.FieldTypes.Remove(entity);
        await _context.SaveChangesAsync();
    }
}
