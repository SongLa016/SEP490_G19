using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories.Community
{
    public interface IReportRepository
    {
        // Lấy tất cả báo cáo (có phân trang)
        Task<(IEnumerable<Report> Reports, int TotalCount)> GetAllReportsAsync(
            int pageNumber,
            int pageSize,
            string? status = null,
            string? targetType = null);

        // Lấy báo cáo theo ID
        Task<Report?> GetReportByIdAsync(int reportId);

        // Tạo báo cáo mới
        Task<Report> CreateReportAsync(Report report);

        // Cập nhật trạng thái báo cáo
        Task<Report?> UpdateReportStatusAsync(int reportId, string status, int? handledBy = null);

        // Lấy báo cáo theo người báo cáo
        Task<IEnumerable<Report>> GetReportsByReporterIdAsync(int reporterId);

        // Lấy báo cáo theo target (Post hoặc Comment)
        Task<IEnumerable<Report>> GetReportsByTargetAsync(string targetType, int targetId);

        // Kiểm tra user đã báo cáo target chưa
        Task<bool> HasUserReportedTargetAsync(int reporterId, string targetType, int targetId);

        // Đếm số báo cáo theo trạng thái
        Task<int> CountReportsByStatusAsync(string status);

        // Đếm số báo cáo của target
        Task<int> CountReportsByTargetAsync(string targetType, int targetId);

        // Lấy báo cáo chưa xử lý (pending)
        Task<IEnumerable<Report>> GetPendingReportsAsync(int topCount = 50);

        // Xóa báo cáo
        Task<bool> DeleteReportAsync(int reportId);

        // Thống kê báo cáo
        Task<Dictionary<string, int>> GetReportStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null);
    }
}