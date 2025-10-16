using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class Report
{
    public int ReportId { get; set; }

    public int ReporterId { get; set; }

    public string TargetType { get; set; } = null!;

    public int TargetId { get; set; }

    public string Reason { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public string? Status { get; set; }

    public int? HandledBy { get; set; }

    public virtual User? HandledByNavigation { get; set; }

    public virtual User Reporter { get; set; } = null!;
}
