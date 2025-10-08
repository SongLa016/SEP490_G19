using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class ViolationReport
{
    public int ReportId { get; set; }

    public int ReportedUserId { get; set; }

    public int ReporterId { get; set; }

    public string ReportType { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User ReportedUser { get; set; } = null!;

    public virtual User Reporter { get; set; } = null!;
}
