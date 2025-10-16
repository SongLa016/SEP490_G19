using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class MatchParticipant
{
    public int ParticipantId { get; set; }

    public int MatchRequestId { get; set; }

    public int UserId { get; set; }

    public bool? IsCreator { get; set; }

    public DateTime? JoinedAt { get; set; }

    public virtual MatchRequest MatchRequest { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
