using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
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

        // Lấy tất cả đánh giá của toàn bộ sân thuộc một Complex
        public async Task<List<FieldRatingDto>> GetRatingsByComplexIdAsync(int complexId)
        {
            var ratings = await _db.Ratings
                .Include(r => r.Field)
                .Include(r => r.User)
                .Where(r => r.Field.ComplexId == complexId)
                .Select(r => new FieldRatingDto
                {
                    FieldId = r.FieldId,
                    FieldName = r.Field.Name,
                    Stars = r.Stars,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt,
                    UserId = r.UserId,
                    UserName = r.User.FullName
                })
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return ratings;
        }

    }

    public class FieldRatingDto
    {
        public int FieldId { get; set; }
        public string FieldName { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; }
        public int Stars { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
