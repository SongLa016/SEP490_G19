using BallSport.Infrastructure.Repositories.StatisticOwner;
using System.Threading.Tasks;

namespace BallSport.Application.Services.StatisticOwner
{
    public class OwnerSummaryService
    {
        private readonly IOwnerSummaryRepository _repo;

        public OwnerSummaryService(IOwnerSummaryRepository repo)
        {
            _repo = repo;
        }

        public Task<decimal> GetTotalRevenueAsync(int ownerId)
        {
            return _repo.GetTotalRevenueAsync(ownerId);
        }

        public Task<int> GetTotalBookingAsync(int ownerId)
        {
            return _repo.GetTotalBookingAsync(ownerId);
        }
    }
}
