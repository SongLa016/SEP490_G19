using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.Services
{
    public class OwnerBankAccountService
    {
        private readonly OwnerBankAccountRepository _ownerBankAccountRepository;

        public OwnerBankAccountService(OwnerBankAccountRepository ownerBankAccountRepository)
        {
            _ownerBankAccountRepository = ownerBankAccountRepository;
        }

        public async Task AddOwnerBankAccountAsync(OwnerBankAccount account)
        {
            await _ownerBankAccountRepository.AddOwnerBankAccountAsync(account);
        }

       
        public IEnumerable<OwnerBankAccount> GetAccountsByOwner(int ownerId)
        {
            return _ownerBankAccountRepository.GetAccountsByOwner(ownerId);
        }

        public async Task UpdateOwnerBankAccountAsync(OwnerBankAccount account)
        {
            await _ownerBankAccountRepository.UpdateOwnerBankAccountAsync(account);
        }

        public async Task<bool> DeleteOwnerBankAccountAsync(int bankAccountId)
        {
            return await _ownerBankAccountRepository.DeleteOwnerBankAccountAsync(bankAccountId);
        }

    }
}
