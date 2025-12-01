// File: BallSport.Infrastructure.Repositories/Community/PostRepository.cs
 
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

        // 1. LẤY DANH SÁCH BÀI VIẾT (Active / Pending / Rejected)
        public async Task<(IEnumerable<Post> Posts, int TotalCount)> GetAllPostsAsync(
            int pageNumber, int pageSize, string? status = "Active", int? fieldId = null, int? userId = null)
        {
            var query = _context.Posts
                .Include(p => p.User)
                .Include(p => p.Field)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = status switch
                {
                    "Active" => query.Where(p => p.Status == "Active"),
                    "Pending" => query.Where(p => p.Status == "Pending"),
                    "Rejected" => query.Where(p => p.Status == "Rejected"),
                    _ => query.Where(p => p.Status == "Active")
                };
            }

            if (fieldId.HasValue)
                query = query.Where(p => p.FieldId == fieldId.Value);

            if (userId.HasValue)
                query = query.Where(p => p.UserId == userId.Value);

            query = query.OrderByDescending(p => p.CreatedAt);

            var totalCount = await query.CountAsync();
            var posts = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (posts, totalCount);
        }

        // 2. LẤY CHI TIẾT 1 BÀI
        public async Task<Post?> GetPostByIdAsync(int postId)
        {
            return await _context.Posts
                .Include(p => p.User)
                .Include(p => p.Field)
                .FirstOrDefaultAsync(p => p.PostId == postId);
        }

        // 3. TẠO BÀI MỚI → TỰ ĐỘNG PENDING
        public async Task<Post> CreatePostAsync(Post post)
        {
            post.CreatedAt = DateTime.UtcNow;
            post.Status = "Pending"; // ← BẮT BUỘC CHỜ DUYỆT
            _context.Posts.Add(post);
            await _context.SaveChangesAsync();
            return post;
        }

        // 4. CẬP NHẬT BÀI
        public async Task<Post?> UpdatePostAsync(Post post)
        {
            var existing = await _context.Posts.FindAsync(post.PostId);
            if (existing == null) return null;

            existing.Title = post.Title;
            existing.Content = post.Content;
            existing.MediaUrl = post.MediaUrl;
            existing.FieldId = post.FieldId;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existing;
        }

        // 5. XÓA THẬT (HARD DELETE) – DÙNG CHO USER + ADMIN
        public async Task<bool> HardDeletePostAsync(int postId)
        {
            var post = await _context.Posts
                .Include(p => p.PostLikes)
                .Include(p => p.Comments)
                .FirstOrDefaultAsync(p => p.PostId == postId);

            if (post == null) return false;

            _context.PostLikes.RemoveRange(post.PostLikes);
            _context.Comments.RemoveRange(post.Comments);
            _context.Posts.Remove(post);

            await _context.SaveChangesAsync();
            return true;
        }

        // 6. USER TỰ XÓA BÀI CỦA MÌNH → XÓA THẬT
        public async Task<bool> DeleteMyPostAsync(int postId, int userId)
        {
            var post = await _context.Posts
                .Include(p => p.PostLikes)
                .Include(p => p.Comments)
                .FirstOrDefaultAsync(p => p.PostId == postId && p.UserId == userId);

            if (post == null) return false;

            _context.PostLikes.RemoveRange(post.PostLikes);
            _context.Comments.RemoveRange(post.Comments);
            _context.Posts.Remove(post);

            await _context.SaveChangesAsync();
            return true;
        }

        // 7. ADMIN DUYỆT BÀI: Pending → Active / Rejected
        public async Task<bool> ReviewPostAsync(int postId, string newStatus)
        {
            if (!new[] { "Active", "Rejected" }.Contains(newStatus)) return false;

            var post = await _context.Posts.FindAsync(postId);
            if (post == null || post.Status != "Pending") return false;

            post.Status = newStatus;
            post.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        // 8. ADMIN XÓA BÀI VI PHẠM → DÙNG HARD DELETE (không cần Moderate nữa)
        public async Task<bool> ModeratePostAsync(int postId, string newStatus)
        {
            if (newStatus != "Deleted") return false;
            return await HardDeletePostAsync(postId);
        }

        // 9. LẤY DANH SÁCH BÀI ĐANG CHỜ DUYỆT (CHO ADMIN)
        public async Task<(IEnumerable<Post> Posts, int TotalCount)> GetPendingPostsAsync(
            int pageNumber = 1, int pageSize = 20)
        {
            var query = _context.Posts
                .Include(p => p.User)
                .Include(p => p.Field)
                .Where(p => p.Status == "Pending")
                .OrderByDescending(p => p.CreatedAt);

            var totalCount = await query.CountAsync();
            var posts = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (posts, totalCount);
        }

        // CÁC METHOD KHÁC – GIỮ NGUYÊN 100% (BẠN VIẾT SIÊU TỐT!)
        public async Task<IEnumerable<Post>> GetPostsByUserIdAsync(int userId, string? status = "Active")
        {
            var query = _context.Posts
                .Include(p => p.User)
                .Include(p => p.Field)
                .Where(p => p.UserId == userId);

            if (!string.IsNullOrEmpty(status) && status != "All")
                query = query.Where(p => p.Status == status);

            return await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        }

        public async Task<IEnumerable<Post>> GetPostsByFieldIdAsync(int fieldId, string? status = "Active")
        {
            var query = _context.Posts
                .Include(p => p.User)
                .Include(p => p.Field)
                .Where(p => p.FieldId == fieldId);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(p => p.Status == status);

            return await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
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
            var fromDate = DateTime.UtcNow.AddDays(-daysBack);
            return await _context.Posts
                .Include(p => p.User)
                .Include(p => p.Field)
                .Where(p => p.Status == "Active" && p.CreatedAt >= fromDate)
                .OrderByDescending(p => p.PostLikes.Count + p.Comments.Count)
                .Take(topCount)
                .ToListAsync();
        }

        public async Task<(IEnumerable<Post> Posts, int TotalCount)> SearchPostsAsync(
            string keyword, int pageNumber, int pageSize)
        {
            var query = _context.Posts
                .Include(p => p.User)
                .Include(p => p.Field)
                .Where(p => p.Status == "Active" &&
                    (EF.Functions.Like(p.Title ?? "", $"%{keyword}%") ||
                     EF.Functions.Like(p.Content, $"%{keyword}%")));

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