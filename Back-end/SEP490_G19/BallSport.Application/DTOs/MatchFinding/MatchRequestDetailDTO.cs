namespace BallSport.Application.DTOs.MatchFinding
{
    public class MatchRequestDetailDTO
    {
        public int MatchRequestId { get; set; }
        public int BookingId { get; set; }
        public int CreatedBy { get; set; }
        public string CreatorName { get; set; } = string.Empty;
        public string? CreatorAvatar { get; set; }
        public string? CreatorPhone { get; set; }
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? CreatedAt { get; set; }

        public BookingInfoDTO? BookingInfo { get; set; }
        public List<ParticipantDTO> Participants { get; set; } = new();
    }
}