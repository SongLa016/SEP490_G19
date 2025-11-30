using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BallSport.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories
{

    public class PlayerProfileDto
    {
        public string FullName { get; set; } = null!;
        public string? Phone { get; set; }
        public string Email { get; set; } = null!;
        public string? Avatar { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
        public string? PreferredPositions { get; set; }
        public string? SkillLevel { get; set; }
    }
    public interface IPlayerProfileRepository
    {
        Task<PlayerProfileDto?> GetProfileByUserIdAsync(int userId);
    }
    public class PlayerProfileRepository : IPlayerProfileRepository
    {
        private readonly Sep490G19v1Context _context;


        public PlayerProfileRepository(Sep490G19v1Context context)
        {
            _context = context;
        }


        public async Task<PlayerProfileDto?> GetProfileByUserIdAsync(int userId)
        {
            var user = await _context.Users
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(u => u.UserId == userId);


            if (user == null)
                return null;


            return new PlayerProfileDto
            {
                FullName = user.FullName,
                Phone = user.Phone,
                Email = user.Email,
                Avatar = user.Avatar,
                DateOfBirth = user.UserProfile?.DateOfBirth,
                Gender = user.UserProfile?.Gender,
                Address = user.UserProfile?.Address,
                PreferredPositions = user.UserProfile?.PreferredPositions,
                SkillLevel = user.UserProfile?.SkillLevel
            };
        }
    }
}
