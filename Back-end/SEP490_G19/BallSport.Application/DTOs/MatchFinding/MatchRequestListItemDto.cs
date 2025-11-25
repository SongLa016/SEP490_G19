// 5. MatchRequestListItemDto.cs
namespace BallSport.Application.DTOs.MatchFinding
{
    public class MatchRequestListItemDto
    {
        public int MatchRequestId { get; set; }
        public string FieldName { get; set; } = string.Empty;
        public string ComplexName { get; set; } = string.Empty;
        public DateTime MatchDate { get; set; }
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public PlayerCountOption PlayerCount { get; set; }
        public string CreatorTeamName { get; set; } = string.Empty;
        public int JoinedCount { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool IsMyRequest { get; set; }
    }
}