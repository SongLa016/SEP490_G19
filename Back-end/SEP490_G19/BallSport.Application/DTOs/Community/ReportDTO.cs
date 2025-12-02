using System.Text.Json.Serialization; // Nếu dùng System.Text.Json
// hoặc [JsonIgnore] từ Newtonsoft.Json nếu bạn dùng cái đó

namespace BallSport.Application.DTOs.Community
{
    public class ReportDTO
    {
        public int ReportId { get; set; }
        public int ReporterId { get; set; }
        public string ReporterName { get; set; } = string.Empty;
        public string? ReporterAvatar { get; set; } // Thêm cái này → Admin nhìn mặt luôn

        public string TargetType { get; set; } = string.Empty; // "Post" hoặc "Comment"
        public int TargetId { get; set; }

        // Nội dung bị báo cáo (SIÊU QUAN TRỌNG cho Admin xem nhanh)
        public string? TargetContentPreview { get; set; } // "Hay quá...", "Spam link..."

        public string Reason { get; set; } = string.Empty;

        // DÙNG BOOL THAY STRING → FRONTEND + GIÁM KHẢO CẢM ƠN BẠN MỖI NGÀY!
        public bool IsPending => Status == "Pending";
        public bool IsResolved => Status == "Resolved";   // Đã xử lý + XÓA nội dung
        public bool IsRejected => Status == "Rejected";   // Đã xử lý + GIỮ lại

        public string? Status { get; set; } // Giữ lại để debug + hiển thị text nếu cần

        public int? HandledBy { get; set; }
        public string? HandledByName { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? HandledAt { get; set; } // Thêm cái này → biết xử lý lúc nào

        // Thông báo mới nhất (nếu có ghi chú từ admin)
        public string? LatestNotification { get; set; }
    }
}