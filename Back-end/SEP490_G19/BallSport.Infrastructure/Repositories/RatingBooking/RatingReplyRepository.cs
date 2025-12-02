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
    public class RatingReplyRepository
    {
        private readonly Sep490G19v1Context _db;

        public RatingReplyRepository(Sep490G19v1Context db)
        {
            _db = db;
        }
        public async Task<Rating?> GetRatingByIdAsync(int ratingId)
        {
            return await _db.Ratings
                .Include(r => r.Field)
                .FirstOrDefaultAsync(r => r.RatingId == ratingId);
        }
        // Điều kiện reply
        // Kiểm tra User có booking sân này chưa
        public async Task<bool> HasUserBookedFieldAsync(int userId, int fieldId)
        {
            return await _db.Bookings
                .Include(b => b.Schedule)
                .AnyAsync(b =>
                    b.UserId == userId &&
                    b.Schedule.FieldId == fieldId &&
                    (b.BookingStatus == "Completed"));
        }

        // Thêm phản hồi
        public async Task AddReplyAsync(RatingReply reply)
        {
            _db.RatingReplies.Add(reply);
            await _db.SaveChangesAsync();
        }

        // Lấy danh sách phản hồi theo Rating
        public async Task<List<RatingReply>> GetRepliesByRatingIdAsync(int ratingId)
        {
            return await _db.RatingReplies
                .Include(r => r.User)
                .Where(r => r.RatingId == ratingId)
                .OrderBy(r => r.CreatedAt)
                .ToListAsync();
        }

        // Cập nhật phản hồi
        public async Task<bool> UpdateReplyAsync(int replyId, string text)
        {
            var reply = await _db.RatingReplies.FindAsync(replyId);
            if (reply == null) return false;

            reply.ReplyText = text;

            await _db.SaveChangesAsync();
            return true;
        }

        // Xóa phản hồi
        public async Task<bool> DeleteReplyAsync(int replyId)
        {
            var reply = await _db.RatingReplies.FindAsync(replyId);
            if (reply == null) return false;

            _db.RatingReplies.Remove(reply);
            await _db.SaveChangesAsync();
            return true;
        }

    }

}
