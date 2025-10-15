using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class Team
{
    public int TeamId { get; set; }

    public string TeamName { get; set; } = null!;

    public int CreatedBy { get; set; }

    public string ContactPhone { get; set; } = null!;

    public string? Description { get; set; }

    public string? PreferredSkillLevel { get; set; }

    public string? PreferredPositions { get; set; }

    public int? CurrentMembers { get; set; }

    public int MaxMembers { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User CreatedByNavigation { get; set; } = null!;

    public virtual ICollection<TeamJoinRequest> TeamJoinRequests { get; set; } = new List<TeamJoinRequest>();
}
