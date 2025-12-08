using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class Rating
{
    public int RatingId { get; set; }

    public int BookingId { get; set; }

    public int UserId { get; set; }

    public int FieldId { get; set; }

    public int Stars { get; set; }

    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Booking Booking { get; set; } = null!;

    public virtual Field Field { get; set; } = null!;

    public virtual ICollection<RatingReply> RatingReplies { get; set; } = new List<RatingReply>();

    public virtual User User { get; set; } = null!;
}
