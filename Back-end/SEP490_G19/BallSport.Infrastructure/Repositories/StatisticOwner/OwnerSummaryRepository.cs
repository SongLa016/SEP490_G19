using System.Threading.Tasks;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories.StatisticOwner
{
    public interface IOwnerSummaryRepository
    {
        Task<decimal> GetTotalRevenueAsync(int ownerId);
        Task<int> GetTotalBookingAsync(int ownerId);
    }

    public class OwnerSummaryRepository : IOwnerSummaryRepository
    {
        private readonly Sep490G19v1Context _context;

        public OwnerSummaryRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<decimal> GetTotalRevenueAsync(int ownerId)
        {
            return await _context.Bookings
                .Where(b => b.Schedule.Field.Complex.OwnerId == ownerId)
                .SumAsync(b => b.TotalPrice); 
        }

        public async Task<int> GetTotalBookingAsync(int ownerId)
        {
            return await _context.Bookings
                .CountAsync(b => b.Schedule.Field.Complex.OwnerId == ownerId);
        }
    }
}
