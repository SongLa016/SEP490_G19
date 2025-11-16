namespace BallSport.Application.DTOs.MatchFinding
{
    public class MatchRequestDTO
    {
        public int MatchRequestId { get; set; }
        public int BookingId { get; set; }
        public int CreatedBy { get; set; }
        public string CreatorName { get; set; } = string.Empty;
        public string? CreatorPhone { get; set; }
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? CreatedAt { get; set; }

        public int? FieldId { get; set; }
        public string? FieldName { get; set; }
        public string? FieldComplexName { get; set; }
        public string? FieldAddress { get; set; }
        public DateTime? MatchDate { get; set; }
        public string? TimeSlot { get; set; }
        public decimal? TotalPrice { get; set; }

        public int ParticipantCount { get; set; }
    }
}
