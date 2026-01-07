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

        public virtual async Task AddRatingAsync(Rating rating)
        {
            _db.Ratings.Add(rating);
            await _db.SaveChangesAsync();
        }
        // Cập nhật rating
        public virtual async Task<bool> UpdateRatingAsync(int ratingId, int stars, string? comment)
        {
            var existing = await _db.Ratings.FindAsync(ratingId);
            if (existing == null) return false;

            existing.Stars = stars;
            existing.Comment = comment;

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteRatingAsync(int ratingId)
        {
            var rating = await _db.Ratings.FindAsync(ratingId);
            if (rating == null) return false;

            _db.Ratings.Remove(rating);
            await _db.SaveChangesAsync();
            return true;
        }

        public virtual async Task<List<FieldRatingWithRepliesDto>> GetRatingsByFieldIdWithRepliesAsync(int fieldId)
        {
            var ratings = await _db.Ratings
                .Include(r => r.User)
                .Include(r => r.RatingReplies)       
                    .ThenInclude(rr => rr.User)      
                .Where(r => r.FieldId == fieldId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new FieldRatingWithRepliesDto
                {
                    RatingId = r.RatingId,
                    FieldId = r.FieldId,
                    FieldName = r.Field.Name,
                    Stars = r.Stars,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt,
                    UserId = r.UserId,
                    UserName = r.User.FullName,
                    Replies = r.RatingReplies.Select(rr => new RatingReplyDto
                    {
                        ReplyId = rr.ReplyId,
                        UserId = rr.UserId,
                        UserName = rr.User.FullName,
                        ReplyText = rr.ReplyText,
                        CreatedAt = rr.CreatedAt
                    }).ToList()
                })
                .ToListAsync();

            return ratings;
        }


        // Lấy tất cả đánh giá của toàn bộ sân thuộc một Complex
        public virtual async Task<List<FieldRatingWithRepliesDto>> GetRatingsByComplexIdWithRepliesAsync(int complexId)
        {
            var ratings = await _db.Ratings
                .Include(r => r.Field)
                .Include(r => r.User)
                .Include(r => r.RatingReplies)      
                    .ThenInclude(rr => rr.User)     
                .Where(r => r.Field.ComplexId == complexId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new FieldRatingWithRepliesDto
                {
                    RatingId = r.RatingId,
                    FieldId = r.FieldId,
                    FieldName = r.Field.Name,
                    Stars = r.Stars,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt,
                    UserId = r.UserId,
                    UserName = r.User.FullName,
                    Replies = r.RatingReplies.Select(rr => new RatingReplyDto
                    {
                        ReplyId = rr.ReplyId,
                        UserId = rr.UserId,
                        UserName = rr.User.FullName,
                        ReplyText = rr.ReplyText,
                        CreatedAt = rr.CreatedAt
                    }).ToList()
                })
                .ToListAsync();
            return ratings;
        }

    }

    public class FieldRatingWithRepliesDto
    {
        public int RatingId { get; set; }
        public int FieldId { get; set; }
        public string FieldName { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int Stars { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }

        public List<RatingReplyDto> Replies { get; set; } = new();
    }

    public class RatingReplyDto
    {
        public int ReplyId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string ReplyText { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
