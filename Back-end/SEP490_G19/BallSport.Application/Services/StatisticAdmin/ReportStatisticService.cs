using BallSport.Infrastructure.Repositories.AdminStatistics;
using System;
using System.Threading.Tasks;

namespace BallSport.Application.Services.AdminStatistics
{
    public class ReportStatisticService
    {
        private readonly IReportStatisticRepository _repository;

        public ReportStatisticService(IReportStatisticRepository repository)
        {
            _repository = repository;
        }

        public async Task<(int CurrentMonthCount, double PercentageChange)> GetReportStatisticsAsync()
        {
            var now = DateTime.UtcNow;
            var currentMonth = now.Month;
            var currentYear = now.Year;

            var lastMonthDate = now.AddMonths(-1);
            var lastMonth = lastMonthDate.Month;
            var lastYear = lastMonthDate.Year;

            int currentCount = await _repository.GetReportsCountByMonthAsync(currentYear, currentMonth);
            int lastCount = await _repository.GetReportsCountByMonthAsync(lastYear, lastMonth);

            double percentageChange = 0;
            if (lastCount > 0)
                percentageChange = ((double)(currentCount - lastCount) / lastCount) * 100;

            return (currentCount, percentageChange);
        }
        public async Task<(int CurrentMonthPending, double PercentageChange)> GetPendingReportStatisticsAsync()
        {
            var now = DateTime.UtcNow;
            var currentMonth = now.Month;
            var currentYear = now.Year;

            var lastMonthDate = now.AddMonths(-1);
            var lastMonth = lastMonthDate.Month;
            var lastYear = lastMonthDate.Year;

            int currentCount = await _repository.GetPendingReportsCountByMonthAsync(currentYear, currentMonth);
            int lastCount = await _repository.GetPendingReportsCountByMonthAsync(lastYear, lastMonth);

            double percentageChange = 0;
            if (lastCount > 0)
                percentageChange = (int)(currentCount - lastCount);

            return (currentCount, percentageChange);
        }
    }
}
