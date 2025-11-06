namespace BallSport.Application.DTOs.MatchFinding
{
    public class MyMatchDTO
    {
        public int MatchRequestId { get; set; }
        public string Role { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? OpponentName { get; set; }
        public string? OpponentPhone { get; set; }
        public DateTime? MatchDate { get; set; }
        public string? TimeSlot { get; set; }
        public string? FieldName { get; set; }
        public string? FieldAddress { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}