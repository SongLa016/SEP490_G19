using System.ComponentModel.DataAnnotations;

namespace BallSport.Application.DTOs.MatchFinding
{
    public class CreateMatchRequestDTO
    {
        [Required(ErrorMessage = "BookingID là bắt buộc")]
        public int BookingId { get; set; }

        [MaxLength(500, ErrorMessage = "Mô tả không được vượt quá 500 ký tự")]
        public string? Description { get; set; }
    }
}