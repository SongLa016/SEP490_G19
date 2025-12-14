using System;
 
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using BallSport.Infrastructure.Data;

public interface IFieldTypeRepository
{
    Task<List<FieldType>> GetAllAsync();
    Task<FieldType?> GetByIdAsync(int typeId);
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
}
