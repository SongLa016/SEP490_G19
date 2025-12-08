using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Application.Services.AISeoContent
{
    public class AiAutoPostService
    {
        private readonly Sep490G19v1Context _context;
        private readonly AiContentService _aiContentService;
        private readonly AiDataService _aiDataService;

        public AiAutoPostService(
            Sep490G19v1Context context,
            AiContentService aiContentService,
            AiDataService aiDataService)
        {
            _context = context;
            _aiContentService = aiContentService;
            _aiDataService = aiDataService;
        }

        public async Task RunDailyAsync()
        {
            var cutoff = DateTime.Now.AddDays(-30);

            // 1️ Lọc sân đã được SEO trong 30 ngày → loại
            var blockedIds = await _context.FieldComplexes
                .Where(x => x.LastAutoPostAt != null && x.LastAutoPostAt > cutoff)
                .Select(x => x.ComplexId)
                .ToListAsync();

            // 2️ Tính rating trung bình > 4 sao
            var goodComplexIds = await _context.Ratings
                .Join(_context.Fields,
                    r => r.FieldId,
                    f => f.FieldId,
                    (r, f) => new { r.Stars, f.ComplexId })
                .GroupBy(x => x.ComplexId)
                .Where(g => g.Average(x => x.Stars) > 4)
                .Select(g => g.Key!.Value)
                .ToListAsync();


            // 3️ Lọc sân hợp lệ
            var candidates = goodComplexIds
                .Except(blockedIds)
                .OrderBy(x => Guid.NewGuid())
                .Take(2)
                .ToList();

            // 4️ Sinh bài cho từng sân
            foreach (var complexId in candidates)
            {
                var data = await _aiDataService.GetComplexDataAsync(complexId);
                if (data == null) continue;

                var aiContent = await _aiContentService.GenerateReviewContentAsync(data);

                var title = $"Review sân bóng {data.Name} {data.District}";
                var baseSlug = Regex.Replace(title.ToLower(), @"[^\w\s-]", "").Replace(" ", "-");
                var slug = baseSlug;
                int i = 1;

                while (await _context.AiPosts.AnyAsync(x => x.Slug == slug))
                {
                    slug = $"{baseSlug}-{i++}";
                }

                var post = new AiPost
                {
                    Title = title,
                    Slug = slug,
                    Content = aiContent,
                    SeoTitle = title,
                    SeoDescription = $"Đánh giá sân {data.Name}",
                    SeoKeywords = $"sân bóng {data.District}",
                    ComplexId = complexId,
                    Type = "Review",
                    CreatedAt = DateTime.Now,
                    IsPublished = true,
                    IsAutoPublished = true

                };

                _context.AiPosts.Add(post);

                var complex = await _context.FieldComplexes
                    .FirstOrDefaultAsync(x => x.ComplexId == complexId);

                if (complex != null)
                    complex.LastAutoPostAt = DateTime.Now;

                await _context.SaveChangesAsync();
            }
        }
    }

}
