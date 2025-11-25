// 10. MatchSuccessData.cs
namespace BallSport.Application.DTOs.MatchFinding
{
    public class MatchSuccessData
    {
        public int MatchRequestId { get; set; }
        public int BookingId { get; set; }
        public string FieldName { get; set; } = string.Empty;
        public string ComplexName { get; set; } = string.Empty;
        public DateTime MatchDate { get; set; }
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public UserInfoDto Opponent { get; set; } = new();
        public string OpponentTeamName { get; set; } = string.Empty;
        public string OpponentPhone { get; set; } = string.Empty;
    }
}