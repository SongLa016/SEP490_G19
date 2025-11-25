using BallSport.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories.AdminStatistics
{
    public interface IAdminUserStatisticRepository
    {
        Task<int> GetTotalUsersAsync();
        Task<int> GetTotalUsersLastMonthAsync();
    }

    public class AdminUserStatisticRepository : IAdminUserStatisticRepository
    {
        private readonly Sep490G19v1Context _context;

        public AdminUserStatisticRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        // Tổng người dùng KHÔNG bao gồm Owner
        public async Task<int> GetTotalUsersAsync()
        {
            return await _context.Users
                .Where(u => u.UserRoles.All(r => r.Role.RoleName != "Owner" && r.Role.RoleName != "Admin"))
                .CountAsync();
        }

        // Tổng người dùng tháng trước KHÔNG bao gồm Owner
        public async Task<int> GetTotalUsersLastMonthAsync()
        {
            var now = DateTime.UtcNow;
            var lastMonthStart = new DateTime(now.Year, now.Month, 1).AddMonths(-1);
            var lastMonthEnd = new DateTime(now.Year, now.Month, 1).AddDays(-1);

            return await _context.Users
                .Where(u =>
                    u.CreatedAt >= lastMonthStart &&
                    u.CreatedAt <= lastMonthEnd &&
                    u.UserRoles.All(r => r.Role.RoleName != "Owner"))
                .CountAsync();
        }
    }
}
