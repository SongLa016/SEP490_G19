 
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using BallSport.Infrastructure.Data;

namespace BallSport.Infrastructure.Repositories.Community
{
    public class PostLikeRepository : IPostLikeRepository
    {
        private readonly Sep490G19v1Context _context;

        public PostLikeRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<PostLike?> LikePostAsync(int postId, int userId)
        {
            // Kiểm tra đã like chưa
            var existingLike = await _context.PostLikes
                .FirstOrDefaultAsync(pl => pl.PostId == postId && pl.UserId == userId);

            if (existingLike != null)
                return null; // Đã like rồi

            var postLike = new PostLike
            {
                PostId = postId,
                UserId = userId,
                CreatedAt = DateTime.Now
            };

            await _context.PostLikes.AddAsync(postLike);
            await _context.SaveChangesAsync();

            return postLike;
        }

        public async Task<bool> UnlikePostAsync(int postId, int userId)
        {
            var postLike = await _context.PostLikes
                .FirstOrDefaultAsync(pl => pl.PostId == postId && pl.UserId == userId);

            if (postLike == null)
                return false;

            _context.PostLikes.Remove(postLike);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> IsPostLikedByUserAsync(int postId, int userId)
        {
            return await _context.PostLikes
                .AnyAsync(pl => pl.PostId == postId && pl.UserId == userId);
        }

        public async Task<int> CountLikesByPostIdAsync(int postId)
        {
            return await _context.PostLikes
                .Where(pl => pl.PostId == postId)
                .CountAsync();
        }

        public async Task<IEnumerable<PostLike>> GetLikesByPostIdAsync(int postId)
        {
            return await _context.PostLikes
                .Include(pl => pl.User)
                .Where(pl => pl.PostId == postId)
                .OrderByDescending(pl => pl.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<PostLike>> GetLikesByUserIdAsync(int userId)
        {
            return await _context.PostLikes
                .Include(pl => pl.Post)
                    .ThenInclude(p => p.User)
                .Where(pl => pl.UserId == userId)
                .OrderByDescending(pl => pl.CreatedAt)
                .ToListAsync();
        }

        public async Task<PostLike?> GetLikeAsync(int postId, int userId)
        {
            return await _context.PostLikes
                .Include(pl => pl.User)
                .Include(pl => pl.Post)
                .FirstOrDefaultAsync(pl => pl.PostId == postId && pl.UserId == userId);
        }

        public async Task<bool> DeleteLikesByPostIdAsync(int postId)
        {
            var likes = await _context.PostLikes
                .Where(pl => pl.PostId == postId)
                .ToListAsync();

            _context.PostLikes.RemoveRange(likes);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}