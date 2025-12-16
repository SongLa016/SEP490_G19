using BallSport.Infrastructure;
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
    public class BookingFieldsRepoitory
    {

        private readonly Sep490G19v1Context _context;

        public BookingFieldsRepoitory(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<Booking> AddAsync(Booking booking)
        {
            booking.CreatedAt = DateTime.Now;
            booking.BookingStatus ??= "Pending";
            booking.PaymentStatus ??= "Unpaid";

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();
            return booking;
        }
       

        // 📱 Cập nhật QR code và thời gian hết hạn
        public async Task<bool> UpdateQRCodeAsync(int bookingId, string qrCode, DateTime expiresAt)
        {
            var booking = await _context.Bookings.FindAsync(bookingId);
            if (booking == null) return false;

            booking.Qrcode = qrCode;
            booking.QrexpiresAt = expiresAt;
            await _context.SaveChangesAsync();

            return true;
        }

        // 🔍 Lấy booking theo ID
        public async Task<Booking?> GetByIdAsync(int bookingId)
        {
            return await _context.Bookings
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Field)
                        .ThenInclude(f => f.Complex)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Slot)   // include TimeSlot
                .Include(b => b.User)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId);
        }


        // 🔍 Lấy danh sách booking của 1 user
        public async Task<List<Booking>> GetByUserIdAsync(int userId)
        {
            return await _context.Bookings
                .Include(b => b.Schedule)
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> UpdateAsync(Booking booking)
        {
            _context.Bookings.Update(booking);
            await _context.SaveChangesAsync();
            return true;
        }


        public async Task<bool> ConfirmPaymentManualAsync(int bookingId)
        {
            var booking = await _context.Bookings
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Field)
                .ThenInclude(f => f.Complex)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId);

            if (booking == null) return false;

            var field = booking.Schedule?.Field;
            if (field == null) return false;

           
            booking.PaymentStatus = "Paid";
            booking.BookingStatus = "Confirmed";
            booking.ConfirmedAt = DateTime.Now;

           // field.Status = "Booked";

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CompleteBookingAsync(int bookingId)
        {
            var booking = await _context.Bookings
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Field)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId);

            if (booking == null) return false;

            booking.BookingStatus = "Completed";
            booking.PaymentStatus = "Paid";
            booking.ConfirmedAt = DateTime.Now;

            if (booking.Schedule?.Field != null)
            {
                booking.Schedule.Field.Status = "Available";
                _context.Fields.Update(booking.Schedule.Field);
            }

            _context.Bookings.Update(booking);
            await _context.SaveChangesAsync();

            return true;
        }



        public async Task<Booking?> GetBookingWithBankAsync(int bookingId)
        {
            return await _context.Bookings
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Field)
                        .ThenInclude(f => f.BankAccount)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Slot)
                .Include(b => b.User)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId);
        }



        public async Task<List<Booking>> GetBookingsByUserIdAsync(int userId)
        {
            return await _context.Bookings
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Field)
                        .ThenInclude(f => f.Complex)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Slot)
                .Include(b => b.User)
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }


        public async Task<List<Booking>> GetBookingsByOwnerUserIdAsync(int userId)
        {
            return await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Field)
                        .ThenInclude(f => f.Complex)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Slot)
                .Where(b => b.Schedule.Field.Complex.OwnerId == userId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }





    }
}
