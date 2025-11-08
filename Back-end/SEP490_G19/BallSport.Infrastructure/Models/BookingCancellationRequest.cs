using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class BookingCancellationRequest
{
    public int RequestId { get; set; }

    public int BookingId { get; set; }

    public int RequestedByUserId { get; set; }

    public string RequestedByRole { get; set; } = null!;

    public string? RequestReason { get; set; }

    public DateTime? RequestedAt { get; set; }

    public string? RequestStatus { get; set; }

    public DateTime? ProcessedAt { get; set; }

    public decimal? RefundAmount { get; set; }

    public decimal? PenaltyAmount { get; set; }

    public DateTime? UndoAllowedUntil { get; set; }

    public int? ReversedByUserId { get; set; }

    public DateTime? ReversedAt { get; set; }

    public string? ReversalReason { get; set; }

    public decimal? FinalRefundAmount { get; set; }

    public virtual Booking Booking { get; set; } = null!;

    public virtual ICollection<BookingCancellation> BookingCancellations { get; set; } = new List<BookingCancellation>();

    public virtual User RequestedByUser { get; set; } = null!;

    public virtual User? ReversedByUser { get; set; }
}
