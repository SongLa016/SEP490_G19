using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BallSport.Infrastructure.Data;

namespace BallSport.Infrastructure.Repositories
{
    public class BookingCancellationRepository
    {
        private readonly Sep490G19v1Context _context;

        public BookingCancellationRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<BookingCancellation> CreateCancellationAsync(BookingCancellation cancellation)
        {
            _context.BookingCancellations.Add(cancellation);
            await _context.SaveChangesAsync();
            return cancellation;
        }
        public async Task<BookingCancellation?> GetByBookingIdAsync(int bookingId)
        {
            return await _context.BookingCancellations
                .Include(x => x.Booking)
                .FirstOrDefaultAsync(x => x.BookingId == bookingId);
        }

       
        public async Task VerifyCancellationAsync(int cancellationId, int verifiedBy)
        {
            var item = await _context.BookingCancellations.FindAsync(cancellationId);
            if (item != null)
            {
                item.VerifiedBy = verifiedBy;
                item.VerifiedAt = DateTime.Now;
                await _context.SaveChangesAsync();
            }
        }

    }
}
