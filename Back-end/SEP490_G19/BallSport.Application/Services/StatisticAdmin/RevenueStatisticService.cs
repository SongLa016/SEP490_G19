using BallSport.Infrastructure.Repositories.AdminStatistics;

namespace BallSport.Application.Services.AdminStatistics
{
    public class RevenueStatisticService
    {
        private readonly IRevenueStatisticRepository _repo;

        public RevenueStatisticService(IRevenueStatisticRepository repo)
        {
            _repo = repo;
        }

        public async Task<object> GetRevenueStatisticAsync()
        {
            decimal totalRevenue = await _repo.GetTotalRevenueAsync();

            var now = DateTime.UtcNow;

            decimal currentMonthRevenue =
                await _repo.GetRevenueInMonthAsync(now.Year, now.Month);

            var prev = now.AddMonths(-1);

            decimal previousMonthRevenue =
                await _repo.GetRevenueInMonthAsync(prev.Year, prev.Month);

            decimal percentChange = 0;

            if (previousMonthRevenue > 0)
            {
                percentChange =
                    ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
            }
            else if (currentMonthRevenue > 0)
            {
                percentChange = 100;
            }

            return new
            {
                totalRevenue,
                currentMonthRevenue,
                previousMonthRevenue,
                percentChange = Math.Round(percentChange, 2)
            };
        }
    }
}
