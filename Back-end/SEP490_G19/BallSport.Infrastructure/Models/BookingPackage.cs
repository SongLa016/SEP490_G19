using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class BookingPackage
{
    public int BookingPackageId { get; set; }

    public int UserId { get; set; }

    public int FieldId { get; set; }

    public string PackageName { get; set; } = null!;

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public decimal TotalPrice { get; set; }

    public string? BookingStatus { get; set; }

    public string? PaymentStatus { get; set; }

    public string? Qrcode { get; set; }

    public DateTime? QrexpiresAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Field Field { get; set; } = null!;

    public virtual ICollection<MonthlyPackagePayment> MonthlyPackagePayments { get; set; } = new List<MonthlyPackagePayment>();

    public virtual ICollection<PackageSession> PackageSessions { get; set; } = new List<PackageSession>();

    public virtual User User { get; set; } = null!;
}
