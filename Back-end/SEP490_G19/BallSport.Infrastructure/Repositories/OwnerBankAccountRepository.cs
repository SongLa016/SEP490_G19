using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

public class OwnerBankAccountRepository : IOwnerBankAccountRepository
{
    private readonly Sep490G19v1Context _context;
    public OwnerBankAccountRepository(Sep490G19v1Context context)
    {
        _context = context;
    }

    public async Task<OwnerBankAccount> GetDefaultByFieldIdAsync(int fieldId)
    {
        // Lấy ComplexId của sân
        var complexId = await _context.Fields
            .Where(f => f.FieldId == fieldId)
            .Select(f => f.ComplexId)
            .FirstOrDefaultAsync();

        if (complexId == null)
            return null;

        // Lấy OwnerId của Complex
        var ownerId = await _context.FieldComplexes
            .Where(c => c.ComplexId == complexId)
            .Select(c => c.OwnerId)
            .FirstOrDefaultAsync();

        if (ownerId == 0)
            return null;

        // Lấy tài khoản ngân hàng mặc định của chủ sân
        return await _context.OwnerBankAccounts
            .Where(a => a.IsDefault == true && a.OwnerId == ownerId)
            .FirstOrDefaultAsync();
    }

}
