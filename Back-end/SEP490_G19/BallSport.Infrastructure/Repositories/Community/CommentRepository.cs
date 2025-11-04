using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories.Community
{
    public class CommentRepository : ICommentRepository
    {
        private readonly Sep490G19v1Context _context;

        public CommentRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Comment>> GetCommentsByPostIdAsync(int postId, string? status = "Active")
        {
            var query = _context.Comments
                .Include(c => c.User)
                .Include(c => c.ParentComment)
                .Where(c => c.PostId == postId);

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(c => c.Status == status);
            }

            return await query
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<Comment?> GetCommentByIdAsync(int commentId)
        {
            return await _context.Comments
                .Include(c => c.User)
                .Include(c => c.Post)
                .Include(c => c.ParentComment)
                .FirstOrDefaultAsync(c => c.CommentId == commentId);
        }

        public async Task<Comment> CreateCommentAsync(Comment comment)
        {
            comment.CreatedAt = DateTime.Now;
            comment.Status = "Active";

            await _context.Comments.AddAsync(comment);
            await _context.SaveChangesAsync();

            return comment;
        }

        public async Task<Comment?> UpdateCommentAsync(Comment comment)
        {
            var existingComment = await _context.Comments.FindAsync(comment.CommentId);
            if (existingComment == null)
                return null;

            existingComment.Content = comment.Content;

            await _context.SaveChangesAsync();
            return existingComment;
        }

        public async Task<bool> DeleteCommentAsync(int commentId)
        {
            var comment = await _context.Comments.FindAsync(commentId);
            if (comment == null)
                return false;

            comment.Status = "Deleted";

            // Xóa luôn các reply (comment con)
            var replies = await _context.Comments
                .Where(c => c.ParentCommentId == commentId)
                .ToListAsync();

            foreach (var reply in replies)
            {
                reply.Status = "Deleted";
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Comment>> GetRepliesByCommentIdAsync(int parentCommentId, string? status = "Active")
        {
            var query = _context.Comments
                .Include(c => c.User)
                .Where(c => c.ParentCommentId == parentCommentId);

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(c => c.Status == status);
            }

            return await query
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<int> CountCommentsByPostIdAsync(int postId)
        {
            return await _context.Comments
                .Where(c => c.PostId == postId && c.Status == "Active")
                .CountAsync();
        }

        public async Task<int> CountCommentsByUserIdAsync(int userId)
        {
            return await _context.Comments
                .Where(c => c.UserId == userId && c.Status == "Active")
                .CountAsync();
        }

        public async Task<bool> CommentExistsAsync(int commentId)
        {
            return await _context.Comments.AnyAsync(c => c.CommentId == commentId);
        }

        public async Task<IEnumerable<Comment>> GetCommentsByUserIdAsync(int userId, string? status = "Active")
        {
            var query = _context.Comments
                .Include(c => c.User)
                .Include(c => c.Post)
                .Where(c => c.UserId == userId);

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(c => c.Status == status);
            }

            return await query
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> DeleteCommentsByPostIdAsync(int postId)
        {
            var comments = await _context.Comments
                .Where(c => c.PostId == postId)
                .ToListAsync();

            foreach (var comment in comments)
            {
                comment.Status = "Deleted";
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}