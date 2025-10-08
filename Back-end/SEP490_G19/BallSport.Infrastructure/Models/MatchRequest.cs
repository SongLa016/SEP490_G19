using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class MatchRequest
{
    public int MatchRequestId { get; set; }

    public int BookingId { get; set; }

    public int CreatedBy { get; set; }

    public string? Description { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Booking Booking { get; set; } = null!;

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public virtual User CreatedByNavigation { get; set; } = null!;

    public virtual ICollection<MatchParticipant> MatchParticipants { get; set; } = new List<MatchParticipant>();

    public virtual ICollection<PlayerMatchHistory> PlayerMatchHistories { get; set; } = new List<PlayerMatchHistory>();
}
