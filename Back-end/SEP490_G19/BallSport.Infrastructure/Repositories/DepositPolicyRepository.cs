using BallSport.Infrastructure;
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

        // Lấy tất cả chính sách đặt cọc
        public async Task<List<DepositPolicy>> GetAllAsync()
        {
            return await _context.DepositPolicies
                .Include(dp => dp.Field)
                .ToListAsync();
        }

        // Lấy theo sân
        public async Task<DepositPolicy?> GetByFieldIdAsync(int fieldId)
        {
            return await _context.DepositPolicies
                .Include(dp => dp.Field)
                .FirstOrDefaultAsync(dp => dp.FieldId == fieldId);
        }

        // Thêm mới
        public async Task<DepositPolicy> AddAsync(DepositPolicy policy)
        {
            _context.DepositPolicies.Add(policy);
            await _context.SaveChangesAsync();
            return policy;
        }

        // Cập nhật
        public async Task<bool> UpdateAsync(DepositPolicy policy)
        {
            var existing = await _context.DepositPolicies.FindAsync(policy.DepositPolicyId);
            if (existing == null) return false;

            existing.DepositPercent = policy.DepositPercent;
            existing.MinDeposit = policy.MinDeposit;
            existing.MaxDeposit = policy.MaxDeposit;
            await _context.SaveChangesAsync();
            return true;
        }

        // Xóa
        public async Task<bool> DeleteAsync(int id)
        {
            var policy = await _context.DepositPolicies.FindAsync(id);
            if (policy == null) return false;

            _context.DepositPolicies.Remove(policy);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
