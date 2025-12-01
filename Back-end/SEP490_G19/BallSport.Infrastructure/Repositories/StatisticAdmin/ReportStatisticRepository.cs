 
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BallSport.Infrastructure.Repositories.AdminStatistics
{
    public interface IReportStatisticRepository
    {
        Task<int> GetReportsCountByMonthAsync(int year, int month);
        Task<int> GetPendingReportsCountByMonthAsync(int year, int month);
    }

    public class ReportStatisticRepository : IReportStatisticRepository
    {
        private readonly Sep490G19v1Context _context;

        public ReportStatisticRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<int> GetReportsCountByMonthAsync(int year, int month)
        {
            return await _context.Reports
                .Where(r => r.CreatedAt.HasValue &&
                            r.CreatedAt.Value.Year == year &&
                            r.CreatedAt.Value.Month == month)
                .CountAsync();
        }
        public async Task<int> GetPendingReportsCountByMonthAsync(int year, int month)
        {
            return await _context.Reports
                .Where(r => r.CreatedAt.HasValue &&
                            r.CreatedAt.Value.Year == year &&
                            r.CreatedAt.Value.Month == month &&
                            r.Status == "Pending")
                .CountAsync();
        }
    }
}
