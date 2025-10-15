using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class Booking
{
    public int BookingId { get; set; }

    public int UserId { get; set; }

    public int ScheduleId { get; set; }

    public decimal TotalPrice { get; set; }

    public decimal DepositAmount { get; set; }

    public decimal? RemainingAmount { get; set; }

    public string? BookingStatus { get; set; }

    public string? PaymentStatus { get; set; }

    public bool? HasOpponent { get; set; }

    public int? MatchRequestId { get; set; }

    public string? Qrcode { get; set; }

    public DateTime? QrexpiresAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? ConfirmedAt { get; set; }

    public DateTime? CancelledAt { get; set; }

    public string? CancelledBy { get; set; }

    public string? CancelReason { get; set; }

    public virtual ICollection<BookingCancellationRequest> BookingCancellationRequests { get; set; } = new List<BookingCancellationRequest>();

    public virtual ICollection<BookingCancellation> BookingCancellations { get; set; } = new List<BookingCancellation>();

    public virtual MatchRequest? MatchRequest { get; set; }

    public virtual ICollection<MatchRequest> MatchRequests { get; set; } = new List<MatchRequest>();

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual FieldSchedule Schedule { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
