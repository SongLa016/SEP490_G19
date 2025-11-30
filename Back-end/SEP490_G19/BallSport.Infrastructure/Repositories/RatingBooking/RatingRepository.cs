using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories.RatingBooking
{
    public class RatingRepository
    {
        private readonly Sep490G19v1Context _db;

        public RatingRepository(Sep490G19v1Context db)
        {
            _db = db;
        }

        public async Task<bool> HasRatedAsync(int bookingId)
        {
            return await _db.Ratings.AnyAsync(r => r.BookingId == bookingId);
        }

        public async Task AddRatingAsync(Rating rating)
        {
            _db.Ratings.Add(rating);
            await _db.SaveChangesAsync();
        }

        //Lấy ra các đánh giá theo fieldID
        public async Task<List<Rating>> GetRatingsByFieldIdAsync(int fieldId)
        {
            return await _db.Ratings
                .Include(r => r.User)
                .Where(r => r.FieldId == fieldId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }
    }

}
