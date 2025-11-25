using BallSport.Infrastructure.Repositories.AdminStatistics;

namespace BallSport.Application.Services.AdminStatistics
{
    public class AdminUserStatisticService
    {
        private readonly IAdminUserStatisticRepository _repo;

        public AdminUserStatisticService(IAdminUserStatisticRepository repo)
        {
            _repo = repo;
        }

        public async Task<object> GetUserStatisticsAsync()
        {
            var totalUsers = await _repo.GetTotalUsersAsync();
            var lastMonthUsers = await _repo.GetTotalUsersLastMonthAsync();

            double percentage = 0;

            if (lastMonthUsers > 0)
            {
                percentage = ((double)(totalUsers - lastMonthUsers) / lastMonthUsers) * 100;
            }

            return new
            {
                totalUsers,
                percentageChange = Math.Round(percentage, 2)
            };
        }
    }
}
