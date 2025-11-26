using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
                .Include(s => s.BookingPackage) // để truy số tiền gói và userId
                .FirstOrDefaultAsync(s => s.PackageSessionId == sessionId);
        }

        public async Task<bool> CancelSessionAsync(int sessionId)
        {
            var session = await _context.PackageSessions.FindAsync(sessionId);
            if (session == null) return false;

            session.SessionStatus = "Cancelled";

            await _context.SaveChangesAsync();
            return true;
        }


    }
}
