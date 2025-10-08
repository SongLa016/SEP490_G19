using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class DepositPolicy
{
    public int DepositPolicyId { get; set; }

    public int FieldId { get; set; }

    public decimal DepositPercent { get; set; }

    public decimal? MinDeposit { get; set; }

    public decimal? MaxDeposit { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Field Field { get; set; } = null!;
}
