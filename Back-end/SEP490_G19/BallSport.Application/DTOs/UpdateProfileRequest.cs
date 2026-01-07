using Microsoft.AspNetCore.Http;

namespace BallSport.Application.DTOs.UserProfile
{
    public class UpdateProfileRequest
    {
        public string? FullName { get; set; }
        public IFormFile? Avatar { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string? PreferredPositions { get; set; }
        public string? SkillLevel { get; set; }
        public string? Bio { get; set; }
    }
}
