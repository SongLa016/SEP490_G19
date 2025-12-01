 
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BallSport.Infrastructure.Repositories
{
    public class PlayerBankAccountRepository
    {
        private readonly Sep490G19v1Context _context;

        public PlayerBankAccountRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<List<PlayerBankAccount>> GetByUserIdAsync(int userId)
        {
            return await _context.PlayerBankAccounts
                                 .Where(p => p.UserId == userId)
                                 .ToListAsync();
        }

        public async Task<PlayerBankAccount?> GetByIdAsync(int bankAccountId)
        {
            return await _context.PlayerBankAccounts
                                 .FirstOrDefaultAsync(p => p.BankAccountId == bankAccountId);
        }

        public async Task<PlayerBankAccount> AddAsync(PlayerBankAccount account)
        {
            _context.PlayerBankAccounts.Add(account);
            await _context.SaveChangesAsync();
            return account;
        }

        public async Task<PlayerBankAccount?> UpdateAsync(PlayerBankAccount account)
        {
            var existing = await _context.PlayerBankAccounts.FindAsync(account.BankAccountId);
            if (existing == null) return null;

            existing.BankName = account.BankName;
            existing.BankShortCode = account.BankShortCode;
            existing.AccountNumber = account.AccountNumber;
            existing.AccountHolder = account.AccountHolder;
            existing.IsDefault = account.IsDefault;
            existing.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(int bankAccountId)
        {
            var existing = await _context.PlayerBankAccounts.FindAsync(bankAccountId);
            if (existing == null) return false;

            _context.PlayerBankAccounts.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
