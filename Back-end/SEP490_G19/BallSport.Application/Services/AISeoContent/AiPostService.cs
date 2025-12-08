using BallSport.Application.DTOs.AISeoContent;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

public class AiPostService
{
    private readonly Sep490G19v1Context _context;

    public AiPostService(Sep490G19v1Context context)
    {
        _context = context;
    }

    // Danh sách bài viết (có phân trang)
    public async Task<List<AiPostListDto>> GetPostsAsync(int page = 1, int pageSize = 10)
    {
        return await _context.AiPosts
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AiPostListDto
            {
                PostId = x.PostId,
                Title = x.Title,
                Slug = x.Slug,
                SeoDescription = x.SeoDescription,
                Type = x.Type,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();
    }

    // Chi tiết bài viết theo slug
    public async Task<AiPost?> GetPostBySlugAsync(string slug)
    {
        return await _context.AiPosts
            .FirstOrDefaultAsync(x => x.Slug == slug);
    }
}
