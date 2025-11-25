using BallSport.Infrastructure.Repositories.AdminStatistics;

namespace BallSport.Application.Services.AdminStatistics
{
    public class BookingStatisticService
    {
        private readonly IBookingStatisticRepository _repo;

        public BookingStatisticService(IBookingStatisticRepository repo)
        {
            _repo = repo;
        }

        public async Task<object> GetBookingStatisticAsync()
        {
            var total = await _repo.GetTotalBookingsAsync();

            var now = DateTime.UtcNow;

            int currentMonth = await _repo.GetBookingsInMonthAsync(now.Year, now.Month);

            var previousMonthDate = now.AddMonths(-1);
            int previousMonth = await _repo.GetBookingsInMonthAsync(previousMonthDate.Year, previousMonthDate.Month);

            decimal percentChange = 0;

            if (previousMonth > 0)
            {
                percentChange = ((decimal)(currentMonth - previousMonth) / previousMonth) * 100;
            }
            else if (currentMonth > 0)
            {
                percentChange = 100; // tăng 100% vì tháng trước không có booking
            }

            return new
            {
                totalBookings = total,
                currentMonth,
                previousMonth,
                percentChange = Math.Round(percentChange, 2)
            };
        }
    }
}
