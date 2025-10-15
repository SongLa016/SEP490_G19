using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class CancellationPolicy
{
    public int PolicyId { get; set; }

    public int FieldId { get; set; }

    public int CancelBeforeHours { get; set; }

    public decimal RefundRate { get; set; }

    public decimal? OwnerPenaltyRate { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Field Field { get; set; } = null!;
}
