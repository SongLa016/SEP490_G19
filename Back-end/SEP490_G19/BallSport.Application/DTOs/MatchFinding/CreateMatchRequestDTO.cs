// 3. CreateMatchRequestDto.cs
using System.ComponentModel.DataAnnotations;

namespace BallSport.Application.DTOs.MatchFinding
{
    public class CreateMatchRequestDto
    {
        [Required] public int BookingId { get; set; }
        [StringLength(500)] public string? Description { get; set; }
        [Required] public PlayerCountOption PlayerCount { get; set; } = PlayerCountOption.Seven;
        public int? ExpiresInHours { get; set; } = 48;
    }
}