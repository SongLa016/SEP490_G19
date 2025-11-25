// 7. MatchParticipantDto.cs
namespace BallSport.Application.DTOs.MatchFinding
{
    public class MatchParticipantDto
    {
        public int ParticipantId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public PlayerCountOption PlayerCount { get; set; }
        public string? ContactPhone { get; set; }
        public string? Note { get; set; }
        public string StatusFromB { get; set; } = "Pending";
        public string StatusFromA { get; set; } = "Accepted";
        public DateTime JoinedAt { get; set; }
        public bool IsMe { get; set; }
    }
}