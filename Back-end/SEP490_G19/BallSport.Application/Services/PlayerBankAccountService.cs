using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BallSport.Application.Services
{
    public class PlayerBankAccountService
    {
        private readonly PlayerBankAccountRepository _repository;

        public PlayerBankAccountService(PlayerBankAccountRepository repository)
        {
            _repository = repository;
        }

        public Task<List<PlayerBankAccount>> GetByUserIdAsync(int userId)
            => _repository.GetByUserIdAsync(userId);

        public Task<PlayerBankAccount?> GetByIdAsync(int bankAccountId)
            => _repository.GetByIdAsync(bankAccountId);

        public Task<PlayerBankAccount> AddAccountAsync(PlayerBankAccount account)
            => _repository.AddAsync(account);

        public Task<PlayerBankAccount?> UpdateAccountAsync(PlayerBankAccount account)
            => _repository.UpdateAsync(account);

        public Task<bool> DeleteAccountAsync(int bankAccountId)
            => _repository.DeleteAsync(bankAccountId);
    }
}
