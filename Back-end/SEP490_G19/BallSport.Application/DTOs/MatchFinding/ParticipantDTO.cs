namespace BallSport.Application.DTOs.MatchFinding
{
    public class ParticipantDTO
    {
        public int ParticipantId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? UserAvatar { get; set; }
        public string? UserPhone { get; set; }
        public string? TeamInfo { get; set; }
        public bool IsCreator { get; set; }
        public DateTime? JoinedAt { get; set; }
    }
}