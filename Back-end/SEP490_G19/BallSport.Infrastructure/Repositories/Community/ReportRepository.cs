// File: ReportRepository.cs – COPY TOÀN BỘ CÁI NÀY!
 
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using BallSport.Infrastructure.Data;

namespace BallSport.Infrastructure.Repositories.Community
{
    public class ReportRepository : IReportRepository
    {
        private readonly Sep490G19v1Context _context;
        public ReportRepository(Sep490G19v1Context context) => _context = context;

        public async Task<(IEnumerable<Report> Reports, int TotalCount)> GetAllReportsAsync(
            int pageNumber, int pageSize, string? status = null, string? targetType = null)
        {
            var query = _context.Reports
                .Include(r => r.Reporter)
                .Include(r => r.HandledByNavigation)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(r => r.Status == status);
            if (!string.IsNullOrEmpty(targetType))
                query = query.Where(r => r.TargetType == targetType);

            query = query.OrderByDescending(r => r.CreatedAt);
            var totalCount = await query.CountAsync();
            var reports = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

            return (reports, totalCount);
        }

        public async Task<Report?> GetReportByIdAsync(int reportId)
            => await _context.Reports.Include(r => r.Reporter).Include(r => r.HandledByNavigation)
                .FirstOrDefaultAsync(r => r.ReportId == reportId);

        public async Task<Report> CreateReportAsync(Report report)
        {
            report.CreatedAt = DateTime.UtcNow;
            report.Status ??= "Pending";
            _context.Reports.Add(report);
            await _context.SaveChangesAsync();
            return report;
        }

        public async Task<Report?> UpdateReportStatusAsync(int reportId, string status, int? handledBy = null)
        {
            var report = await _context.Reports.FindAsync(reportId);
            if (report == null) return null;
            report.Status = status;
            report.HandledBy = handledBy;
            await _context.SaveChangesAsync();
            return report;
        }

        public async Task<IEnumerable<Report>> GetReportsByReporterIdAsync(int reporterId)
            => await _context.Reports.Where(r => r.ReporterId == reporterId)
                .Include(r => r.Reporter).Include(r => r.HandledByNavigation)
                .OrderByDescending(r => r.CreatedAt).ToListAsync();

        public async Task<IEnumerable<Report>> GetReportsByTargetAsync(string targetType, int targetId)
            => await _context.Reports.Where(r => r.TargetType == targetType && r.TargetId == targetId)
                .Include(r => r.Reporter).Include(r => r.HandledByNavigation)
                .OrderByDescending(r => r.CreatedAt).ToListAsync();

        public async Task<bool> HasUserReportedTargetAsync(int reporterId, string targetType, int targetId)
            => await _context.Reports.AnyAsync(r => r.ReporterId == reporterId && r.TargetType == targetType && r.TargetId == targetId);

        public async Task<int> CountReportsByStatusAsync(string status)
            => await _context.Reports.CountAsync(r => r.Status == status);

        public async Task<int> CountReportsByTargetAsync(string targetType, int targetId)
            => await _context.Reports.CountAsync(r => r.TargetType == targetType && r.TargetId == targetId);

        public async Task<IEnumerable<Report>> GetPendingReportsAsync(int topCount = 50)
            => await _context.Reports
                .Include(r => r.Reporter)
                .Where(r => r.Status == "Pending" || r.Status == null)
                .OrderByDescending(r => r.CreatedAt)
                .Take(topCount)
                .ToListAsync();

        public async Task<bool> DeleteReportAsync(int reportId)
        {
            var report = await _context.Reports.FindAsync(reportId);
            if (report == null) return false;
            _context.Reports.Remove(report);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Dictionary<string, int>> GetReportStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null)
        {
            var query = _context.Reports.AsQueryable();
            if (fromDate.HasValue) query = query.Where(r => r.CreatedAt >= fromDate.Value);
            if (toDate.HasValue) query = query.Where(r => r.CreatedAt <= toDate.Value);

            var result = await query
                .GroupBy(x => 1)
                .Select(g => new
                {
                    TotalReports = g.Count(),
                    PendingReports = g.Count(x => x.Status == "Pending" || x.Status == null),
                    ResolvedReports = g.Count(x => x.Status == "Resolved"),
                    RejectedReports = g.Count(x => x.Status == "Rejected"),
                    PostReports = g.Count(x => x.TargetType == "Post"),
                    CommentReports = g.Count(x => x.TargetType == "Comment")
                })
                .FirstOrDefaultAsync();

            return new Dictionary<string, int>
            {
                ["TotalReports"] = result?.TotalReports ?? 0,
                ["PendingReports"] = result?.PendingReports ?? 0,
                ["ResolvedReports"] = result?.ResolvedReports ?? 0,
                ["RejectedReports"] = result?.RejectedReports ?? 0,
                ["PostReports"] = result?.PostReports ?? 0,
                ["CommentReports"] = result?.CommentReports ?? 0
            };
        }
    }
}