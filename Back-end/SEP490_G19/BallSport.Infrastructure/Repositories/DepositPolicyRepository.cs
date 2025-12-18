using System;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories
{
    public class DepositPolicyRepository
    {
        private readonly Sep490G19v1Context _context;

        public DepositPolicyRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        //  Owner lấy tất cả policy của mình
        public async Task<List<DepositPolicy>> GetAllByOwnerAsync(int ownerId)
        {
            return await _context.DepositPolicies
                .Include(dp => dp.Field)
                    .ThenInclude(f => f.Complex)
                .Where(dp =>
                    dp.Field != null &&
                    dp.Field.Complex != null &&
                    dp.Field.Complex.OwnerId == ownerId
                )
                .ToListAsync();
        }

        //  Lấy theo field + owner
        public async Task<DepositPolicy?> GetByFieldIdAsync(int fieldId, int ownerId)
        {
            return await _context.DepositPolicies
                .Include(dp => dp.Field)
                    .ThenInclude(f => f.Complex)
                .FirstOrDefaultAsync(dp =>
                    dp.FieldId == fieldId &&
                    dp.Field != null &&
                    dp.Field.Complex != null &&
                    dp.Field.Complex.OwnerId == ownerId
                );
        }

        //  Check quyền
        public async Task<bool> IsFieldOwnedByOwnerAsync(int fieldId, int ownerId)
        {
            return await _context.Fields
                .AnyAsync(f =>
                    f.FieldId == fieldId &&
                    f.Complex != null &&
                    f.Complex.OwnerId == ownerId
                );
        }

        public async Task<DepositPolicy> AddAsync(DepositPolicy entity)
        {
            _context.DepositPolicies.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<bool> UpdateAsync(DepositPolicy entity)
        {
            _context.DepositPolicies.Update(entity);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var dp = await _context.DepositPolicies.FindAsync(id);
            if (dp == null) return false;

            _context.DepositPolicies.Remove(dp);
            return await _context.SaveChangesAsync() > 0;
        }
    }


}
