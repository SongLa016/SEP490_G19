using BallSport.Infrastructure.Models;
using System.Threading.Tasks;

namespace BallSport.Infrastructure.Repositories
{
    public interface IOwnerBankAccountRepository
    {
        Task<OwnerBankAccount> GetDefaultByFieldIdAsync(int fieldId);
    }
}
