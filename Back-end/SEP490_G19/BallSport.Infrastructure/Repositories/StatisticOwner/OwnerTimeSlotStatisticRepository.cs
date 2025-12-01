using System;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories.OwnerStatistics
{
    public class OwnerTimeSlotStatisticRepository
    {
        private readonly Sep490G19v1Context _context;

        public OwnerTimeSlotStatisticRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<List<OwnerTimeSlotPerformanceDto>> GetTimeSlotPerformanceAsync(int ownerId)
        {
            var bookingsQuery = _context.Bookings
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Slot)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Field)
                        .ThenInclude(f => f.Complex)
                .Where(b =>
                    b.BookingStatus == "Completed" &&
                    b.Schedule.Field.Complex.OwnerId == ownerId
                );

            // Tổng số booking completed của owner
            var totalCompletedBookings = await bookingsQuery.CountAsync();

            var slotData = await bookingsQuery
                .GroupBy(b => new
                {
                    b.Schedule.Slot.StartTime,
                    b.Schedule.Slot.EndTime
                })
                .Select(g => new
                {
                    StartTime = g.Key.StartTime,
                    EndTime = g.Key.EndTime,
                    Revenue = g.Sum(x => x.TotalPrice),
                    BookingCount = g.Count()
                })
                .ToListAsync();

            return slotData.Select(s => new OwnerTimeSlotPerformanceDto
            {
                TimeRange = $"{s.StartTime:hh\\:mm} - {s.EndTime:hh\\:mm}",
                Revenue = s.Revenue,
                BookingCount = s.BookingCount,

             
                PopularityPercent = totalCompletedBookings == 0
                    ? 0
                    : Math.Round((double)s.BookingCount / totalCompletedBookings * 100, 2),

                AvgPerBooking = s.BookingCount == 0
                    ? 0
                    : Math.Round(s.Revenue / s.BookingCount, 2)

            }).ToList();
        }

        public class OwnerTimeSlotPerformanceDto
        {
            public string TimeRange { get; set; }
            public decimal Revenue { get; set; }
            public int BookingCount { get; set; }
            public double PopularityPercent { get; set; }
            public decimal AvgPerBooking { get; set; }
        }
    }
}
