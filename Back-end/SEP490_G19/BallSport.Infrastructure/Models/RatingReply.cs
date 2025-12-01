using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class RatingReply
{
    public int ReplyId { get; set; }

    public int RatingId { get; set; }

    public int UserId { get; set; }

    public string ReplyText { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual Rating Rating { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
