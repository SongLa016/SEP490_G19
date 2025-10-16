using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class Payment
{
    public int PaymentId { get; set; }

    public int? BookingId { get; set; }

    public decimal Amount { get; set; }

    public string VnpayTransactionCode { get; set; } = null!;

    public string? VnpayOrderInfo { get; set; }

    public string? VnpayResponseCode { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Booking? Booking { get; set; }
}
