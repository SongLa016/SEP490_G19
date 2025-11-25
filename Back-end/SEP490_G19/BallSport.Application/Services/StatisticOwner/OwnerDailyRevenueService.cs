using BallSport.Infrastructure.Repositories.StatisticOwner;
using static BallSport.Infrastructure.Repositories.StatisticOwner.DailyRevenueRepository;

namespace BallSport.Application.Services.StatisticOwner
{
    public class OwnerDailyRevenueService
    {
        private readonly IDailyRevenueRepository _repo;

        public OwnerDailyRevenueService(IDailyRevenueRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<DailyRevenue>> GetDailyRevenueAsync(int ownerId)
        {
            var data = await _repo.GetDailyRevenueAsync(ownerId);

            
            foreach (var item in data)
            {
                item.DayName = GetVietnameseDayName(item.Date.DayOfWeek);
            }

            return data;
        }

        private string GetVietnameseDayName(DayOfWeek day)
        {
            return day switch
            {
                DayOfWeek.Monday => "Thứ 2",
                DayOfWeek.Tuesday => "Thứ 3",
                DayOfWeek.Wednesday => "Thứ 4",
                DayOfWeek.Thursday => "Thứ 5",
                DayOfWeek.Friday => "Thứ 6",
                DayOfWeek.Saturday => "Thứ 7",
                DayOfWeek.Sunday => "Chủ nhật",
                _ => ""
            };
        }
    }
}
