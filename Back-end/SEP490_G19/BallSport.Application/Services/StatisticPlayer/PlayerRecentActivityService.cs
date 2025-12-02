using System.Collections.Generic;
using System.Threading.Tasks;
using BallSport.Infrastructure.Repositories.PlayerStatistics;

namespace BallSport.Application.Services
{
    public class PlayerRecentActivityService
    {
        private readonly IPlayerRecentActivityRepository _repository;

        public PlayerRecentActivityService(IPlayerRecentActivityRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<PlayerRecentActivityRepository.PlayerRecentActivity>> GetRecentActivitiesAsync(int userId, int top = 10)
        {
            return await _repository.GetRecentActivitiesAsync(userId, top);
        }
    }
}
