// File: IReportRepository.cs
using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories.Community
{
    public interface IReportRepository
    {
        Task<(IEnumerable<Report> Reports, int TotalCount)> GetAllReportsAsync(
            int pageNumber, int pageSize, string? status = null, string? targetType = null);

        Task<Report?> GetReportByIdAsync(int reportId);
        Task<Report> CreateReportAsync(Report report);
        Task<Report?> UpdateReportStatusAsync(int reportId, string status, int? handledBy = null);

        Task<IEnumerable<Report>> GetReportsByReporterIdAsync(int reporterId);
        Task<IEnumerable<Report>> GetReportsByTargetAsync(string targetType, int targetId);
        Task<bool> HasUserReportedTargetAsync(int reporterId, string targetType, int targetId);

        Task<int> CountReportsByStatusAsync(string status);
        Task<int> CountReportsByTargetAsync(string targetType, int targetId);

        Task<IEnumerable<Report>> GetPendingReportsAsync(int topCount = 50);
        Task<bool> DeleteReportAsync(int reportId);

        Task<Dictionary<string, int>> GetReportStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null);
    }
}