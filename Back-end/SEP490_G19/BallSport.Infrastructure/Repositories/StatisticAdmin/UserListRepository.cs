 
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using static BallSport.Infrastructure.Repositories.AdminStatistics.UserListRepository;

namespace BallSport.Infrastructure.Repositories.AdminStatistics
{
    public interface IUserListRepository
    {
        Task<List<UserListDto>> GetAllNonAdminUsersAsync();
    }

    public class UserListRepository : IUserListRepository
    {
        private readonly Sep490G19v1Context _context;

        public UserListRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<List<UserListDto>> GetAllNonAdminUsersAsync()
        {
            return await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .Where(u => !u.UserRoles.Any(r => r.Role.RoleName == "Admin"))
                .Select(u => new UserListDto
                {
                    UserId = u.UserId,
                    FullName = u.FullName,
                    Email = u.Email,
                    Phone = u.Phone,
                    RoleName = u.UserRoles.First().Role.RoleName
                })
                .ToListAsync();
        }
        public class UserListDto
        {
            public int UserId { get; set; }
            public string FullName { get; set; } = null!;
            public string Email { get; set; } = null!;
            public string? Phone { get; set; }
            public string RoleName { get; set; } = null!;
        }
    }
}
