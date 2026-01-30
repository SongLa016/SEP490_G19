using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using static BallSport.Infrastructure.Repositories.AdminStatistics.RecentActivityRepository;
using BallSport.Infrastructure.Data;

namespace BallSport.Infrastructure.Repositories.AdminStatistics
{
    public interface IRecentActivityRepository
    {
        Task<List<RecentActivity>> GetRecentActivitiesAsync(int top = 20);
    }

    public class RecentActivityRepository : IRecentActivityRepository
    {
        private readonly Sep490G19v1Context _context;

        public RecentActivityRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<List<RecentActivity>> GetRecentActivitiesAsync(int top = 20)
        {
            var now = DateTime.Now;

            // 1. Người dùng mới đăng ký
            var newUsers = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .Take(top)
                .Select(u => new RecentActivity
                {
                    ActivityType = "NewUser",
                    Description = $"Người dùng mới: {u.FullName}",
                    CreatedAt = u.CreatedAt ?? now
                })
                .ToListAsync();

            // 2. Báo cáo vi phạm mới
            var newReports = await _context.Reports
                .Include(r => r.Reporter)
                .OrderByDescending(r => r.CreatedAt)
                .Take(top)
                .Select(r => new RecentActivity
                {
                    ActivityType = "NewReport",
                    Description = $"Báo cáo vi phạm mới từ {r.Reporter.FullName}: {r.Reason}",
                    CreatedAt = r.CreatedAt ?? now
                })
                .ToListAsync();

            // 3. Booking hoàn thành
            var confirmedBookings = await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Field)
                .Where(b => b.BookingStatus == "Confirmed")
                .OrderByDescending(b => b.CreatedAt)
                .Take(top)
                .Select(b => new RecentActivity
                {
                    ActivityType = "BookingConfirmed",
                    Description = $"Booking #{b.BookingId} của {b.User.FullName} tại {b.Schedule.Field!.Name}",
                    CreatedAt = b.CreatedAt ?? now
                })
                .ToListAsync();

            // 4. Booking đã hủy
            var cancelledBookings = await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Field)
                .Where(b => b.BookingStatus == "Cancelled")
                .OrderByDescending(b => b.CancelledAt)
                .Take(top)
                .Select(b => new RecentActivity
                {
                    ActivityType = "BookingCancelled",
                    Description = $"Booking #{b.BookingId} của {b.User.FullName} đã hủy tại {b.Schedule.Field!.Name}",
                    CreatedAt = b.CancelledAt ?? now
                })
                .ToListAsync();

            // 5. Đánh giá
            var ratings = await _context.Ratings
                .Include(r => r.Field)
                .Include(r => r.User)
                .OrderByDescending(r => r.CreatedAt)
                .Take(top)
                .Select(r => new RecentActivity
                {
                    ActivityType = "Rating",
                    Description = $"Người dùng {r.User.FullName} đánh giá sân {r.Field.Name} - {r.Stars} sao",
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            // 6. Sân mới
            var newFields = await _context.Fields
                .OrderByDescending(f => f.CreatedAt)
                .Take(top)
                .Select(f => new RecentActivity
                {
                    ActivityType = "NewField",
                    Description = $"Sân mới được thêm: {f.Name}",
                    CreatedAt = f.CreatedAt ?? now
                })
                .ToListAsync();

            // 7. Bài viết mới
            var newPosts = await _context.Posts
                .Include(p => p.User)
                .OrderByDescending(p => p.CreatedAt)
                .Take(top)
                .Select(p => new RecentActivity
                {
                    ActivityType = "NewPost",
                    Description = $"Bài viết mới từ {p.User.FullName}: {p.Content}",
                    CreatedAt = p.CreatedAt ?? now
                })
                .ToListAsync();

            // Gộp tất cả
            var allActivities = newUsers
                .Concat(newReports)
                .Concat(confirmedBookings)
                .Concat(cancelledBookings)
                .Concat(ratings)
                .Concat(newFields)
                .Concat(newPosts)
                .OrderByDescending(a => a.CreatedAt) // Sắp xếp theo thời gian gần nhất
                .Take(top)
                .ToList();

            return allActivities;
        }

        // DTO cục bộ
        public class RecentActivity
        {
            public string ActivityType { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public DateTime CreatedAt { get; set; }
        }
    }
}
