using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class PayoutTransaction
{
    public int PayoutId { get; set; }

    public int OwnerId { get; set; }

    public int PaymentId { get; set; }

    public decimal Amount { get; set; }

    public string? Status { get; set; }

    public string? TransactionCode { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public virtual User Owner { get; set; } = null!;

    public virtual Payment Payment { get; set; } = null!;
}
