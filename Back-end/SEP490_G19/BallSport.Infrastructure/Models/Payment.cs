using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class Payment
{
    public int PaymentId { get; set; }

    public int? BookingId { get; set; }

    public decimal Amount { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? Method { get; set; }

    public string? TransactionCode { get; set; }

    public string? OrderCode { get; set; }

    public string? PayOrderInfo { get; set; }

    public string? ResponseCode { get; set; }

    public string? PayUrl { get; set; }

    public DateTime? PaidAt { get; set; }

    public string? PaymentType { get; set; }

    public virtual Booking? Booking { get; set; }
}