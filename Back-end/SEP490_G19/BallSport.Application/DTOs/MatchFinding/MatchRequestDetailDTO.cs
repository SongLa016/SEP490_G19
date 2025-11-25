// 6. MatchRequestDetailDto.cs
using System.Collections.Generic;

namespace BallSport.Application.DTOs.MatchFinding
{
    public class MatchRequestDetailDto
    {
        public int MatchRequestId { get; set; }
        public int BookingId { get; set; }
        public string FieldName { get; set; } = string.Empty;
        public string ComplexName { get; set; } = string.Empty;
        public DateTime MatchDate { get; set; }
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string Status { get; set; } = "Open";
        public int CreatorUserId { get; set; }
        public string CreatorFullName { get; set; } = string.Empty;
        public string CreatorTeamName { get; set; } = string.Empty;
        public PlayerCountOption PlayerCount { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool IsOwner { get; set; }
        public bool HasJoined { get; set; }
        public string MyStatus { get; set; } = "None";
        public List<MatchParticipantDto> Participants { get; set; } = new();
    }
}