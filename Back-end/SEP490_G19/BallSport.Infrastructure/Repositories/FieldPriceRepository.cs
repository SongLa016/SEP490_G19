using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

public interface IFieldPriceRepository
{
    Task<List<FieldPrice>> GetAllAsync();
    Task<FieldPrice?> GetByIdAsync(int priceId);
    Task AddAsync(FieldPrice fieldPrice);
    Task UpdateAsync(FieldPrice fieldPrice);
    Task DeleteAsync(FieldPrice fieldPrice);
}

public class FieldPriceRepository : IFieldPriceRepository
{
    private readonly Sep490G19v1Context _context;

    public FieldPriceRepository(Sep490G19v1Context context)
    {
        _context = context;
    }

    public async Task<List<FieldPrice>> GetAllAsync()
    {
        return await _context.FieldPrices
            .Include(fp => fp.Field)
            .ThenInclude(f => f.Complex)
            .Include(fp => fp.Slot)
            .ToListAsync();
    }

    public async Task<FieldPrice?> GetByIdAsync(int priceId)
    {
        return await _context.FieldPrices
            .Include(fp => fp.Field)
            .ThenInclude(f => f.Complex)
            .Include(fp => fp.Slot)
            .FirstOrDefaultAsync(fp => fp.PriceId == priceId);
    }

    public async Task AddAsync(FieldPrice fieldPrice)
    {
        _context.FieldPrices.Add(fieldPrice);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(FieldPrice fieldPrice)
    {
        _context.FieldPrices.Update(fieldPrice);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(FieldPrice fieldPrice)
    {
        _context.FieldPrices.Remove(fieldPrice);
        await _context.SaveChangesAsync();
    }
}
