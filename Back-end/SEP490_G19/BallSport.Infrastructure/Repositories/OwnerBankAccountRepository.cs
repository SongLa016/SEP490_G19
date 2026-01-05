
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories
{
    public class OwnerBankAccountRepository
    {
        private readonly Sep490G19v1Context _context;

        public OwnerBankAccountRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task AddOwnerBankAccountAsync(OwnerBankAccount account)
        {

            if (account.IsDefault == true)
            {

                var existingDefaults = _context.OwnerBankAccounts
                    .Where(x => x.OwnerId == account.OwnerId && x.IsDefault == true);

                foreach (var acc in existingDefaults)
                    acc.IsDefault = false;
            }


            account.CreatedAt = DateTime.Now;
            account.UpdatedAt = DateTime.Now;

            _context.OwnerBankAccounts.Add(account);
            await _context.SaveChangesAsync();
        }

        public IEnumerable<OwnerBankAccount> GetAccountsByOwner(int ownerId)
        {
            return _context.OwnerBankAccounts
                .Where(x => x.OwnerId == ownerId)
                .ToList();
        }

        public async Task<OwnerBankAccount?> GetByIdAsync(int bankAccountId)
        {
            return await _context.OwnerBankAccounts
                                 .FirstOrDefaultAsync(b => b.BankAccountId == bankAccountId);
        }

        public async Task UpdateOwnerBankAccountAsync(OwnerBankAccount account)
        {
            var existing = await _context.OwnerBankAccounts.FindAsync(account.BankAccountId);
            if (existing == null) return;

            existing.BankName = account.BankName;
            existing.BankShortCode = account.BankShortCode;
            existing.AccountNumber = account.AccountNumber;
            existing.AccountHolder = account.AccountHolder;
            existing.IsDefault = account.IsDefault;
            existing.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
        }

        public async Task<bool> DeleteOwnerBankAccountAsync(int bankAccountId)
        {
            var existing = await _context.OwnerBankAccounts.FindAsync(bankAccountId);
            if (existing == null) return false;

            _context.OwnerBankAccounts.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }

    }
}
