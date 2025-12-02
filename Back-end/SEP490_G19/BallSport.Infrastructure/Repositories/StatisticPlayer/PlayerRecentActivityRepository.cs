using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using static BallSport.Infrastructure.Repositories.PlayerStatistics.PlayerRecentActivityRepository;

namespace BallSport.Infrastructure.Repositories.PlayerStatistics
{
    public interface IPlayerRecentActivityRepository
    {
        Task<List<PlayerRecentActivity>> GetRecentActivitiesAsync(int userId, int top = 20);
    }

    public class PlayerRecentActivityRepository : IPlayerRecentActivityRepository
    {
        private readonly Sep490G19v1Context _context;

        public PlayerRecentActivityRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<List<PlayerRecentActivity>> GetRecentActivitiesAsync(int userId, int top = 10)
        {
            var now = DateTime.Now;

            // 1. Pending bookings
            var pending = await _context.Bookings
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Field)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Slot)
                .Where(b => b.UserId == userId && b.BookingStatus == "Pending")
                .OrderByDescending(b => b.CreatedAt)
                .Take(top)
                .Select(b => new PlayerRecentActivity
                {
                    Description = $"Đang đặt {b.Schedule.Field!.Name} - {b.Schedule.Slot!.StartTime:HH:mm} ngày {b.Schedule.Date:dd/MM}",
                    CreatedAt = b.CreatedAt ?? now
                })
                .ToListAsync();

            // 2. Confirmed bookings
            var confirmed = await _context.Bookings
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Field)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Slot)
                .Where(b => b.UserId == userId && b.BookingStatus == "Confirmed")
                .OrderByDescending(b => b.CreatedAt)
                .Take(top)
                .Select(b => new PlayerRecentActivity
                {
                    Description = $"Đặt sân {b.Schedule.Field!.Name} thành công - {b.Schedule.Slot!.StartTime:HH:mm} ngày {b.Schedule.Date:dd/MM}",
                    CreatedAt = b.CreatedAt ?? now
                })
                .ToListAsync();

            // 3. Cancelled bookings
            var cancelled = await _context.Bookings
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Field)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Slot)
                .Where(b => b.UserId == userId && b.BookingStatus == "Cancelled")
                .OrderByDescending(b => b.CancelledAt)
                .Take(top)
                .Select(b => new PlayerRecentActivity
                {
                    Description = $"Đã hủy sân {b.Schedule.Field!.Name} - {b.Schedule.Slot!.StartTime:HH:mm} ngày {b.Schedule.Date:dd/MM}",
                    CreatedAt = b.CancelledAt ?? now
                })
                .ToListAsync();

            // 4. Ratings
            var ratings = await _context.Ratings
                .Include(r => r.Field)
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Take(top)
                .Select(r => new PlayerRecentActivity
                {
                    Description = $"Đã đánh giá sân {r.Field.Name} - {r.Stars} sao",
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            // 5. Successful payments
            var payments = await _context.Payments
                .Include(p => p.Booking)
                    .ThenInclude(b => b.Schedule)
                        .ThenInclude(s => s.Field)
                .Where(p => p.Booking.UserId == userId && p.Status == "Paid")
                .OrderByDescending(p => p.CreatedAt)
                .Take(top)
                .Select(p => new PlayerRecentActivity
                {
                    Description = $"Thanh toán thành công {p.Amount} VNĐ cho sân {p.Booking.Schedule.Field!.Name} - {p.CreatedAt:HH:mm dd/MM}",
                    CreatedAt = p.CreatedAt ?? now
                })
                .ToListAsync();

            // Gộp tất cả và sắp xếp theo CreatedAt (gần nhất trước)
            var allActivities = pending
                .Concat(confirmed)
                .Concat(cancelled)
                .Concat(ratings)
                .Concat(payments)
                .OrderByDescending(a => a.CreatedAt)
                .Take(top)
                .Select(a =>
                {
                    a.TimeAgo = a.CreatedAt.ToTimeAgo();
                    return a;
                })
                .ToList();

            return allActivities;
        }

        // DTO
        public class PlayerRecentActivity
        {
            public string Description { get; set; } = string.Empty;
            internal DateTime CreatedAt { get; set; }
            public string TimeAgo { get; set; } = string.Empty;
        }
    }

    // Extension method tính thời gian trôi qua
    public static class TimeAgoExtensions
    {
        public static string ToTimeAgo(this DateTime dateTime)
        {
            var ts = DateTime.Now - dateTime;

            if (ts.TotalSeconds < 60)
                return $"{ts.Seconds} giây trước";
            if (ts.TotalMinutes < 60)
                return $"{ts.Minutes} phút trước";
            if (ts.TotalHours < 24)
                return $"{ts.Hours} giờ trước";
            if (ts.TotalDays < 30)
                return $"{ts.Days} ngày trước";
            if (ts.TotalDays < 365)
                return $"{(int)(ts.TotalDays / 30)} tháng trước";

            return $"{(int)(ts.TotalDays / 365)} năm trước";
        }
    }
}
