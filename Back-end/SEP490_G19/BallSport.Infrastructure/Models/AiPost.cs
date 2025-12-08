using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class AiPost
{
    public int PostId { get; set; }

    public string? Title { get; set; }

    public string? Slug { get; set; }

    public string? Content { get; set; }

    public string? SeoTitle { get; set; }

    public string? SeoDescription { get; set; }

    public string? SeoKeywords { get; set; }

    public int? ComplexId { get; set; }

    public string? Type { get; set; }

    public DateTime? CreatedAt { get; set; }
}
