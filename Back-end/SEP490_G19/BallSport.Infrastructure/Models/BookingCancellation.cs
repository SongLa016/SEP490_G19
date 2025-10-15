using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class BookingCancellation
{
    public int CancellationId { get; set; }

    public int BookingId { get; set; }

    public int? RequestId { get; set; }

    public string CancelledBy { get; set; } = null!;

    public string? CancelReason { get; set; }

    public decimal RefundAmount { get; set; }

    public decimal? PenaltyAmount { get; set; }

    public DateTime? CreatedAt { get; set; }

    public int? VerifiedBy { get; set; }

    public DateTime? VerifiedAt { get; set; }

    public virtual Booking Booking { get; set; } = null!;

    public virtual BookingCancellationRequest? Request { get; set; }

    public virtual User? VerifiedByNavigation { get; set; }
}
