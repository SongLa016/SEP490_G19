using BallSport.Application.DTOs.Community;

namespace BallSport.Application.Services.Community
{
    public interface IReportService
    {
        // Lấy tất cả báo cáo (Admin) - có phân trang
        Task<(IEnumerable<ReportDTO> Reports, int TotalCount)> GetAllReportsAsync(
            int pageNumber,
            int pageSize,
            string? status = null,
            string? targetType = null);

        // Lấy chi tiết báo cáo
        Task<ReportDTO?> GetReportByIdAsync(int reportId);

        // Tạo báo cáo mới
        Task<ReportDTO> CreateReportAsync(CreateReportDTO createReportDto, int reporterId);

        // Xử lý báo cáo (Admin)
        Task<ReportDTO?> HandleReportAsync(int reportId, HandleReportDTO handleReportDto, int adminId);

        // Lấy báo cáo của user (người đã báo cáo)
        Task<IEnumerable<ReportDTO>> GetReportsByReporterIdAsync(int reporterId);

        // Lấy báo cáo theo target (Post hoặc Comment)
        Task<IEnumerable<ReportDTO>> GetReportsByTargetAsync(string targetType, int targetId);

        // Lấy báo cáo chưa xử lý
        Task<IEnumerable<ReportDTO>> GetPendingReportsAsync(int topCount = 50);

        // Xóa báo cáo (Admin)
        Task<bool> DeleteReportAsync(int reportId);

        // Kiểm tra user đã báo cáo target chưa
        Task<bool> HasUserReportedAsync(int reporterId, string targetType, int targetId);

        // Thống kê báo cáo
        Task<ReportStatsDTO> GetReportStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null);

        // Đếm số báo cáo theo trạng thái
        Task<int> CountReportsByStatusAsync(string status);

        // Đếm số báo cáo của target
        Task<int> CountReportsByTargetAsync(string targetType, int targetId);
    }
}