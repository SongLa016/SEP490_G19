using System.ComponentModel.DataAnnotations;

namespace BallSport.Application.DTOs.Community
{
    public class HandleReportDTO
    {
        [Required(ErrorMessage = "Status là bắt buộc")]
        [RegularExpression("^(Reviewed|Resolved|Rejected)$",
            ErrorMessage = "Status phải là: Reviewed, Resolved, hoặc Rejected")]
        public string Status { get; set; } = "Reviewed";

        [RegularExpression("^(Hide|Delete|None)$",
            ErrorMessage = "Action phải là: Hide, Delete, hoặc None")]
        public string? Action { get; set; }  // Hide: ẩn nội dung, Delete: xóa nội dung, None: không làm gì

        [MaxLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự")]
        public string? AdminNote { get; set; }
    }
}