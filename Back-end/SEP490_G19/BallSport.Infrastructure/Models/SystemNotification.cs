using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class SystemNotification
{
    public int NotificationId { get; set; }

    public string Title { get; set; } = null!;

    public string Content { get; set; } = null!;

    public string? NotificationType { get; set; }

    public string? SentToRole { get; set; }

    public string? SentToSpecificUsers { get; set; }

    public bool? InsUrgent { get; set; }

    public int SentBy { get; set; }

    public DateTime? SentAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public virtual User SentByNavigation { get; set; } = null!;
}
