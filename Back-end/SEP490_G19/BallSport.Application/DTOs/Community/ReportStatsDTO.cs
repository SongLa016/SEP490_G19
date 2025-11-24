// File: BallSport.Application.DTOs.Community/ReportStatsDTO.cs
namespace BallSport.Application.DTOs.Community
{
    public class ReportStatsDTO
    {
        public int TotalReports { get; set; }
        public int PendingReports { get; set; }

        // ĐÃ ĐỔI TÊN CHO ĐÚNG VỚI HỆ THỐNG CỦA BẠN
        public int ResolvedReports { get; set; }   // Đã xử lý + XÓA nội dung
        public int RejectedReports { get; set; }   // Đã xử lý + GIỮ lại (thay cho ReviewedReports)

        public int PostReports { get; set; }
        public int CommentReports { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
}