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
    public class BookingPackageRepository
    {
        private readonly Sep490G19v1Context _context;

        public BookingPackageRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<BookingPackage> CreateBookingPackageAsync(BookingPackage package)
        {
            await _context.BookingPackages.AddAsync(package);
            await _context.SaveChangesAsync();

            return package;
        }

        public async Task<bool> UpdateQRCodeAsync(int packageId, string qr, DateTime expiresAt)
        {
            var package = await _context.BookingPackages.FindAsync(packageId);
            if (package == null) return false;

            package.Qrcode = qr;
            package.QrexpiresAt = expiresAt;
            package.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<BookingPackage?> GetByIdAsync(int packageId)
        {
            return await _context.BookingPackages
                .Include(p => p.Field)
                    .ThenInclude(f => f.Complex)
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.BookingPackageId == packageId);
        }

        /* public async Task<List<BookingPackage>> GetByUserIdAsync(int userId)
         {
             return await _context.BookingPackages
                 .Include(p => p.Field)
                     .ThenInclude(f => f.Complex)
                 .Include(p => p.User)
                 .Where(p => p.UserId == userId)
                 .OrderByDescending(p => p.CreatedAt)
                 .ToListAsync();
         }*/

        public async Task<bool> UpdateStatusToConfirmedAsync(int packageId)
        {
            var package = await _context.BookingPackages.FindAsync(packageId);
            if (package == null) return false;

            package.BookingStatus = "Confirmed";
            package.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CompleteBookingPackageAsync(int packageId)
        {
            var package = await _context.BookingPackages
                .Include(p => p.PackageSessions)
                .FirstOrDefaultAsync(p => p.BookingPackageId == packageId);

            if (package == null) return false;

            package.BookingStatus = "Completed";
            package.PaymentStatus = "Paid";
            package.UpdatedAt = DateTime.Now;

            // Optionally: cập nhật trạng thái từng session nếu muốn
            foreach (var session in package.PackageSessions)
            {
                session.SessionStatus = "Completed";
            }

            await _context.SaveChangesAsync();
            return true;
        }


    }
}
