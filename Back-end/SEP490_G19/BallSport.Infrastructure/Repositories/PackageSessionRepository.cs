using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories
{
    public class PackageSessionRepository
    {
        private readonly Sep490G19v1Context _context;

        public PackageSessionRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<PackageSession> CreatePackageSessionAsync(PackageSession session)
        {
            await _context.PackageSessions.AddAsync(session);
            await _context.SaveChangesAsync();
            return session;
        }

        public async Task<PackageSession?> GetByIdAsync(int sessionId)
        {
            return await _context.PackageSessions
                .FirstOrDefaultAsync(s => s.PackageSessionId == sessionId);

        }


        public async Task<bool> UpdateSessionAsync(PackageSession session)
        {
            _context.PackageSessions.Attach(session); // Chỉ attach session
            _context.Entry(session).Property(s => s.SessionStatus).IsModified = true;
            _context.Entry(session).Property(s => s.UpdatedAt).IsModified = true;
            await _context.SaveChangesAsync();
            return true;
        }


        public async Task<decimal> GetSlotPriceAsync(int slotId, int fieldId)
        {
            var slot = await _context.TimeSlots
                .FirstOrDefaultAsync(x => x.SlotId == slotId && x.FieldId == fieldId);

            if (slot == null)
                throw new Exception($"Slot {slotId} not found for field {fieldId}");

            return slot.Price;
        }

        public async Task<FieldSchedule?> GetScheduleAsync(int fieldId, int slotId, DateOnly date)
        {
            return await _context.FieldSchedules
                .FirstOrDefaultAsync(s =>
                    s.FieldId == fieldId &&
                    s.SlotId == slotId &&
                    s.Date == date
                );
        }

        public async Task<PackageSession?> GetByPackageScheduleDateAsync(int packageId, int scheduleId, DateOnly date)
        {
            return await _context.PackageSessions
                .FirstOrDefaultAsync(s =>
                    s.BookingPackageId == packageId &&
                    s.ScheduleId == scheduleId &&
                    s.SessionDate == date
                );
        }

        public async Task<FieldSchedule?> GetScheduleByIdAsync(int scheduleId)
        {
            return await _context.FieldSchedules
                .FirstOrDefaultAsync(s => s.ScheduleId == scheduleId);
        }

        // Lấy sessions của player
        public async Task<List<PackageSession>> GetSessionsByPlayerIdAsync(int userId)
        {
            return await _context.PackageSessions
                .Include(s => s.BookingPackage)
                    .ThenInclude(bp => bp.Field)
                        .ThenInclude(f => f.Complex)
                .Include(s => s.Schedule)
                .Include(s => s.User)
                .Where(s => s.UserId == userId)
                .OrderBy(s => s.SessionDate)
                .ToListAsync();
        }

        // Lấy sessions thuộc các field của owner
        public async Task<List<PackageSession>> GetSessionsByOwnerIdAsync(int ownerId)
        {
            return await _context.PackageSessions
                .Include(s => s.BookingPackage)
                    .ThenInclude(bp => bp.Field)
                        .ThenInclude(f => f.Complex)
                .Include(s => s.Schedule)
                .Include(s => s.User)
                .Where(s => s.BookingPackage != null
                            && s.BookingPackage.Field != null
                            && s.BookingPackage.Field.Complex != null
                            && s.BookingPackage.Field.Complex.OwnerId == ownerId)
                .OrderBy(s => s.SessionDate)
                .ToListAsync();
        }
    }
}
