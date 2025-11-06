using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories.MatchFinding
{
    public class MatchRequestRepository : IMatchRequestRepository
    {
        private readonly Sep490G19v1Context _context;

        public MatchRequestRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<(IEnumerable<MatchRequest> Requests, int TotalCount)> GetAllMatchRequestsAsync(
            int pageNumber,
            int pageSize,
            string? status = null,
            DateTime? fromDate = null,
            DateTime? toDate = null,
            int? fieldId = null)
        {
            var query = _context.MatchRequests
                .Include(m => m.Booking)
                    .ThenInclude(b => b.Schedule)
                        .ThenInclude(s => s.Field)
                            .ThenInclude(f => f.Complex)
                .Include(m => m.Booking)
                    .ThenInclude(b => b.Schedule)
                        .ThenInclude(s => s.Slot)
                .Include(m => m.CreatedByNavigation)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(m => m.Status == status);
            }

            if (fromDate.HasValue)
            {
                query = query.Where(m => m.Booking.Schedule.Date >= DateOnly.FromDateTime(fromDate.Value));
            }

            if (toDate.HasValue)
            {
                query = query.Where(m => m.Booking.Schedule.Date <= DateOnly.FromDateTime(toDate.Value));
            }

            if (fieldId.HasValue)
            {
                query = query.Where(m => m.Booking.Schedule.FieldId == fieldId.Value);
            }

            query = query.OrderByDescending(m => m.CreatedAt);

            var totalCount = await query.CountAsync();
            var requests = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (requests, totalCount);
        }

        public async Task<MatchRequest?> GetMatchRequestByIdAsync(int matchRequestId)
        {
            return await _context.MatchRequests
                .Include(m => m.Booking)
                    .ThenInclude(b => b.Schedule)
                        .ThenInclude(s => s.Field)
                            .ThenInclude(f => f.Complex)
                .Include(m => m.Booking)
                    .ThenInclude(b => b.Schedule)
                        .ThenInclude(s => s.Slot)
                .Include(m => m.CreatedByNavigation)
                .FirstOrDefaultAsync(m => m.MatchRequestId == matchRequestId);
        }

        public async Task<MatchRequest?> GetMatchRequestByBookingIdAsync(int bookingId)
        {
            return await _context.MatchRequests
                .Include(m => m.Booking)
                .Include(m => m.CreatedByNavigation)
                .FirstOrDefaultAsync(m => m.BookingId == bookingId);
        }

        public async Task<MatchRequest> CreateMatchRequestAsync(MatchRequest matchRequest)
        {
            matchRequest.CreatedAt = DateTime.Now;
            matchRequest.Status = "Open";

            await _context.MatchRequests.AddAsync(matchRequest);
            await _context.SaveChangesAsync();

            return matchRequest;
        }

        public async Task<MatchRequest?> UpdateMatchRequestStatusAsync(int matchRequestId, string status)
        {
            var matchRequest = await _context.MatchRequests.FindAsync(matchRequestId);
            if (matchRequest == null)
                return null;

            matchRequest.Status = status;
            await _context.SaveChangesAsync();

            return matchRequest;
        }

        public async Task<bool> DeleteMatchRequestAsync(int matchRequestId)
        {
            var matchRequest = await _context.MatchRequests.FindAsync(matchRequestId);
            if (matchRequest == null)
                return false;

            _context.MatchRequests.Remove(matchRequest);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<MatchRequest>> GetMatchRequestsByUserIdAsync(int userId)
        {
            return await _context.MatchRequests
                .Include(m => m.Booking)
                    .ThenInclude(b => b.Schedule)
                        .ThenInclude(s => s.Field)
                .Include(m => m.Booking)
                    .ThenInclude(b => b.Schedule)
                        .ThenInclude(s => s.Slot)
                .Where(m => m.CreatedBy == userId)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> BookingHasMatchRequestAsync(int bookingId)
        {
            return await _context.MatchRequests
                .AnyAsync(m => m.BookingId == bookingId);
        }

        public async Task<IEnumerable<MatchRequest>> GetExpiredMatchRequestsAsync(int hoursToExpire = 1)
        {
            var expiredTime = DateTime.Now.AddHours(-hoursToExpire);

            return await _context.MatchRequests
                .Where(m => m.Status == "Pending" && m.CreatedAt < expiredTime)
                .ToListAsync();
        }

        public async Task<Dictionary<string, int>> GetMatchRequestStatisticsAsync(int? userId = null)
        {
            var query = _context.MatchRequests.AsQueryable();

            if (userId.HasValue)
            {
                query = query.Where(m => m.CreatedBy == userId.Value);
            }

            var stats = new Dictionary<string, int>
            {
                ["Total"] = await query.CountAsync(),
                ["Open"] = await query.Where(m => m.Status == "Open").CountAsync(),
                ["Pending"] = await query.Where(m => m.Status == "Pending").CountAsync(),
                ["Matched"] = await query.Where(m => m.Status == "Matched").CountAsync(),
                ["Cancelled"] = await query.Where(m => m.Status == "Cancelled").CountAsync(),
                ["Expired"] = await query.Where(m => m.Status == "Expired").CountAsync()
            };

            return stats;
        }
    }
}