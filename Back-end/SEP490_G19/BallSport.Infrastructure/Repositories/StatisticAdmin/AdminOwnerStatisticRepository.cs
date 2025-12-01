
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using BallSport.Infrastructure.Data;

namespace BallSport.Infrastructure.Repositories.AdminStatistics
{
    public interface IAdminOwnerStatisticRepository
    {
        Task<int> GetTotalOwnersAsync();
    }

    public class AdminOwnerStatisticRepository : IAdminOwnerStatisticRepository
    {
        private readonly Sep490G19v1Context _context;

        public AdminOwnerStatisticRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<int> GetTotalOwnersAsync()
        {
            return await _context.Users
                .Where(u => u.UserRoles.Any(r => r.Role.RoleName == "Owner"))
                .CountAsync();
        }
    }
}
