using BallSport.Infrastructure.Repositories.AdminStatistics;

namespace BallSport.Application.Services.AdminStatistics
{
    public class AdminOwnerStatisticService
    {
        private readonly IAdminOwnerStatisticRepository _repo;

        public AdminOwnerStatisticService(IAdminOwnerStatisticRepository repo)
        {
            _repo = repo;
        }

        public async Task<object> GetTotalOwnersAsync()
        {
            var totalOwners = await _repo.GetTotalOwnersAsync();

            return new
            {
                totalOwners
            };
        }
    }
}
