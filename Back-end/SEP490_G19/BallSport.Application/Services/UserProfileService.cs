using BallSport.Application.DTOs;
using BallSport.Application.DTOs.UserProfile;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using static BallSport.Infrastructure.Repositories.UserProfileRepository;

namespace BallSport.Application.Services
{
    public class UserProfileService
    {
        private readonly UserProfileRepository _userProfileRepository;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly Sep490G19v1Context _db;
        public UserProfileService(UserProfileRepository userProfileRepository, Sep490G19v1Context db, ICloudinaryService cloudinaryService)
        {
            _db = db;
            _userProfileRepository = userProfileRepository;
            _cloudinaryService = cloudinaryService;
        }

        public async Task<object?> GetProfileAsync(int userId, string role)
        {
            if (role == "Player")
            {
                return await _userProfileRepository.GetFullProfileAsync(userId);
            }

            // Owner hoặc Admin
            return await _userProfileRepository.GetBasicProfileAsync(userId);
        }

        public async Task<UpdateProfileDto> UpdateProfileAsync(int userId, string role, UpdateProfileRequest request)
        {
            var user = await _db.Users
                .Include(u => u.UserProfile)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                throw new Exception("User not found");

            role = role?.Trim().ToLower(); 

            if (request.Avatar != null && request.Avatar.Length > 0)
            {
                var avatarUrl = await _cloudinaryService.UploadImageAsync(request.Avatar);
                user.Avatar = avatarUrl;
            }

            if (!string.IsNullOrWhiteSpace(request.FullName))
                user.FullName = request.FullName;


            if (role.Equals("Player", StringComparison.OrdinalIgnoreCase))
            {
                if (user.UserProfile == null)
                {
                    user.UserProfile = new UserProfile
                    {
                        UserId = userId
                    };
                }

                user.UserProfile.DateOfBirth = request.DateOfBirth ?? user.UserProfile.DateOfBirth;
                user.UserProfile.Gender = request.Gender ?? user.UserProfile.Gender;
                user.UserProfile.Address = request.Address ?? user.UserProfile.Address;
                user.UserProfile.PreferredPositions = request.PreferredPositions ?? user.UserProfile.PreferredPositions;
                user.UserProfile.SkillLevel = request.SkillLevel ?? user.UserProfile.SkillLevel;
                user.UserProfile.Bio = request.Bio ?? user.UserProfile.Bio;
            }

            await _db.SaveChangesAsync();

            return new UpdateProfileDto
            {
                FullName = user.FullName,
                AvatarUrl = user.Avatar,
                DateOfBirth = user.UserProfile?.DateOfBirth,
                Gender = user.UserProfile?.Gender,
                Address = user.UserProfile?.Address,
                PreferredPositions = user.UserProfile?.PreferredPositions,
                SkillLevel = user.UserProfile?.SkillLevel,
                Bio = user.UserProfile?.Bio
            };
        }
        public async Task<UpdateBasicProfileDto> UpdateBasicProfileAsync(int userId, UpdateBasicProfileRequest request)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                throw new Exception("User not found");

            if (request.Avatar != null && request.Avatar.Length > 0)
            {
                var avatarUrl = await _cloudinaryService.UploadImageAsync(request.Avatar);
                user.Avatar = avatarUrl;
            }

            if (!string.IsNullOrWhiteSpace(request.FullName))
                user.FullName = request.FullName;


            await _db.SaveChangesAsync();

            return new UpdateBasicProfileDto
            {
                FullName = user.FullName,
                AvatarUrl = user.Avatar
            };
        }

    }
}
