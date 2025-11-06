using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories.Community
{
    public class PostRepository : IPostRepository
    {
        private readonly Sep490G19v1Context _context;

        public PostRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<(IEnumerable<Post> Posts, int TotalCount)> GetAllPostsAsync(
            int pageNumber,
            int pageSize,
            string? status = "Active",
            int? fieldId = null,
            int? userId = null)
        {
            var query = _context.Posts
                .Include(p => p.User)
                .Include(p => p.Field)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(p => p.Status == status);
            }

            if (fieldId.HasValue)
            {
                query = query.Where(p => p.FieldId == fieldId.Value);
            }

            if (userId.HasValue)
            {
                query = query.Where(p => p.UserId == userId.Value);
            }

            query = query.OrderByDescending(p => p.CreatedAt);

            var totalCount = await query.CountAsync();
            var posts = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (posts, totalCount);
        }

        public async Task<Post?> GetPostByIdAsync(int postId)
        {
            return await _context.Posts
                .Include(p => p.User)
                .Include(p => p.Field)
                .FirstOrDefaultAsync(p => p.PostId == postId);
        }

        public async Task<Post> CreatePostAsync(Post post)
        {
            post.CreatedAt = DateTime.Now;
            post.Status = "Active";

            await _context.Posts.AddAsync(post);
            await _context.SaveChangesAsync();

            return post;
        }

        public async Task<Post?> UpdatePostAsync(Post post)
        {
            var existingPost = await _context.Posts.FindAsync(post.PostId);
            if (existingPost == null)
                return null;

            existingPost.Title = post.Title;
            existingPost.Content = post.Content;
            existingPost.MediaUrl = post.MediaUrl;
            existingPost.FieldId = post.FieldId;
            existingPost.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return existingPost;
        }

        public async Task<bool> DeletePostAsync(int postId)
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post == null)
                return false;

            post.Status = "Deleted";
            post.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Post>> GetPostsByUserIdAsync(int userId, string? status = "Active")
        {
            var query = _context.Posts
                .Include(p => p.User)
                .Include(p => p.Field)
                .Where(p => p.UserId == userId);

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(p => p.Status == status);
            }

            return await query
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Post>> GetPostsByFieldIdAsync(int fieldId, string? status = "Active")
        {
            var query = _context.Posts
                .Include(p => p.User)
                .Include(p => p.Field)
                .Where(p => p.FieldId == fieldId);

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(p => p.Status == status);
            }

            return await query
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<int> CountPostsByUserIdAsync(int userId)
        {
            return await _context.Posts
                .Where(p => p.UserId == userId && p.Status == "Active")
                .CountAsync();
        }

        public async Task<bool> PostExistsAsync(int postId)
        {
            return await _context.Posts.AnyAsync(p => p.PostId == postId);
        }

        public async Task<IEnumerable<Post>> GetTrendingPostsAsync(int topCount = 10, int daysBack = 7)
        {
            var fromDate = DateTime.Now.AddDays(-daysBack);

            var trendingPosts = await _context.Posts
                .Include(p => p.User)
                .Include(p => p.Field)
                .Where(p => p.Status == "Active" && p.CreatedAt >= fromDate)
                .Select(p => new
                {
                    Post = p,
                    LikeCount = _context.PostLikes.Count(l => l.PostId == p.PostId),
                    CommentCount = _context.Comments.Count(c => c.PostId == p.PostId && c.Status == "Active")
                })
                .OrderByDescending(x => x.LikeCount + x.CommentCount)
                .Take(topCount)
                .Select(x => x.Post)
                .ToListAsync();

            return trendingPosts;
        }

        public async Task<(IEnumerable<Post> Posts, int TotalCount)> SearchPostsAsync(
            string keyword,
            int pageNumber,
            int pageSize)
        {
            var query = _context.Posts
                .Include(p => p.User)
                .Include(p => p.Field)
                .Where(p => p.Status == "Active" &&
                    (p.Title.Contains(keyword) || p.Content.Contains(keyword)));

            var totalCount = await query.CountAsync();
            var posts = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (posts, totalCount);
        }
    }
}