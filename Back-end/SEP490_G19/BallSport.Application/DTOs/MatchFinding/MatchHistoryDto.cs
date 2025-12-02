// 8. MatchHistoryDto.cs
namespace BallSport.Application.DTOs.MatchFinding
{
    public class MatchHistoryDto
    {
        public int HistoryId { get; set; }
        public int MatchRequestId { get; set; }
        public string Role { get; set; } = string.Empty;
        public string FinalStatus { get; set; } = string.Empty;
        public DateTime MatchDate { get; set; }
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string FieldName { get; set; } = string.Empty;
        public string ComplexName { get; set; } = string.Empty;
        public PlayerCountOption PlayerCount { get; set; }
        public int OpponentUserId { get; set; }
        public string OpponentFullName { get; set; } = string.Empty;
        public string OpponentTeamName { get; set; } = string.Empty;
        public string? OpponentPhone { get; set; }
        
        public DateTime CreatedAt { get; set; }
    }
}