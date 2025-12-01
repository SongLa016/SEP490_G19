using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories
{
    public class PlayRepository
    {
        private readonly Sep490G19v1Context _db;

        public PlayRepository(Sep490G19v1Context db)
        {
            _db = db;
        }
        // tổng lượt đặt sân
        public async Task<int> GetTotalBookingsAsync(int userId)
        {
            return await _db.Bookings
                .CountAsync(b => b.UserId == userId);
        }
        // tổng giờ chơi
        public async Task<double> GetTotalPlayingHoursAsync(int userId)
        {
            var bookings = await _db.Bookings
                .Where(b => b.UserId == userId && b.BookingStatus == "Completed")
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Slot)
                .ToListAsync();

            double totalHours = 0;

            foreach (var b in bookings)
            {
                if (b.Schedule?.Slot == null)
                    continue;

                TimeOnly start = b.Schedule.Slot.StartTime;
                TimeOnly end = b.Schedule.Slot.EndTime;

                totalHours += (end.ToTimeSpan() - start.ToTimeSpan()).TotalHours;
            }

            return totalHours;
        }
        // tổng tiền đã thanh toán
        public async Task<decimal> GetTotalSpendingAsync(int userId)
        {
            return await _db.Bookings
                .Where(b => b.UserId == userId
                            && b.BookingStatus == "Completed"
                            && b.PaymentStatus == "Paid")
                .SumAsync(b => b.TotalPrice);
        }
        // thống kê theo tháng
        public async Task<List<MonthlyPlayerStatsDto>> GetMonthlyStatsAsync(int userId)
        {
            var bookings = await _db.Bookings
        .Include(b => b.Schedule)
            .ThenInclude(s => s.Slot)
        .Where(b => b.UserId == userId)
        .ToListAsync();

            var result = bookings
                .GroupBy(b => b.Schedule.Date.Month)
                .Select(g => new MonthlyPlayerStatsDto
                {
                    Month = g.Key,
                    TotalBookings = g.Count(),
                    TotalPlayingHours = g
                        .Where(b => b.BookingStatus == "Completed" &&
                                    b.PaymentStatus == "Paid")
                        .Sum(b => (b.Schedule.Slot.EndTime - b.Schedule.Slot.StartTime).TotalHours),

                    TotalSpending = g
                        .Where(b => b.BookingStatus == "Completed" &&
                                    b.PaymentStatus == "Paid")
                        .Sum(b => b.TotalPrice)
                })
                .OrderBy(r => r.Month)
                .ToList();

            return result;
        }
        public async Task<double> GetAverageStarsByUserAsync(int userId)
        {
            var ratings = await _db.Ratings
                .Where(r => r.UserId == userId)
                .Select(r => r.Stars)
                .ToListAsync();

            if (ratings.Count == 0)
                return 0;

            return ratings.Average();
        }
        public class MonthlyPlayerStatsDto
        {
            public int Month { get; set; }
            public int TotalBookings { get; set; }
            public double TotalPlayingHours { get; set; }
            public decimal TotalSpending { get; set; }
        }
    }
}
