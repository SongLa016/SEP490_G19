using System.Globalization;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using BallSport.Infrastructure.Data;
using static BallSport.Infrastructure.Repositories.StatisticOwner.DailyRevenueRepository;

namespace BallSport.Infrastructure.Repositories.StatisticOwner
{
    public interface IDailyRevenueRepository
    {
        Task<List<DailyRevenue>> GetDailyRevenueAsync(int ownerId);
    }

    public class DailyRevenueRepository : IDailyRevenueRepository
    {
        private readonly Sep490G19v1Context _context;

        public DailyRevenueRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<List<DailyRevenue>> GetDailyRevenueAsync(int ownerId)
        {
            var result = await _context.Bookings
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Field)
                        .ThenInclude(f => f.Complex)
                .Where(b => b.Schedule.Field.Complex.OwnerId == ownerId)
                .GroupBy(b => b.CreatedAt.HasValue ? b.CreatedAt.Value.Date : DateTime.MinValue)
                .Select(g => new DailyRevenue
                {
                    Date = g.Key,
                    TotalRevenue = g.Sum(x => x.TotalPrice)
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            return result;
        }


        public class DailyRevenue
        {
            public DateTime Date { get; set; }
            public string DayName { get; set; } = "";
            public decimal TotalRevenue { get; set; }
        }
    }
}
