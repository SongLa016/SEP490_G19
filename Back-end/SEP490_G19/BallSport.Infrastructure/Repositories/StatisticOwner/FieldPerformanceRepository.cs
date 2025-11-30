using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BallSport.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using static BallSport.Infrastructure.Repositories.StatisticOwner.FieldPerformanceRepository;
namespace BallSport.Infrastructure.Repositories.StatisticOwner
{
    public interface IFieldPerformanceRepository
    {
        Task<List<FieldPerformance>> GetFieldPerformanceAsync(int ownerId);
    }
    
    public class FieldPerformanceRepository : IFieldPerformanceRepository
    {
        private readonly Sep490G19v1Context _context;

        public FieldPerformanceRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<List<FieldPerformance>> GetFieldPerformanceAsync(int ownerId)
        {
            return await _context.Bookings
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Slot)  
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Field) 
                .Where(b => b.Schedule.Field.Complex.OwnerId == ownerId)
                .GroupBy(b => new { b.Schedule.FieldId, b.Schedule.Field.Name })
                .Select(g => new FieldPerformance
                {
                    FieldName = g.Key.Name ?? "",
                    BookingCount = g.Count(),
                    Revenue = g.Sum(b => b.Schedule.Slot != null ? b.Schedule.Slot.Price : 0) 
                })
                .OrderByDescending(f => f.Revenue)
                .ToListAsync();
        }

        public class FieldPerformance
        {
            public string FieldName { get; set; } = string.Empty;
            public int BookingCount { get; set; }
            public decimal Revenue { get; set; }
        }
    }
}
