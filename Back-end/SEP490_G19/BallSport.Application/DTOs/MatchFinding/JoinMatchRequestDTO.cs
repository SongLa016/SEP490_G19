// 4. JoinMatchRequestDto.cs
using System.ComponentModel.DataAnnotations;

namespace BallSport.Application.DTOs.MatchFinding
{
    public class JoinMatchRequestDto
    {
        [Required, StringLength(100)] public string TeamName { get; set; } = string.Empty;
        [Required] public PlayerCountOption PlayerCount { get; set; } = PlayerCountOption.Seven;
        [Phone, StringLength(20)] public string? ContactPhone { get; set; }
        [StringLength(255)] public string? Note { get; set; }
    }
}