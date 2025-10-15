using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class TeamJoinRequest
{
    public int RequestId { get; set; }

    public int TeamId { get; set; }

    public int UserId { get; set; }

    public string? Message { get; set; }

    public string? Status { get; set; }

    public DateTime? RequestedAt { get; set; }

    public DateTime? RespondedAt { get; set; }

    public int? RespondedBy { get; set; }

    public virtual User? RespondedByNavigation { get; set; }

    public virtual Team Team { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
