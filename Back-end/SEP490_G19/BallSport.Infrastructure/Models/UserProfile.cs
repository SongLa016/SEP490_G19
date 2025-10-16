using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class UserProfile
{
    public int ProfileId { get; set; }

    public int? UserId { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    public string? Gender { get; set; }

    public string? Address { get; set; }

    public string? PreferredPositions { get; set; }

    public string? SkillLevel { get; set; }

    public string? Bio { get; set; }

    public virtual User? User { get; set; }
}
