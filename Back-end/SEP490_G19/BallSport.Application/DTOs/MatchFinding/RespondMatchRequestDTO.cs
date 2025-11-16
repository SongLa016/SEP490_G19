using System.ComponentModel.DataAnnotations;

namespace BallSport.Application.DTOs.MatchFinding
{
    public class RespondMatchRequestDTO
    {
        [Required(ErrorMessage = "ParticipantID là bắt buộc")]
        public int ParticipantId { get; set; }

        [Required(ErrorMessage = "Action là bắt buộc")]
        [RegularExpression("^(Accept|Reject)$", ErrorMessage = "Action phải là Accept hoặc Reject")]
        public string Action { get; set; } = string.Empty;
    }
}