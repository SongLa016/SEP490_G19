using System;
using System.Threading.Tasks;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories.AdminStatistics
{
    public interface IPostStatisticRepository
    {
        Task<int> GetPostsOfThisMonthAsync();
        Task<int> GetPostsOfLastMonthAsync();
        Task<int> GetTotalPostsAsync();
    }

    public class PostStatisticRepository : IPostStatisticRepository
    {
        private readonly Sep490G19v1Context _context;

        public PostStatisticRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<int> GetPostsOfThisMonthAsync()
        {
            var now = DateTime.UtcNow;
            var start = new DateTime(now.Year, now.Month, 1);
            var end = start.AddMonths(1);

            return await _context.Posts
                .Where(p => p.CreatedAt >= start && p.CreatedAt < end)
                .CountAsync();
        }

        public async Task<int> GetPostsOfLastMonthAsync()
        {
            var now = DateTime.UtcNow;
            var start = new DateTime(now.Year, now.Month, 1).AddMonths(-1);
            var end = start.AddMonths(1);

            return await _context.Posts
                .Where(p => p.CreatedAt >= start && p.CreatedAt < end)
                .CountAsync();
        }

        public async Task<int> GetTotalPostsAsync()
        {
            return await _context.Posts.CountAsync();
        }
    }
}
