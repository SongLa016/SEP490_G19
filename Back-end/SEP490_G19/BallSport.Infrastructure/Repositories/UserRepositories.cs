using BallSport.Infrastructure;
 
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Infrastructure.Repositories
{
    public class UserRepositories
    {
        private readonly Sep490G19v1Context _context;

        public UserRepositories(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<User?> GetByIdAsync(int userId)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        }

        public User? GetUserByPhone(string phone)
        {
            return _context.Users.FirstOrDefault(u => u.Phone == phone);
        }

        public User? GetUserByEmail(string email)
        {
            return _context.Users.FirstOrDefault(u => u.Email == email);
        }

        public void AddUser(User user)
        {
            _context.Users.Add(user);
            _context.SaveChanges();
        }

        public string GenerateRandomPassword(int length = 12)
        {
            const string validChars = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*?_-";
            var randomBytes = new byte[length];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }

            var chars = randomBytes.Select(b => validChars[b % validChars.Length]);
            return new string(chars.ToArray());
        }

        public Role? GetPlayerRole()
        {
            return _context.Roles.FirstOrDefault(r => r.RoleName == "Player");
        }

        public void UpdateUser(User user)
        {
            _context.Users.Update(user);
            _context.SaveChanges();
        }

        public string GenerateOtp(int length = 6)
        {
            var random = new Random();
            return string.Concat(Enumerable.Range(0, length).Select(_ => random.Next(0, 10)));
        }


        public void AddUserRole(int userId, int roleId)
        {
            var userRole = new UserRole
            {
                UserId = userId,
                RoleId = roleId
            };

            _context.UserRoles.Add(userRole);
            _context.SaveChanges();
        }


        public bool IsEmailExists(string email)
        {
            return _context.Users.Any(u => u.Email == email);
        }

        public bool IsPhoneExists(string phone)
        {
            return _context.Users.Any(u => u.Phone == phone);
        }

        public Role? GetRoleByName(string roleName)
        {
            return _context.Roles.FirstOrDefault(r => r.RoleName == roleName);
        }

        public UserProfile? GetUserProfileByUserId(int userId)
        {
            return _context.UserProfiles.FirstOrDefault(p => p.UserId == userId);
        }

        public void AddOrUpdateUserProfile(UserProfile profile)
        {
            var existing = _context.UserProfiles.FirstOrDefault(p => p.UserId == profile.UserId);
            if (existing == null)
            {
                _context.UserProfiles.Add(profile);
            }
            else
            {
                existing.DateOfBirth = profile.DateOfBirth;
                existing.Gender = profile.Gender;
                existing.Address = profile.Address;
                existing.PreferredPositions = profile.PreferredPositions;
                existing.SkillLevel = profile.SkillLevel;
                existing.Bio = profile.Bio;
            }
            _context.SaveChanges();
        }

        public List<string> GetRolesByUserId(int userId)
        {
            return _context.UserRoles
                .Where(ur => ur.UserId == userId)
                .Select(ur => ur.Role.RoleName)
                .ToList();
        }

        public async Task<string?> GetUserRoleAsync(int userId)
        {
            return await _context.UserRoles
                .Where(ur => ur.UserId == userId)
                .Select(ur => ur.Role.RoleName)
                .FirstOrDefaultAsync();
        }


    }
}
