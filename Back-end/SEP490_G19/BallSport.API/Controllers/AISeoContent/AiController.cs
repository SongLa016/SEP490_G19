using System.Text.RegularExpressions;
using BallSport.Application.Services.AISeoContent;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/ai")]
public class AiController : ControllerBase
{
    private readonly AiDataService _aiDataService;

    public AiController(AiDataService aiDataService)
    {
        _aiDataService = aiDataService;
    }

    // ✅ LẤY DATA SÂN CHO AI
    [HttpGet("data/complex/{id}")]
    public async Task<IActionResult> GetComplexData(int id)
    {
        var data = await _aiDataService.GetComplexDataAsync(id);

        if (data == null)
            return NotFound(new { message = "Không tìm thấy sân bóng" });

        return Ok(data);
    }

    // ✅ HÀM TẠO SLUG CHUẨN SEO
    private string GenerateSlug(string text)
    {
        text = text.ToLower().Trim();
        text = Regex.Replace(text, @"[^\w\s-]", "");
        text = Regex.Replace(text, @"\s+", "-");
        return text;
    }

    // ✅ GET: /api/ai/posts?page=1&pageSize=10
    [HttpGet("posts")]
    public async Task<IActionResult> GetPosts(
        [FromServices] AiPostService aiPostService,
        int page = 1,
        int pageSize = 10)
    {
        var posts = await aiPostService.GetPostsAsync(page, pageSize);
        return Ok(posts);
    }

    // GET: /api/ai/posts/{slug}
    [HttpGet("posts/{slug}")]
    public async Task<IActionResult> GetPostBySlug(
        string slug,
        [FromServices] AiPostService aiPostService)
    {
        var post = await aiPostService.GetPostBySlugAsync(slug);

        if (post == null)
            return NotFound(new { message = "Không tìm thấy bài viết" });

        return Ok(post);
    }

    //  TEST AUTO SEO THỦ CÔNG
    [HttpPost("auto-run")]
    public async Task<IActionResult> RunAutoSeo(
        [FromServices] AiAutoPostService autoPostService)
    {
        await autoPostService.RunDailyAsync();

        return Ok(new
        {
            message = "✅ AUTO SEO ĐÃ CHẠY XONG",
            time = DateTime.Now
        });
    }

}
