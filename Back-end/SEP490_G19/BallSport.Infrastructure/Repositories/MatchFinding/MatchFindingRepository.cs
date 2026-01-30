// File: BallSport.Infrastructure/Repositories/MatchFinding/MatchFindingRepository.cs
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories.MatchFinding
{
    public class MatchFindingRepository : IMatchFindingRepository
    {
        private readonly Sep490G19v1Context _context;

        public MatchFindingRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        
        public async Task<List<MatchRequest>> GetActiveRequestsExcludeMineAsync(int currentUserId)
        {
            return await _context.MatchRequests
                .Where(m => m.Status == "Open"
                         && (m.ExpiresAt == null || m.ExpiresAt > DateTime.Now)
                         && m.CreatedBy != currentUserId) // LOẠI BỎ KÈO CỦA CHÍNH MÌNH
                .Include(m => m.Booking!)
                    .ThenInclude(b => b.Schedule!)
                        .ThenInclude(s => s.Slot!)
                .Include(m => m.Booking!)
                    .ThenInclude(b => b.Schedule!)
                        .ThenInclude(s => s.Field!)
                            .ThenInclude(f => f.Complex)
                .Include(m => m.MatchParticipants)
                .Include(m => m.CreatedByNavigation)
                .OrderByDescending(m => m.CreatedAt)
                .AsSplitQuery()
                .ToListAsync();
        }

        // Các method còn lại giữ nguyên – đã hoàn hảo
        public async Task<MatchRequest?> GetDetailAsync(int matchRequestId)
        {
            return await _context.MatchRequests
                .Include(m => m.Booking!)
                    .ThenInclude(b => b.Schedule!)
                        .ThenInclude(s => s.Slot!)
                .Include(m => m.Booking!)
                    .ThenInclude(b => b.Schedule!)
                        .ThenInclude(s => s.Field!)
                            .ThenInclude(f => f.Complex)
                .Include(m => m.MatchParticipants!)
                    .ThenInclude(p => p.User)
                .Include(m => m.CreatedByNavigation)
                .AsSplitQuery()
                .FirstOrDefaultAsync(m => m.MatchRequestId == matchRequestId);
        }

        public async Task<List<MatchRequest>> GetActiveRequestsAsync()
        {
            return await _context.MatchRequests
                .Where(m => m.Status == "Open" &&
                           (m.ExpiresAt == null || m.ExpiresAt > DateTime.Now))
                .Include(m => m.Booking!)
                    .ThenInclude(b => b.Schedule!)
                        .ThenInclude(s => s.Slot!)
                .Include(m => m.Booking!)
                    .ThenInclude(b => b.Schedule!)
                        .ThenInclude(s => s.Field!)
                            .ThenInclude(f => f.Complex)
                .Include(m => m.MatchParticipants)
                .Include(m => m.CreatedByNavigation)
                .OrderByDescending(m => m.CreatedAt)
                .AsSplitQuery()
                .ToListAsync();
        }

        public async Task<List<PlayerMatchHistory>> GetHistoryByUserAsync(int userId)
        {
            return await _context.PlayerMatchHistories
                .Where(h => h.UserId == userId)
                .Include(h => h.MatchRequest!)
                    .ThenInclude(m => m.Booking!)
                        .ThenInclude(b => b.Schedule!)
                            .ThenInclude(s => s.Slot!)
                .Include(h => h.MatchRequest!)
                    .ThenInclude(m => m.Booking!)
                        .ThenInclude(b => b.Schedule!)
                            .ThenInclude(s => s.Field!)
                                .ThenInclude(f => f.Complex)
                .Include(h => h.OpponentUser)
                .Include(h => h.MatchRequest!)
                    .ThenInclude(m => m.MatchParticipants!)
                        .ThenInclude(p => p.User)
                .OrderByDescending(h => h.CreatedAt)
                .AsSplitQuery()
                .ToListAsync();
        }

        public async Task<MatchParticipant?> GetParticipantAsync(int requestId, int userId)
            => await _context.MatchParticipants
                .FirstOrDefaultAsync(p => p.MatchRequestId == requestId && p.UserId == userId);

        public async Task AddMatchRequestAsync(MatchRequest request)
        {
            _context.MatchRequests.Add(request);
            await _context.SaveChangesAsync();
        }

        public async Task AddParticipantAsync(MatchParticipant participant)
        {
            _context.MatchParticipants.Add(participant);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateMatchRequestAsync(MatchRequest request)
        {
            _context.MatchRequests.Update(request);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateParticipantAsync(MatchParticipant participant)
        {
            _context.MatchParticipants.Update(participant);
            await _context.SaveChangesAsync();
        }

        public async Task CancelMatchRequestAsync(int requestId)
        {
            var req = await _context.MatchRequests.FindAsync(requestId);
            if (req != null)
            {
                req.Status = "Cancelled";
                await _context.SaveChangesAsync();
            }
        }

        public async Task<MatchRequest?> GetRequestByBookingIdAsync(int bookingId)
        {
            return await _context.MatchRequests
                .Include(m => m.Booking!)
                    .ThenInclude(b => b.Schedule!)
                        .ThenInclude(s => s.Slot!)
                .FirstOrDefaultAsync(r => r.BookingId == bookingId && r.Status == "Open");
        }

        public async Task<bool> HasActiveRequestForBookingAsync(int bookingId)
        {
            return await _context.MatchRequests
                .AnyAsync(r => r.BookingId == bookingId && r.Status == "Open");
        }

        public async Task<MatchRequest?> GetFullDetailAsync(int matchRequestId, int currentUserId)
            => await GetDetailAsync(matchRequestId);
    }
}