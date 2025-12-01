
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories.AdminStatistics
{
    public interface IBookingStatisticRepository
    {
        Task<int> GetTotalBookingsAsync();
        Task<int> GetBookingsInMonthAsync(int year, int month);
    }

    public class BookingStatisticRepository : IBookingStatisticRepository
    {
        private readonly Sep490G19v1Context _context;

        public BookingStatisticRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<int> GetTotalBookingsAsync()
        {
            return await _context.Bookings.CountAsync();
        }

        public async Task<int> GetBookingsInMonthAsync(int year, int month)
        {
            return await _context.Bookings
                .Where(b => b.CreatedAt.HasValue &&
                            b.CreatedAt.Value.Year == year &&
                            b.CreatedAt.Value.Month == month)
                .CountAsync();
        }
    }
}
