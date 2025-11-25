using BallSport.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories.AdminStatistics
{
    public interface IFieldStatisticRepository
    {
        Task<int> GetTotalFieldsAsync();
        Task<int> GetFieldsCreatedInMonthAsync(int year, int month);
    }

    public class FieldStatisticRepository : IFieldStatisticRepository
    {
        private readonly Sep490G19v1Context _context;

        public FieldStatisticRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<int> GetTotalFieldsAsync()
        {
            return await _context.Fields.CountAsync();
        }

        public async Task<int> GetFieldsCreatedInMonthAsync(int year, int month)
        {
            return await _context.Fields
                .Where(f => f.CreatedAt.HasValue
                            && f.CreatedAt.Value.Year == year
                            && f.CreatedAt.Value.Month == month)
                .CountAsync();
        }
    }
}
