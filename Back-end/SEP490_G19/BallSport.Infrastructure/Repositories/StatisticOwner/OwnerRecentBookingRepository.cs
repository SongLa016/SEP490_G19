 
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;
using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories.StatisticOwner
{
    public interface IOwnerRecentBookingRepository
    {
        Task<List<RecentBooking>> GetRecentBookingsAsync(int ownerId, int top = 10);
    }

    public class OwnerRecentBookingRepository : IOwnerRecentBookingRepository
    {
        private readonly Sep490G19v1Context _context;

        public OwnerRecentBookingRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<List<RecentBooking>> GetRecentBookingsAsync(int ownerId, int top = 10)
        {
            return await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Field)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Slot)
                .Where(b =>
                    b.Schedule != null &&
                    b.Schedule.Field != null &&
                    b.Schedule.Field.Complex != null &&
                    b.Schedule.Field.Complex.OwnerId == ownerId)
                .OrderByDescending(b => b.CreatedAt)
                .Take(top)
                .Select(b => new RecentBooking
                {
                    CustomerName = b.User.FullName,
                    FieldName = b.Schedule.Field != null ? b.Schedule.Field.Name : string.Empty,
                    TimeSlot = (b.Schedule.Slot != null)
                        ? $"{b.Schedule.Slot.StartTime:HH:mm} - {b.Schedule.Slot.EndTime:HH:mm}"
                        : string.Empty,
                    Price = b.Schedule.Slot != null ? b.Schedule.Slot.Price : 0,
                    Status = b.Schedule.Status ?? string.Empty,
                })
                .ToListAsync();
        }
    }
    // DTO cục bộ
    public class RecentBooking
    {
        public string CustomerName { get; set; } = string.Empty;
        public string FieldName { get; set; } = string.Empty;
        public string TimeSlot { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
