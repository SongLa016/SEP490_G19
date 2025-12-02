// 9. UserInfoDto.cs
namespace BallSport.Application.DTOs.MatchFinding
{
    public class UserInfoDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
    }
}