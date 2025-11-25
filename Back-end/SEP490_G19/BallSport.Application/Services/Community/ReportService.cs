// File: BallSport.Application.Services/Community/ReportService.cs
using BallSport.Application.Common.Extensions; // THÊM DÒNG NÀY – BẮT BUỘC!
using BallSport.Application.DTOs.Community;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories.Community;

namespace BallSport.Application.Services.Community
{
    public class ReportService : IReportService
    {
        private readonly IReportRepository _reportRepository;
        private readonly IPostRepository _postRepository;
        private readonly ICommentRepository _commentRepository;
        private readonly INotificationService _notificationService;

        public ReportService(
            IReportRepository reportRepository,
            IPostRepository postRepository,
            ICommentRepository commentRepository,
            INotificationService notificationService)
        {
            _reportRepository = reportRepository;
            _postRepository = postRepository;
            _commentRepository = commentRepository;
            _notificationService = notificationService;
        }

        public async Task<(IEnumerable<ReportDTO> Reports, int TotalCount)> GetAllReportsAsync(
            int pageNumber, int pageSize, string? status = null, string? targetType = null)
        {
            var (reports, totalCount) = await _reportRepository.GetAllReportsAsync(pageNumber, pageSize, status, targetType);
            return (MapToReportDTOs(reports), totalCount);
        }

        public async Task<ReportDTO?> GetReportByIdAsync(int reportId)
        {
            var report = await _reportRepository.GetReportByIdAsync(reportId);
            return report == null ? null : MapToReportDTO(report);
        }

        public async Task<ReportDTO> CreateReportAsync(CreateReportDTO dto, int reporterId)
        {
            var hasReported = await _reportRepository.HasUserReportedTargetAsync(reporterId, dto.TargetType, dto.TargetId);
            if (hasReported)
                throw new InvalidOperationException("Bạn đã báo cáo nội dung này rồi.");

            if (dto.TargetType == "Post")
            {
                var post = await _postRepository.GetPostByIdAsync(dto.TargetId);
                if (post == null) throw new InvalidOperationException("Bài viết không tồn tại.");
            }
            else if (dto.TargetType == "Comment")
            {
                var comment = await _commentRepository.GetCommentByIdAsync(dto.TargetId);
                if (comment == null) throw new InvalidOperationException("Bình luận không tồn tại.");
            }
            else
            {
                throw new InvalidOperationException("Loại nội dung không hợp lệ.");
            }

            var report = new Report
            {
                ReporterId = reporterId,
                TargetType = dto.TargetType,
                TargetId = dto.TargetId,
                Reason = dto.Reason.Trim(),
                CreatedAt = DateTime.UtcNow, // DB lưu UTC → đúng chuẩn
                Status = "Pending"
            };

            var created = await _reportRepository.CreateReportAsync(report);
            return MapToReportDTO(created);
        }

        public async Task<ReportDTO?> HandleReportAsync(int reportId, HandleReportDTO dto, int adminId)
        {
            var report = await _reportRepository.GetReportByIdAsync(reportId);
            if (report == null) return null;

            var updatedReport = await _reportRepository.UpdateReportStatusAsync(reportId, dto.Status, adminId);
            if (updatedReport == null) return null;

            if (dto.Status == "Resolved" && dto.Action == "Delete")
            {
                await DeleteReportedContent(report.TargetType, report.TargetId);
            }

            string message = dto.Status == "Resolved"
                ? "Báo cáo của bạn đã được chấp nhận. Nội dung vi phạm đã bị xóa vĩnh viễn."
                : "Báo cáo của bạn đã được xem xét. Nội dung này không vi phạm quy định.";

            if (!string.IsNullOrWhiteSpace(dto.AdminNote))
                message += $" Ghi chú từ Admin: {dto.AdminNote}";

            await _notificationService.CreateNotificationAsync(new CreateNotificationDTO
            {
                UserId = report.ReporterId,
                Type = "ReportResult",
                TargetId = reportId,
                Message = message
            });

            return MapToReportDTO(updatedReport);
        }

        private async Task DeleteReportedContent(string targetType, int targetId)
        {
            if (targetType == "Post")
                await _postRepository.HardDeletePostAsync(targetId);
            else if (targetType == "Comment")
                await _commentRepository.HardDeleteCommentAsync(targetId);
        }

        public async Task<IEnumerable<ReportDTO>> GetReportsByReporterIdAsync(int reporterId)
            => MapToReportDTOs(await _reportRepository.GetReportsByReporterIdAsync(reporterId));

        public async Task<IEnumerable<ReportDTO>> GetReportsByTargetAsync(string targetType, int targetId)
            => MapToReportDTOs(await _reportRepository.GetReportsByTargetAsync(targetType, targetId));

        public async Task<IEnumerable<ReportDTO>> GetPendingReportsAsync(int topCount = 50)
            => MapToReportDTOs(await _reportRepository.GetPendingReportsAsync(topCount));

        public async Task<bool> DeleteReportAsync(int reportId)
            => await _reportRepository.DeleteReportAsync(reportId);

        public async Task<bool> HasUserReportedAsync(int reporterId, string targetType, int targetId)
            => await _reportRepository.HasUserReportedTargetAsync(reporterId, targetType, targetId);

        public async Task<ReportStatsDTO> GetReportStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null)
        {
            var stats = await _reportRepository.GetReportStatisticsAsync(fromDate, toDate);
            return new ReportStatsDTO
            {
                TotalReports = stats.GetValueOrDefault("TotalReports", 0),
                PendingReports = stats.GetValueOrDefault("PendingReports", 0),
                ResolvedReports = stats.GetValueOrDefault("ResolvedReports", 0),
                RejectedReports = stats.GetValueOrDefault("RejectedReports", 0),
                PostReports = stats.GetValueOrDefault("PostReports", 0),
                CommentReports = stats.GetValueOrDefault("CommentReports", 0),
                FromDate = fromDate,
                ToDate = toDate
            };
        }

        public async Task<int> CountReportsByStatusAsync(string status)
            => await _reportRepository.CountReportsByStatusAsync(status);

        public async Task<int> CountReportsByTargetAsync(string targetType, int targetId)
            => await _reportRepository.CountReportsByTargetAsync(targetType, targetId);

        // CHỈ SỬA 1 DÒNG DUY NHẤT Ở ĐÂY – GIỜ VIỆT NAM ĐÚNG MÃI MÃI!
        private ReportDTO MapToReportDTO(Report report) => new()
        {
            ReportId = report.ReportId,
            ReporterId = report.ReporterId,
            ReporterName = report.Reporter?.FullName ?? "Người dùng ẩn danh",
            TargetType = report.TargetType,
            TargetId = report.TargetId,
            Reason = report.Reason,
            Status = report.Status ?? "Pending",
            HandledBy = report.HandledBy,
            HandledByName = report.HandledByNavigation?.FullName ?? "-",
            // DÒNG THẦN THÁNH – FIX +07:00 HOÀN TOÀN!
            CreatedAt = report.CreatedAt?.ToVietnamTime() ?? DateTimeExtensions.VietnamNow
        };

        private IEnumerable<ReportDTO> MapToReportDTOs(IEnumerable<Report> reports)
            => reports.Select(MapToReportDTO);
    }
}