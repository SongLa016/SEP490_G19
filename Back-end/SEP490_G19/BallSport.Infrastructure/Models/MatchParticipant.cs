using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class MatchParticipant
{
    public int ParticipantId { get; set; }

    public int MatchRequestId { get; set; }

    public int UserId { get; set; }

    public string? TeamName { get; set; }

    public int? PlayerCount { get; set; }

    public string? ContactPhone { get; set; }

    public string? Note { get; set; }

    public string? StatusFromB { get; set; }

    public string? StatusFromA { get; set; }

    public DateTime? JoinedAt { get; set; }

    public DateTime? RespondedAt { get; set; }

    public virtual MatchRequest MatchRequest { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
