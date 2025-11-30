using BallSport.Application.DTOs.StatisticPlayer;
using BallSport.Infrastructure.Repositories;

namespace BallSport.Application.Services
{
    public class PlayerStatisticService
    {
        private readonly PlayerBookingRepository _bookingRepo;

        public PlayerStatisticService(PlayerBookingRepository bookingRepo)
        {
            _bookingRepo = bookingRepo;
        }

        public async Task<int> GetTotalBookingsAsync(int userId)
        {
            return await _bookingRepo.GetTotalBookingsAsync(userId);
        }

        public async Task<PlayerStatsDto> GetTotalPlayingHoursAsync(int userId)
        {
            var totalHours = await _bookingRepo.GetTotalPlayingHoursAsync(userId);

            return new PlayerStatsDto
            {
                TotalPlayingHours = totalHours
            };
        }
        public async Task<PlayerSpendingDTO> GetTotalSpendingAsync(int userId)
        {
            var totalSpending = await _bookingRepo.GetTotalSpendingAsync(userId);

            return new PlayerSpendingDTO
            {
                TotalSpending = totalSpending
            };
        }
        public async Task<List<MonthlyPlayerStatsDto>> GetMonthlyStatsAsync(int userId)
        {
            var repoStats = await _bookingRepo.GetMonthlyStatsAsync(userId);
            return repoStats.Select(s => new MonthlyPlayerStatsDto
            {
                Month = s.Month,
                TotalBookings = s.TotalBookings,
                TotalPlayingHours = s.TotalPlayingHours,
                TotalSpending = s.TotalSpending
            }).ToList();
        }

    }
}
