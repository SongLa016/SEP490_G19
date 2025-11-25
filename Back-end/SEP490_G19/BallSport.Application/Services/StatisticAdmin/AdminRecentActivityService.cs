using BallSport.Infrastructure.Repositories.AdminStatistics;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BallSport.Application.Services.AdminStatistics
{
    public class AdminRecentActivityService
    {
        private readonly IRecentActivityRepository _repository;

        public AdminRecentActivityService(IRecentActivityRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<RecentActivityRepository.RecentActivity>> GetRecentActivitiesAsync(int top = 20)
        {
            return await _repository.GetRecentActivitiesAsync(top);
        }
    }
}
