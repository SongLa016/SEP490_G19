using BallSport.Infrastructure.Repositories.AdminStatistics;

namespace BallSport.Application.Services.AdminStatistics
{
    public class FieldStatisticService
    {
        private readonly IFieldStatisticRepository _repo;

        public FieldStatisticService(IFieldStatisticRepository repo)
        {
            _repo = repo;
        }

        public async Task<object> GetFieldStatisticsAsync()
        {
            int totalFields = await _repo.GetTotalFieldsAsync();

            var now = DateTime.UtcNow;
            int currentMonthFields = await _repo.GetFieldsCreatedInMonthAsync(now.Year, now.Month);

            var prev = now.AddMonths(-1);
            int previousMonthFields = await _repo.GetFieldsCreatedInMonthAsync(prev.Year, prev.Month);

            double percentChange = 0;

            if (previousMonthFields > 0)
            {
                percentChange = ((double)(currentMonthFields - previousMonthFields) / previousMonthFields) * 100;
            }
            else if (currentMonthFields > 0)
            {
                percentChange = 100;
            }

            return new
            {
                totalFields,
                currentMonthFields,
                previousMonthFields,
                percentChange = Math.Round(percentChange, 2)
            };
        }
    }
}
