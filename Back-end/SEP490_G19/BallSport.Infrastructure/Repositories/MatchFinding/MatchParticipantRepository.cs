using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories.MatchFinding
{
    public class MatchParticipantRepository : IMatchParticipantRepository
    {
        private readonly Sep490G19v1Context _context;

        public MatchParticipantRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<IEnumerable<MatchParticipant>> GetParticipantsByMatchRequestIdAsync(int matchRequestId)
        {
            return await _context.MatchParticipants
                .Include(p => p.User)
                .Where(p => p.MatchRequestId == matchRequestId)
                .OrderBy(p => p.JoinedAt)
                .ToListAsync();
        }

        public async Task<MatchParticipant?> GetParticipantByIdAsync(int participantId)
        {
            return await _context.MatchParticipants
                .Include(p => p.User)
                .Include(p => p.MatchRequest)
                    .ThenInclude(m => m.Booking)
                        .ThenInclude(b => b.Schedule)
                .FirstOrDefaultAsync(p => p.ParticipantId == participantId);
        }

        public async Task<MatchParticipant> AddParticipantAsync(MatchParticipant participant)
        {
            participant.JoinedAt = DateTime.Now;
            participant.IsCreator = false;

            await _context.MatchParticipants.AddAsync(participant);
            await _context.SaveChangesAsync();

            return participant;
        }

        public async Task<bool> RemoveParticipantAsync(int participantId)
        {
            var participant = await _context.MatchParticipants.FindAsync(participantId);
            if (participant == null)
                return false;

            _context.MatchParticipants.Remove(participant);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> HasUserJoinedAsync(int matchRequestId, int userId)
        {
            return await _context.MatchParticipants
                .AnyAsync(p => p.MatchRequestId == matchRequestId && p.UserId == userId);
        }

        public async Task<bool> HasTimeConflictAsync(int userId, DateTime matchDate, int timeSlotId)
        {
            var matchDateOnly = DateOnly.FromDateTime(matchDate);

            // Kiểm tra user đã có trận nào trùng thời gian chưa (status = Matched hoặc Pending)
            return await _context.MatchParticipants
                .Include(p => p.MatchRequest)
                    .ThenInclude(m => m.Booking)
                        .ThenInclude(b => b.Schedule)
                .AnyAsync(p => p.UserId == userId
                    && (p.MatchRequest.Status == "Matched" || p.MatchRequest.Status == "Pending")
                    && p.MatchRequest.Booking.Schedule.Date == matchDateOnly
                    && p.MatchRequest.Booking.Schedule.SlotId == timeSlotId);
        }

        public async Task<IEnumerable<MatchParticipant>> GetUserParticipationsAsync(int userId)
        {
            return await _context.MatchParticipants
                .Include(p => p.MatchRequest)
                    .ThenInclude(m => m.Booking)
                        .ThenInclude(b => b.Schedule)
                            .ThenInclude(s => s.Field)
                .Include(p => p.MatchRequest)
                    .ThenInclude(m => m.Booking)
                        .ThenInclude(b => b.Schedule)
                            .ThenInclude(s => s.Slot)
                .Include(p => p.MatchRequest)
                    .ThenInclude(m => m.CreatedByNavigation)
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.JoinedAt)
                .ToListAsync();
        }

        public async Task<int> CountParticipantsByMatchRequestIdAsync(int matchRequestId)
        {
            return await _context.MatchParticipants
                .Where(p => p.MatchRequestId == matchRequestId)
                .CountAsync();
        }
    }
}