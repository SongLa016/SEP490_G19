using BallSport.Infrastructure.Repositories.OwnerStatistics;
using static BallSport.Infrastructure.Repositories.OwnerStatistics.OwnerTimeSlotStatisticRepository;

namespace BallSport.Application.Services.OwnerStatistics
{
    public class OwnerTimeSlotStatisticService
    {
        private readonly OwnerTimeSlotStatisticRepository _repo;

        public OwnerTimeSlotStatisticService(OwnerTimeSlotStatisticRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<OwnerTimeSlotPerformanceDto>> GetTimeSlotPerformanceAsync(int ownerId)
        {
            return await _repo.GetTimeSlotPerformanceAsync(ownerId);
        }
    }
}
