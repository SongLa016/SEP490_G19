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
            int pageNumber,
            int pageSize,
            string? status = null,
            string? targetType = null)
        {
            var (reports, totalCount) = await _reportRepository.GetAllReportsAsync(
                pageNumber,
                pageSize,
                status,
                targetType
            );

            var reportDtos = MapToReportDTOs(reports);

            return (reportDtos, totalCount);
        }

        public async Task<ReportDTO?> GetReportByIdAsync(int reportId)
        {
            var report = await _reportRepository.GetReportByIdAsync(reportId);
            if (report == null)
                return null;

            return MapToReportDTO(report);
        }

        public async Task<ReportDTO> CreateReportAsync(CreateReportDTO createReportDto, int reporterId)
        {
            // Kiểm tra đã báo cáo chưa
            var hasReported = await _reportRepository.HasUserReportedTargetAsync(
                reporterId,
                createReportDto.TargetType,
                createReportDto.TargetId
            );

            if (hasReported)
                throw new Exception("Bạn đã báo cáo nội dung này rồi");

            // Validate target tồn tại
            if (createReportDto.TargetType == "Post")
            {
                var post = await _postRepository.GetPostByIdAsync(createReportDto.TargetId);
                if (post == null)
                    throw new Exception("Bài viết không tồn tại");
            }
            else if (createReportDto.TargetType == "Comment")
            {
                var comment = await _commentRepository.GetCommentByIdAsync(createReportDto.TargetId);
                if (comment == null)
                    throw new Exception("Bình luận không tồn tại");
            }
            else
            {
                throw new Exception("Loại báo cáo không hợp lệ");
            }

            var report = new Report
            {
                ReporterId = reporterId,
                TargetType = createReportDto.TargetType,
                TargetId = createReportDto.TargetId,
                Reason = createReportDto.Reason
            };

            var createdReport = await _reportRepository.CreateReportAsync(report);
            return MapToReportDTO(createdReport);
        }

        public async Task<ReportDTO?> HandleReportAsync(int reportId, HandleReportDTO handleReportDto, int adminId)
        {
            var report = await _reportRepository.GetReportByIdAsync(reportId);
            if (report == null)
                return null;

            // Cập nhật trạng thái báo cáo
            var updatedReport = await _reportRepository.UpdateReportStatusAsync(
                reportId,
                handleReportDto.Status,
                adminId
            );

            if (updatedReport == null)
                return null;

            // Xử lý nội dung bị báo cáo
            if (handleReportDto.Status == "Resolved")
            {
                if (handleReportDto.Action == "Hide")
                {
                    await HideReportedContent(report.TargetType, report.TargetId);
                }
                else if (handleReportDto.Action == "Delete")
                {
                    await DeleteReportedContent(report.TargetType, report.TargetId);
                }
            }

            // Gửi thông báo cho người báo cáo
            await _notificationService.CreateNotificationAsync(new CreateNotificationDTO
            {
                UserId = report.ReporterId,
                Type = "ReportResult",
                TargetId = reportId,
                Message = $"Báo cáo của bạn đã được xử lý: {handleReportDto.Status}"
            });

            return MapToReportDTO(updatedReport);
        }

        public async Task<IEnumerable<ReportDTO>> GetReportsByReporterIdAsync(int reporterId)
        {
            var reports = await _reportRepository.GetReportsByReporterIdAsync(reporterId);
            return MapToReportDTOs(reports);
        }

        public async Task<IEnumerable<ReportDTO>> GetReportsByTargetAsync(string targetType, int targetId)
        {
            var reports = await _reportRepository.GetReportsByTargetAsync(targetType, targetId);
            return MapToReportDTOs(reports);
        }

        public async Task<IEnumerable<ReportDTO>> GetPendingReportsAsync(int topCount = 50)
        {
            var reports = await _reportRepository.GetPendingReportsAsync(topCount);
            return MapToReportDTOs(reports);
        }

        public async Task<bool> DeleteReportAsync(int reportId)
        {
            return await _reportRepository.DeleteReportAsync(reportId);
        }

        public async Task<bool> HasUserReportedAsync(int reporterId, string targetType, int targetId)
        {
            return await _reportRepository.HasUserReportedTargetAsync(reporterId, targetType, targetId);
        }

        public async Task<ReportStatsDTO> GetReportStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null)
        {
            var statistics = await _reportRepository.GetReportStatisticsAsync(fromDate, toDate);

            return new ReportStatsDTO
            {
                TotalReports = statistics.GetValueOrDefault("TotalReports", 0),
                PendingReports = statistics.GetValueOrDefault("PendingReports", 0),
                ReviewedReports = statistics.GetValueOrDefault("ReviewedReports", 0),
                ResolvedReports = statistics.GetValueOrDefault("ResolvedReports", 0),
                PostReports = statistics.GetValueOrDefault("PostReports", 0),
                CommentReports = statistics.GetValueOrDefault("CommentReports", 0),
                FromDate = fromDate,
                ToDate = toDate
            };
        }

        public async Task<int> CountReportsByStatusAsync(string status)
        {
            return await _reportRepository.CountReportsByStatusAsync(status);
        }

        public async Task<int> CountReportsByTargetAsync(string targetType, int targetId)
        {
            return await _reportRepository.CountReportsByTargetAsync(targetType, targetId);
        }

        // Helper methods
        private async Task HideReportedContent(string targetType, int targetId)
        {
            if (targetType == "Post")
            {
                var post = await _postRepository.GetPostByIdAsync(targetId);
                if (post != null)
                {
                    post.Status = "Hidden";
                    await _postRepository.UpdatePostAsync(post);
                }
            }
            else if (targetType == "Comment")
            {
                var comment = await _commentRepository.GetCommentByIdAsync(targetId);
                if (comment != null)
                {
                    comment.Status = "Hidden";
                    await _commentRepository.UpdateCommentAsync(comment);
                }
            }
        }

        private async Task DeleteReportedContent(string targetType, int targetId)
        {
            if (targetType == "Post")
            {
                await _postRepository.DeletePostAsync(targetId);
            }
            else if (targetType == "Comment")
            {
                await _commentRepository.DeleteCommentAsync(targetId);
            }
        }

        private ReportDTO MapToReportDTO(Report report)
        {
            return new ReportDTO
            {
                ReportId = report.ReportId,
                ReporterId = report.ReporterId,
                ReporterName = report.Reporter?.FullName ?? "Unknown",
                TargetType = report.TargetType,
                TargetId = report.TargetId,
                Reason = report.Reason,
                Status = report.Status,
                HandledBy = report.HandledBy,
                HandledByName = report.HandledByNavigation?.FullName,
                CreatedAt = report.CreatedAt
            };
        }

        private IEnumerable<ReportDTO> MapToReportDTOs(IEnumerable<Report> reports)
        {
            return reports.Select(MapToReportDTO).ToList();
        }
    }
}