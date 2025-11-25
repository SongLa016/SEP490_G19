using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class MonthlyPackagePayment
{
    public int PaymentId { get; set; }

    public int BookingPackageId { get; set; }

    public int UserId { get; set; }

    public decimal Amount { get; set; }

    public int TotalSlots { get; set; }

    public string? Method { get; set; }

    public string? TransactionCode { get; set; }

    public string? Status { get; set; }

    public DateTime? PaidAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual BookingPackage BookingPackage { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
