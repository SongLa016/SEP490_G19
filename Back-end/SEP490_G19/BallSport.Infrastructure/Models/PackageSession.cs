using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class PackageSession
{
    public int PackageSessionId { get; set; }

    public int BookingPackageId { get; set; }

    public int ScheduleId { get; set; }

    public DateOnly SessionDate { get; set; }

    public decimal PricePerSession { get; set; }

    public string? SessionStatus { get; set; }

    public int UserId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual BookingPackage BookingPackage { get; set; } = null!;

    public virtual FieldSchedule Schedule { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
