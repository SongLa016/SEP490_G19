// File: BallSport.Infrastructure.Repositories/Community/CommentRepository.cs
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
                    .ThenInclude(p => p!.User)
                .Where(c => c.PostId == postId);

            if (status != null)
                query = query.Where(c => c.Status == status);

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
                    .ThenInclude(p => p!.User)
                .FirstOrDefaultAsync(c => c.CommentId == commentId);
        }

        public async Task<Comment> CreateCommentAsync(Comment comment)
        {
            comment.CreatedAt = DateTime.UtcNow;
            comment.Status = "Active";

            await _context.Comments.AddAsync(comment);
            await _context.SaveChangesAsync();
            return comment;
        }

        public async Task<Comment?> UpdateCommentAsync(Comment comment)
        {
            var existing = await _context.Comments.FindAsync(comment.CommentId);
            if (existing == null) return null;

            existing.Content = comment.Content;
            // Không có UpdatedAt → không set

            await _context.SaveChangesAsync();
            return existing;
        }

        // HARD DELETE 1 COMMENT + TẤT CẢ REPLY (ĐỆ QUY) – KHÔNG CẦN CommentLikes
        public async Task<bool> HardDeleteCommentAsync(int commentId)
        {
            var comment = await _context.Comments
                .Include(c => c.InverseParentComment) // Đây là các reply (comment con)
                .FirstOrDefaultAsync(c => c.CommentId == commentId);

            if (comment == null) return false;

            // XÓA ĐỆ QUY TẤT CẢ REPLY TRƯỚC
            if (comment.InverseParentComment.Any())
            {
                foreach (var reply in comment.InverseParentComment.ToList())
                {
                    await HardDeleteCommentAsync(reply.CommentId);
                }
            }

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();
            return true;
        }

        // HARD DELETE TẤT CẢ COMMENT CỦA 1 BÀI VIẾT
        public async Task<bool> HardDeleteCommentsByPostIdAsync(int postId)
        {
            var comments = await _context.Comments
                .Where(c => c.PostId == postId)
                .ToListAsync();

            if (!comments.Any()) return true;

            _context.Comments.RemoveRange(comments);
            await _context.SaveChangesAsync();
            return true;
        }

        // XÓA TẤT CẢ REPLY CỦA 1 COMMENT
        public async Task<bool> HardDeleteRepliesByParentIdAsync(int parentCommentId)
        {
            var replies = await _context.Comments
                .Where(c => c.ParentCommentId == parentCommentId)
                .ToListAsync();

            if (!replies.Any()) return true;

            _context.Comments.RemoveRange(replies);
            await _context.SaveChangesAsync();
            return true;
        }

        // DÙNG HARD DELETE LUÔN CHO CẢ 2 METHOD CŨ
        public async Task<bool> DeleteCommentAsync(int commentId)
            => await HardDeleteCommentAsync(commentId);

        public async Task<bool> DeleteCommentsByPostIdAsync(int postId)
            => await HardDeleteCommentsByPostIdAsync(postId);

        public async Task<IEnumerable<Comment>> GetRepliesByCommentIdAsync(int parentCommentId, string? status = "Active")
        {
            var query = _context.Comments
                .Include(c => c.User)
                .Where(c => c.ParentCommentId == parentCommentId);

            if (status != null)
                query = query.Where(c => c.Status == status);

            return await query
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<int> CountCommentsByPostIdAsync(int postId)
        {
            return await _context.Comments
                .CountAsync(c => c.PostId == postId && c.Status == "Active");
        }

        public async Task<int> CountCommentsByUserIdAsync(int userId)
        {
            return await _context.Comments
                .CountAsync(c => c.UserId == userId && c.Status == "Active");
        }

        public async Task<bool> CommentExistsAsync(int commentId)
            => await _context.Comments.AnyAsync(c => c.CommentId == commentId);

        public async Task<IEnumerable<Comment>> GetCommentsByUserIdAsync(int userId, string? status = "Active")
        {
            var query = _context.Comments
                .Include(c => c.User)
                .Include(c => c.Post)
                .Where(c => c.UserId == userId);

            if (status != null)
                query = query.Where(c => c.Status == status);

            return await query
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }
    }
}