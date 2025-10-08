using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class Post
{
    public int PostId { get; set; }

    public int UserId { get; set; }

    public string? Title { get; set; }

    public string Content { get; set; } = null!;

    public string? MediaUrl { get; set; }

    public int? FieldId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? Status { get; set; }

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public virtual Field? Field { get; set; }

    public virtual ICollection<PostLike> PostLikes { get; set; } = new List<PostLike>();

    public virtual User User { get; set; } = null!;
}
