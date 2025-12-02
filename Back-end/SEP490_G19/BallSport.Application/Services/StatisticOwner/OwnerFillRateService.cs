using BallSport.Infrastructure.Repositories.StatisticOwner;
using System.Threading.Tasks;

namespace BallSport.Application.Services.StatisticOwner
{
    public class OwnerFillRateService
    {
        private readonly IOwnerFillRateRepository _repo;

        public OwnerFillRateService(IOwnerFillRateRepository repo)
        {
            _repo = repo;
        }

        public async Task<double> GetFillRateAsync(int ownerId)
        {
            return await _repo.GetFillRateAsync(ownerId);
        }
    }
}
