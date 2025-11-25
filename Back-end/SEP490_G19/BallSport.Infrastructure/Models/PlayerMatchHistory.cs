using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class PlayerMatchHistory
{
    public int HistoryId { get; set; }

    public int UserId { get; set; }

    public int MatchRequestId { get; set; }

    public string Role { get; set; } = null!;

    public string FinalStatus { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? OpponentUserId { get; set; }

    public virtual MatchRequest MatchRequest { get; set; } = null!;

    public virtual User? OpponentUser { get; set; }

    public virtual User User { get; set; } = null!;
}
