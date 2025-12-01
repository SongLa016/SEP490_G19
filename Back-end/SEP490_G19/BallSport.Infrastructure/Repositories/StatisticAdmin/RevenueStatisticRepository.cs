 
using Microsoft.EntityFrameworkCore;
using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories.AdminStatistics
{
    public interface IRevenueStatisticRepository
    {
        Task<decimal> GetTotalRevenueAsync();
        Task<decimal> GetRevenueInMonthAsync(int year, int month);
    }

    public class RevenueStatisticRepository : IRevenueStatisticRepository
    {
        private readonly Sep490G19v1Context _context;

        public RevenueStatisticRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        // Tổng doanh thu tất cả thời gian
        public async Task<decimal> GetTotalRevenueAsync()
        {
            return await _context.Bookings
                .Where(p => p.PaymentStatus == "Paid")
                .SumAsync(p => (decimal?)p.TotalPrice ?? 0);
        }

        // Doanh thu trong 1 tháng
        public async Task<decimal> GetRevenueInMonthAsync(int year, int month)
        {
            return await _context.Bookings
                .Where(p => p.PaymentStatus == "Paid"
                            && p.CreatedAt.HasValue
                            && p.CreatedAt.Value.Year == year
                            && p.CreatedAt.Value.Month == month)
                .SumAsync(p => (decimal?)p.TotalPrice ?? 0);
        }
    }
}
