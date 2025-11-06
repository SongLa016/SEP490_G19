using System.ComponentModel.DataAnnotations;

namespace BallSport.Application.DTOs.MatchFinding
{
    public class JoinMatchRequestDTO
    {
        [Required(ErrorMessage = "MatchRequestID là bắt buộc")]
        public int MatchRequestId { get; set; }

        [MaxLength(255, ErrorMessage = "Thông tin đội không được vượt quá 255 ký tự")]
        public string? TeamInfo { get; set; }
    }
}