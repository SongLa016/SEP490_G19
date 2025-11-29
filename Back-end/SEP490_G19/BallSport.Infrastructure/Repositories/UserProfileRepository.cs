using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories
{
    public class UserProfileRepository
    {
        private readonly Sep490G19v1Context _context;

        public UserProfileRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<UserFullProfileDto?> GetFullProfileAsync(int userId)
        {
            return await _context.Users
                .Where(u => u.UserId == userId)
                .Select(u => new UserFullProfileDto
                {
                    FullName = u.FullName,
                    Phone = u.Phone,
                    Avatar = u.Avatar,
                    Email = u.Email,
                    DateOfBirth = u.UserProfile != null ? u.UserProfile.DateOfBirth : null,
                    Gender = u.UserProfile != null ? u.UserProfile.Gender : null,
                    Address = u.UserProfile != null ? u.UserProfile.Address : null,
                    PreferredPositions = u.UserProfile != null ? u.UserProfile.PreferredPositions : null,
                    SkillLevel = u.UserProfile != null ? u.UserProfile.SkillLevel : null,
                    Bio = u.UserProfile != null ? u.UserProfile.Bio : null
                })
                .FirstOrDefaultAsync();
        }


        public async Task<UserBasicProfileDto?> GetBasicProfileAsync(int userId)
        {
            return await _context.Users
                .Where(u => u.UserId == userId)
                .Select(u => new UserBasicProfileDto
                {
                    FullName = u.FullName,
                    Phone = u.Phone,
                    Avatar = u.Avatar,
                    Email = u.Email
                })
                .FirstOrDefaultAsync();
        }

        public async Task<bool> UpdateFullProfileAsync(int userId, UserFullProfileDto dto)
        {
            var user = await _context.Users
                .Include(u => u.UserProfile)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                return false;

            user.FullName = dto.FullName;
            user.Avatar = dto.Avatar;

            if (user.UserProfile == null)
            {
                user.UserProfile = new UserProfile { UserId = userId };
            }
            user.UserProfile.DateOfBirth = dto.DateOfBirth;
            user.UserProfile.Gender = dto.Gender;
            user.UserProfile.Address = dto.Address;
            user.UserProfile.PreferredPositions = dto.PreferredPositions;
            user.UserProfile.SkillLevel = dto.SkillLevel;
            user.UserProfile.Bio = dto.Bio;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateBasicProfileAsync(int userId, UserBasicProfileDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                return false;

            user.FullName = dto.FullName;
            user.Phone = dto.Phone;
            user.Avatar = dto.Avatar;

            await _context.SaveChangesAsync();
            return true;
        }

        //profile admim/ owner
        public class UserBasicProfileDto
        {
            public string FullName { get; set; }
            public string? Phone { get; set; }
            public string? Avatar { get; set; }
            public string Email { get; set; }
        }
        
        //profile Player
        public class UserFullProfileDto
        {
            public string FullName { get; set; }
            public string? Phone { get; set; }
            public string? Avatar { get; set; }
            public string Email { get; set; }
            public DateOnly? DateOfBirth { get; set; }
            public string? Gender { get; set; }
            public string? Address { get; set; }
            public string? PreferredPositions { get; set; }
            public string? SkillLevel { get; set; }
            public string? Bio { get; set; }
        }

        
    }
}
